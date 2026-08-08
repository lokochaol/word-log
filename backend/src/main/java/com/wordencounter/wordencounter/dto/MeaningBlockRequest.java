package com.wordencounter.wordencounter.dto;

import com.wordencounter.wordencounter.entity.MeaningBlockType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MeaningBlockRequest(
        @NotNull MeaningBlockType type,
        @NotBlank @Size(max = 10000) String content,
        @Size(max = 50) String language,
        @Size(max = 255) String caption) {
}
