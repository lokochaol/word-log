package com.wordencounter.wordencounter.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ReplaceMeaningBlocksRequest(
        @NotNull @Valid @Size(max = 100) List<MeaningBlockRequest> blocks) {
}
