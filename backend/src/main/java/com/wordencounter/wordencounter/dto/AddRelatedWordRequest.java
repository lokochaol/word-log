package com.wordencounter.wordencounter.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddRelatedWordRequest(@NotBlank @Size(max = 255) String text) {
}
