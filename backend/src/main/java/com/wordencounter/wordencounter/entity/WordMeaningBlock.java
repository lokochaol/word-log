package com.wordencounter.wordencounter.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One block of a word's meaning: free-form text, a code snippet, Mermaid diagram
 * source, or an image reference. Blocks are ordered by {@code position} and rendered
 * in sequence, similar to a Notion-style block editor.
 */
@Entity
@Table(name = "word_meaning_block")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WordMeaningBlock {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_id", nullable = false)
    private Word word;

    @Column(nullable = false)
    private int position;

    @Enumerated(EnumType.STRING)
    @Column(name = "block_type", nullable = false)
    private MeaningBlockType type;

    /** Free text for TEXT blocks, source code for CODE, Mermaid source for MERMAID, image URL for IMAGE. */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    /** CODE blocks only, e.g. "javascript". */
    @Column
    private String language;

    /** IMAGE blocks only. */
    @Column
    private String caption;

    public WordMeaningBlock(MeaningBlockType type, String content, String language, String caption) {
        this.id = UUID.randomUUID();
        this.type = type;
        this.content = content;
        this.language = language;
        this.caption = caption;
    }
}
