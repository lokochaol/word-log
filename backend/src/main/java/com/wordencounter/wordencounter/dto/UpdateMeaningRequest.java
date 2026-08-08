package com.wordencounter.wordencounter.dto;

import jakarta.validation.constraints.Size;

public record UpdateMeaningRequest(@Size(max = 10000) String meaning) {
}
