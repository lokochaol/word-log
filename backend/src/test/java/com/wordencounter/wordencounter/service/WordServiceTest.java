package com.wordencounter.wordencounter.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.wordencounter.wordencounter.dto.AddRelatedWordRequest;
import com.wordencounter.wordencounter.dto.CreateWordRequest;
import com.wordencounter.wordencounter.dto.WordDetailResponse;
import com.wordencounter.wordencounter.entity.Word;
import com.wordencounter.wordencounter.exception.ConflictException;
import com.wordencounter.wordencounter.repository.WordRepository;
import com.wordencounter.wordencounter.repository.search.WordSearchQueryService;
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
    private WordSearchRepository wordSearchRepository;

    @Mock
    private WordSearchQueryService wordSearchQueryService;

    private WordService wordService;

    @BeforeEach
    void setUp() {
        wordService = new WordService(wordRepository, wordSearchRepository, wordSearchQueryService);
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
}
