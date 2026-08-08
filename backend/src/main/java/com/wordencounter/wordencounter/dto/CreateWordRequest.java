package com.wordencounter.wordencounter.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateWordRequest(
        @NotBlank @Size(max = 255) String text,
        @Size(max = 10000) String meaning) {
}
