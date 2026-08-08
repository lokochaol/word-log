package com.wordencounter.wordencounter.service;

import com.wordencounter.wordencounter.dto.AddRelatedWordRequest;
import com.wordencounter.wordencounter.dto.CreateWordRequest;
import com.wordencounter.wordencounter.dto.MeaningBlockResponse;
import com.wordencounter.wordencounter.dto.PageResponse;
import com.wordencounter.wordencounter.dto.RelatedSuggestionResponse;
import com.wordencounter.wordencounter.dto.RelatedWordResponse;
import com.wordencounter.wordencounter.dto.ReplaceMeaningBlocksRequest;
import com.wordencounter.wordencounter.dto.SearchResultResponse;
import com.wordencounter.wordencounter.dto.WordDetailResponse;
import com.wordencounter.wordencounter.dto.WordSummaryResponse;
import com.wordencounter.wordencounter.entity.Word;
import com.wordencounter.wordencounter.entity.WordMeaningBlock;
import com.wordencounter.wordencounter.entity.WordRelation;
import com.wordencounter.wordencounter.exception.ConflictException;
import com.wordencounter.wordencounter.exception.ResourceNotFoundException;
import com.wordencounter.wordencounter.repository.WordRelationRepository;
import com.wordencounter.wordencounter.repository.WordRepository;
import com.wordencounter.wordencounter.repository.search.WordDocument;
import com.wordencounter.wordencounter.repository.search.WordSearchQueryService;
import com.wordencounter.wordencounter.repository.search.WordSearchRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class WordService {

    private final WordRepository wordRepository;
    private final WordRelationRepository wordRelationRepository;
    private final WordSearchRepository wordSearchRepository;
    private final WordSearchQueryService wordSearchQueryService;

    public WordService(
            WordRepository wordRepository,
            WordRelationRepository wordRelationRepository,
            WordSearchRepository wordSearchRepository,
            WordSearchQueryService wordSearchQueryService) {
        this.wordRepository = wordRepository;
        this.wordRelationRepository = wordRelationRepository;
        this.wordSearchRepository = wordSearchRepository;
        this.wordSearchQueryService = wordSearchQueryService;
    }

    @Transactional(readOnly = true)
    public PageResponse<WordSummaryResponse> listChronological(String ownerSub, Pageable pageable) {
        Page<Word> page = wordRepository.findByOwnerSubOrderByEncounteredAtAscCreatedAtAsc(ownerSub, pageable);
        return PageResponse.of(page.map(w -> new WordSummaryResponse(w.getId(), w.getText(), w.getEncounteredAt())));
    }

    @Transactional(readOnly = true)
    public WordDetailResponse getDetail(String ownerSub, UUID id) {
        Word word = requireOwnedWord(ownerSub, id);
        return toDetailResponse(ownerSub, word);
    }

    public WordDetailResponse create(String ownerSub, CreateWordRequest request) {
        String text = request.text().trim();
        if (wordRepository.existsByOwnerSubAndTextIgnoreCase(ownerSub, text)) {
            throw new ConflictException("\"" + text + "\" is already registered in your dictionary");
        }
        Word word = new Word(ownerSub, text, blankToNull(request.meaning()), Instant.now());
        wordRepository.save(word);
        syncToSearchIndex(word);
        return toDetailResponse(ownerSub, word);
    }

    public WordDetailResponse replaceMeaningBlocks(String ownerSub, UUID id, ReplaceMeaningBlocksRequest request) {
        Word word = requireOwnedWord(ownerSub, id);
        List<WordMeaningBlock> blocks = request.blocks().stream()
                .map(b -> new WordMeaningBlock(b.type(), b.content().trim(), blankToNull(b.language()), blankToNull(b.caption())))
                .toList();
        word.replaceMeaningBlocks(blocks);
        word.touch();
        syncToSearchIndex(word);
        return toDetailResponse(ownerSub, word);
    }

    public WordDetailResponse addRelatedWord(String ownerSub, UUID id, AddRelatedWordRequest request) {
        Word word = requireOwnedWord(ownerSub, id);
        String relatedText = request.text().trim();

        boolean alreadyRelated = word.getRelations().stream()
                .anyMatch(r -> r.getRelatedText().equalsIgnoreCase(relatedText));
        if (alreadyRelated) {
            throw new ConflictException("\"" + relatedText + "\" is already linked as a related word");
        }

        word.addRelation(new WordRelation(relatedText));
        word.touch();
        syncToSearchIndex(word);
        return toDetailResponse(ownerSub, word);
    }

    public void removeRelatedWord(String ownerSub, UUID id, UUID relationId) {
        Word word = requireOwnedWord(ownerSub, id);
        WordRelation relation = word.getRelations().stream()
                .filter(r -> r.getId().equals(relationId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Related word not found"));
        word.removeRelation(relation);
        word.touch();
        syncToSearchIndex(word);
    }

    /**
     * Suggests related-word candidates for {@code id}: other words in the same dictionary
     * whose text is a close spelling match, plus words that already list {@code id} as
     * their own related word but aren't linked back yet. Excludes words already related
     * and the word itself. Meant to be polled by the client as a slower, best-effort
     * background lookup rather than blocking the meaning-edit flow.
     */
    @Transactional(readOnly = true)
    public List<RelatedSuggestionResponse> suggestRelatedWords(String ownerSub, UUID id, int limit) {
        Word word = requireOwnedWord(ownerSub, id);

        Set<String> excludedLowerText = word.getRelations().stream()
                .map(r -> r.getRelatedText().toLowerCase())
                .collect(Collectors.toSet());
        excludedLowerText.add(word.getText().toLowerCase());

        Map<UUID, RelatedSuggestionResponse> suggestions = new LinkedHashMap<>();

        wordSearchQueryService.suggestByFuzzyText(ownerSub, word.getText(), word.getId().toString(), limit).stream()
                .filter(hit -> !excludedLowerText.contains(hit.document().getText().toLowerCase()))
                .forEach(hit -> suggestions.put(
                        UUID.fromString(hit.document().getId()),
                        new RelatedSuggestionResponse(
                                UUID.fromString(hit.document().getId()),
                                hit.document().getText(),
                                "FUZZY_MATCH",
                                hit.score())));

        wordRelationRepository
                .findByRelatedTextIgnoreCaseAndWord_OwnerSubAndWord_IdNot(word.getText(), ownerSub, word.getId())
                .stream()
                .map(WordRelation::getWord)
                .filter(candidate -> !excludedLowerText.contains(candidate.getText().toLowerCase()))
                .forEach(candidate -> suggestions.putIfAbsent(
                        candidate.getId(),
                        new RelatedSuggestionResponse(candidate.getId(), candidate.getText(), "REVERSE_RELATION", null)));

        return suggestions.values().stream().limit(limit).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SearchResultResponse> search(String ownerSub, String query, int limit) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        return wordSearchQueryService.search(ownerSub, query.trim(), limit).stream()
                .map(doc -> new SearchResultResponse(UUID.fromString(doc.getId()), doc.getText(), doc.getMeaning()))
                .collect(Collectors.toList());
    }

    private Word requireOwnedWord(String ownerSub, UUID id) {
        return wordRepository.findByIdAndOwnerSub(id, ownerSub)
                .orElseThrow(() -> new ResourceNotFoundException("Word not found: " + id));
    }

    private WordDetailResponse toDetailResponse(String ownerSub, Word word) {
        List<WordRelation> relations = word.getRelations();

        Map<String, UUID> existingWordIdsByLowerText = relations.isEmpty()
                ? Map.of()
                : wordRepository
                        .findByOwnerSubAndTextIgnoreCaseIn(
                                ownerSub, relations.stream().map(WordRelation::getRelatedText).toList())
                        .stream()
                        .collect(Collectors.toMap(w -> w.getText().toLowerCase(), Word::getId, (a, b) -> a));

        List<RelatedWordResponse> relatedWords = relations.stream()
                .map(r -> new RelatedWordResponse(
                        r.getId(),
                        r.getRelatedText(),
                        existingWordIdsByLowerText.get(r.getRelatedText().toLowerCase())))
                .collect(Collectors.toList());

        List<MeaningBlockResponse> meaningBlocks = word.getMeaningBlocks().stream()
                .map(b -> new MeaningBlockResponse(b.getId(), b.getType(), b.getContent(), b.getLanguage(), b.getCaption()))
                .collect(Collectors.toList());

        return new WordDetailResponse(
                word.getId(),
                word.getText(),
                word.getMeaning(),
                meaningBlocks,
                word.getEncounteredAt(),
                word.getUpdatedAt(),
                relatedWords);
    }

    private void syncToSearchIndex(Word word) {
        List<String> relatedTexts = word.getRelations().stream().map(WordRelation::getRelatedText).toList();
        String searchableMeaning = buildSearchableMeaning(word);
        wordSearchRepository.save(WordDocument.builder()
                .id(word.getId().toString())
                .ownerSub(word.getOwnerSub())
                .text(word.getText())
                .meaning(searchableMeaning)
                .relatedTexts(relatedTexts)
                .encounteredAt(word.getEncounteredAt())
                .build());
    }

    /** Joins TEXT/CODE block content and IMAGE captions so they're all searchable. */
    private static String buildSearchableMeaning(Word word) {
        List<String> parts = new ArrayList<>();
        if (word.getMeaning() != null) {
            parts.add(word.getMeaning());
        }
        for (WordMeaningBlock block : word.getMeaningBlocks()) {
            switch (block.getType()) {
                case CODE -> parts.add(block.getContent());
                case IMAGE -> {
                    if (block.getCaption() != null) parts.add(block.getCaption());
                }
                default -> {
                    // TEXT is already folded into word.getMeaning(); MERMAID source isn't prose.
                }
            }
        }
        return parts.isEmpty() ? null : String.join("\n\n", parts);
    }

    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }
}
