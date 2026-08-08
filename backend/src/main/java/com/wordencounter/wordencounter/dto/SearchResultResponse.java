package com.wordencounter.wordencounter.dto;

import java.util.UUID;

public record SearchResultResponse(UUID id, String text, String meaning) {
}
