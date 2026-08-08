package com.wordencounter.wordencounter.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record WordDetailResponse(
        UUID id,
        String text,
        String meaning,
        List<MeaningBlockResponse> meaningBlocks,
        Instant encounteredAt,
        Instant updatedAt,
        List<RelatedWordResponse> relatedWords) {
}
