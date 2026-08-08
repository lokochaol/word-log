package com.wordencounter.wordencounter.dto;

import java.util.UUID;

/**
 * @param reason why this word was suggested: {@code FUZZY_MATCH} (text is a close
 *               spelling match to the current word) or {@code REVERSE_RELATION}
 *               (that word already lists the current word as related, but not vice versa).
 * @param score  relevance score for {@code FUZZY_MATCH}; {@code null} for {@code REVERSE_RELATION}.
 */
public record RelatedSuggestionResponse(UUID wordId, String text, String reason, Double score) {
}
