package com.wordencounter.wordencounter.controller;

import com.wordencounter.wordencounter.config.CurrentUser;
import com.wordencounter.wordencounter.dto.AddRelatedWordRequest;
import com.wordencounter.wordencounter.dto.CreateWordRequest;
import com.wordencounter.wordencounter.dto.PageResponse;
import com.wordencounter.wordencounter.dto.RelatedSuggestionResponse;
import com.wordencounter.wordencounter.dto.ReplaceMeaningBlocksRequest;
import com.wordencounter.wordencounter.dto.SearchResultResponse;
import com.wordencounter.wordencounter.dto.WordDetailResponse;
import com.wordencounter.wordencounter.dto.WordSummaryResponse;
import com.wordencounter.wordencounter.service.WordService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/words")
public class WordController {

    private final WordService wordService;
    private final CurrentUser currentUser;

    public WordController(WordService wordService, CurrentUser currentUser) {
        this.wordService = wordService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public PageResponse<WordSummaryResponse> list(
            @PageableDefault(size = 50, sort = "encounteredAt", direction = Sort.Direction.ASC) Pageable pageable) {
        return wordService.listChronological(currentUser.ownerSub(), pageable);
    }

    @GetMapping("/search")
    public List<SearchResultResponse> search(
            @RequestParam("q") String query, @RequestParam(name = "limit", defaultValue = "20") int limit) {
        return wordService.search(currentUser.ownerSub(), query, limit);
    }

    @GetMapping("/{id}")
    public WordDetailResponse get(@PathVariable UUID id) {
        return wordService.getDetail(currentUser.ownerSub(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WordDetailResponse create(@Valid @RequestBody CreateWordRequest request) {
        return wordService.create(currentUser.ownerSub(), request);
    }

    @PutMapping("/{id}/meaning-blocks")
    public WordDetailResponse replaceMeaningBlocks(
            @PathVariable UUID id, @Valid @RequestBody ReplaceMeaningBlocksRequest request) {
        return wordService.replaceMeaningBlocks(currentUser.ownerSub(), id, request);
    }

    @PostMapping("/{id}/related")
    @ResponseStatus(HttpStatus.CREATED)
    public WordDetailResponse addRelatedWord(
            @PathVariable UUID id, @Valid @RequestBody AddRelatedWordRequest request) {
        return wordService.addRelatedWord(currentUser.ownerSub(), id, request);
    }

    @DeleteMapping("/{id}/related/{relationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeRelatedWord(@PathVariable UUID id, @PathVariable UUID relationId) {
        wordService.removeRelatedWord(currentUser.ownerSub(), id, relationId);
    }

    @GetMapping("/{id}/related/suggestions")
    public List<RelatedSuggestionResponse> suggestRelatedWords(
            @PathVariable UUID id, @RequestParam(name = "limit", defaultValue = "8") int limit) {
        return wordService.suggestRelatedWords(currentUser.ownerSub(), id, limit);
    }
}
