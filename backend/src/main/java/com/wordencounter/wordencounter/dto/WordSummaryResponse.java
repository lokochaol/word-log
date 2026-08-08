package com.wordencounter.wordencounter.dto;

import java.time.Instant;
import java.util.UUID;

public record WordSummaryResponse(UUID id, String text, Instant encounteredAt) {
}
