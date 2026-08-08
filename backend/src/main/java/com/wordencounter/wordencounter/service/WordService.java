package com.wordencounter.wordencounter.service;

import com.wordencounter.wordencounter.dto.AddRelatedWordRequest;
import com.wordencounter.wordencounter.dto.CreateWordRequest;
import com.wordencounter.wordencounter.dto.PageResponse;
import com.wordencounter.wordencounter.dto.RelatedWordResponse;
import com.wordencounter.wordencounter.dto.SearchResultResponse;
import com.wordencounter.wordencounter.dto.UpdateMeaningRequest;
import com.wordencounter.wordencounter.dto.WordDetailResponse;
import com.wordencounter.wordencounter.dto.WordSummaryResponse;
import com.wordencounter.wordencounter.entity.Word;
import com.wordencounter.wordencounter.entity.WordRelation;
import com.wordencounter.wordencounter.exception.ConflictException;
import com.wordencounter.wordencounter.exception.ResourceNotFoundException;
import com.wordencounter.wordencounter.repository.WordRepository;
import com.wordencounter.wordencounter.repository.search.WordDocument;
import com.wordencounter.wordencounter.repository.search.WordSearchQueryService;
import com.wordencounter.wordencounter.repository.search.WordSearchRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
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
    private final WordSearchRepository wordSearchRepository;
    private final WordSearchQueryService wordSearchQueryService;

    public WordService(
            WordRepository wordRepository,
            WordSearchRepository wordSearchRepository,
            WordSearchQueryService wordSearchQueryService) {
        this.wordRepository = wordRepository;
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

    public WordDetailResponse updateMeaning(String ownerSub, UUID id, UpdateMeaningRequest request) {
        Word word = requireOwnedWord(ownerSub, id);
        word.setMeaning(blankToNull(request.meaning()));
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

        return new WordDetailResponse(
                word.getId(), word.getText(), word.getMeaning(), word.getEncounteredAt(), word.getUpdatedAt(), relatedWords);
    }

    private void syncToSearchIndex(Word word) {
        List<String> relatedTexts = word.getRelations().stream().map(WordRelation::getRelatedText).toList();
        wordSearchRepository.save(WordDocument.builder()
                .id(word.getId().toString())
                .ownerSub(word.getOwnerSub())
                .text(word.getText())
                .meaning(word.getMeaning())
                .relatedTexts(relatedTexts)
                .encounteredAt(word.getEncounteredAt())
                .build());
    }

    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }
}
