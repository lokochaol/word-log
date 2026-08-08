package com.wordencounter.wordencounter.dto;

import com.wordencounter.wordencounter.entity.MeaningBlockType;
import java.util.UUID;

public record MeaningBlockResponse(
        UUID id, MeaningBlockType type, String content, String language, String caption) {
}
