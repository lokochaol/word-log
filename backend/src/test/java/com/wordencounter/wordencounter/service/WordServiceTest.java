package com.wordencounter.wordencounter.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.wordencounter.wordencounter.dto.AddRelatedWordRequest;
import com.wordencounter.wordencounter.dto.CreateWordRequest;
import com.wordencounter.wordencounter.dto.MeaningBlockRequest;
import com.wordencounter.wordencounter.dto.RelatedSuggestionResponse;
import com.wordencounter.wordencounter.dto.ReplaceMeaningBlocksRequest;
import com.wordencounter.wordencounter.dto.WordDetailResponse;
import com.wordencounter.wordencounter.entity.MeaningBlockType;
import com.wordencounter.wordencounter.entity.Word;
import com.wordencounter.wordencounter.entity.WordRelation;
import com.wordencounter.wordencounter.exception.ConflictException;
import com.wordencounter.wordencounter.repository.WordRelationRepository;
import com.wordencounter.wordencounter.repository.WordRepository;
import com.wordencounter.wordencounter.repository.search.WordDocument;
import com.wordencounter.wordencounter.repository.search.WordSearchQueryService;
import com.wordencounter.wordencounter.repository.search.WordSearchQueryService.ScoredWord;
import com.wordencounter.wordencounter.repository.search.WordSearchRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class WordServiceTest {

    private static final String OWNER = "google-sub-123";

    @Mock
    private WordRepository wordRepository;

    @Mock
    private WordRelationRepository wordRelationRepository;

    @Mock
    private WordSearchRepository wordSearchRepository;

    @Mock
    private WordSearchQueryService wordSearchQueryService;

    private WordService wordService;

    @BeforeEach
    void setUp() {
        wordService =
                new WordService(wordRepository, wordRelationRepository, wordSearchRepository, wordSearchQueryService);
    }

    @Test
    void create_rejectsDuplicateWordForSameOwner() {
        when(wordRepository.existsByOwnerSubAndTextIgnoreCase(OWNER, "serendipity")).thenReturn(true);

        assertThatThrownBy(() -> wordService.create(OWNER, new CreateWordRequest("serendipity", "happy accident")))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void addRelatedWord_resolvesJumpTargetWhenRelatedWordAlreadyRegistered() {
        Word word = new Word(OWNER, "ephemeral", "lasting a short time", java.time.Instant.now());
        Word related = new Word(OWNER, "transient", "not permanent", java.time.Instant.now());

        when(wordRepository.findByIdAndOwnerSub(word.getId(), OWNER)).thenReturn(Optional.of(word));
        when(wordRepository.findByOwnerSubAndTextIgnoreCaseIn(OWNER, List.of("transient")))
                .thenReturn(List.of(related));

        WordDetailResponse response =
                wordService.addRelatedWord(OWNER, word.getId(), new AddRelatedWordRequest("transient"));

        assertThat(response.relatedWords()).hasSize(1);
        assertThat(response.relatedWords().get(0).wordId()).isEqualTo(related.getId());
    }

    @Test
    void addRelatedWord_leavesJumpTargetNullWhenRelatedWordNotRegisteredYet() {
        Word word = new Word(OWNER, "ephemeral", "lasting a short time", java.time.Instant.now());

        when(wordRepository.findByIdAndOwnerSub(word.getId(), OWNER)).thenReturn(Optional.of(word));
        when(wordRepository.findByOwnerSubAndTextIgnoreCaseIn(any(), any())).thenReturn(List.of());

        WordDetailResponse response =
                wordService.addRelatedWord(OWNER, word.getId(), new AddRelatedWordRequest("fleeting"));

        assertThat(response.relatedWords()).hasSize(1);
        assertThat(response.relatedWords().get(0).wordId()).isNull();
    }

    @Test
    void replaceMeaningBlocks_derivesPlainMeaningFromTextBlocksOnly() {
        Word word = new Word(OWNER, "ephemeral", null, java.time.Instant.now());
        when(wordRepository.findByIdAndOwnerSub(word.getId(), OWNER)).thenReturn(Optional.of(word));

        WordDetailResponse response = wordService.replaceMeaningBlocks(
                OWNER,
                word.getId(),
                new ReplaceMeaningBlocksRequest(List.of(
                        new MeaningBlockRequest(MeaningBlockType.TEXT, "lasting a short time", null, null),
                        new MeaningBlockRequest(MeaningBlockType.CODE, "const x = 1;", "javascript", null))));

        assertThat(response.meaning()).isEqualTo("lasting a short time");
        assertThat(response.meaningBlocks()).hasSize(2);
        assertThat(response.meaningBlocks().get(1).language()).isEqualTo("javascript");
    }

    @Test
    void suggestRelatedWords_excludesAlreadyRelatedAndMergesFuzzyAndReverseSources() {
        Word word = new Word(OWNER, "ephemeral", null, java.time.Instant.now());
        word.addRelation(new WordRelation("transient"));
        when(wordRepository.findByIdAndOwnerSub(word.getId(), OWNER)).thenReturn(Optional.of(word));

        WordDocument fuzzyHit = WordDocument.builder()
                .id(java.util.UUID.randomUUID().toString())
                .text("ephemeral-ish")
                .build();
        WordDocument alreadyRelatedHit = WordDocument.builder()
                .id(java.util.UUID.randomUUID().toString())
                .text("transient")
                .build();
        when(wordSearchQueryService.suggestByFuzzyText(OWNER, "ephemeral", word.getId().toString(), 8))
                .thenReturn(List.of(new ScoredWord(fuzzyHit, 1.5), new ScoredWord(alreadyRelatedHit, 1.2)));

        Word reverseCandidate = new Word(OWNER, "momentary", null, java.time.Instant.now());
        reverseCandidate.addRelation(new WordRelation("ephemeral"));
        when(wordRelationRepository.findByRelatedTextIgnoreCaseAndWord_OwnerSubAndWord_IdNot(
                        "ephemeral", OWNER, word.getId()))
                .thenReturn(reverseCandidate.getRelations());

        List<RelatedSuggestionResponse> suggestions = wordService.suggestRelatedWords(OWNER, word.getId(), 8);

        assertThat(suggestions).extracting(RelatedSuggestionResponse::text)
                .containsExactlyInAnyOrder("ephemeral-ish", "momentary");
        assertThat(suggestions).noneMatch(s -> s.text().equalsIgnoreCase("transient"));
    }
}
