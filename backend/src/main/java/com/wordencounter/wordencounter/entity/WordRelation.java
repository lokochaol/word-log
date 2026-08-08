package com.wordencounter.wordencounter.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A related word entered as free text. Whether it points at an already-registered
 * {@link Word} is resolved at read time (by matching text), not stored as a hard
 * foreign key, so a relation set before the related word exists still links up once
 * that word is registered later.
 */
@Entity
@Table(name = "word_relation", uniqueConstraints = @UniqueConstraint(columnNames = {"word_id", "related_text"}))
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WordRelation {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_id", nullable = false)
    private Word word;

    @Column(name = "related_text", nullable = false)
    private String relatedText;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public WordRelation(String relatedText) {
        this.id = UUID.randomUUID();
        this.relatedText = relatedText;
        this.createdAt = Instant.now();
    }
}
