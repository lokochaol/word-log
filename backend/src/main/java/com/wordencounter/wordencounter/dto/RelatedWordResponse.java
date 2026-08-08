package com.wordencounter.wordencounter.dto;

import java.util.UUID;

/**
 * @param wordId null when {@code text} has not been registered as a word yet;
 *               present when the caller can jump straight to that word's detail page.
 */
public record RelatedWordResponse(UUID relationId, String text, UUID wordId) {
}
