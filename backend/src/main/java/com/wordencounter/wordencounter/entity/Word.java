package com.wordencounter.wordencounter.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A word the owner encountered for the first time, recorded in chronological (encounter) order.
 */
@Entity
@Table(name = "word", uniqueConstraints = @UniqueConstraint(columnNames = {"owner_sub", "text"}))
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Word {

    @Id
    private UUID id;

    @Column(name = "owner_sub", nullable = false)
    private String ownerSub;

    @Column(nullable = false)
    private String text;

    @Column(columnDefinition = "TEXT")
    private String meaning;

    @Column(name = "encountered_at", nullable = false)
    private Instant encounteredAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "word", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("createdAt ASC")
    private List<WordRelation> relations = new ArrayList<>();

    public Word(String ownerSub, String text, String meaning, Instant encounteredAt) {
        this.id = UUID.randomUUID();
        this.ownerSub = ownerSub;
        this.text = text;
        this.meaning = meaning;
        this.encounteredAt = encounteredAt;
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    public void addRelation(WordRelation relation) {
        relations.add(relation);
        relation.setWord(this);
    }

    public void removeRelation(WordRelation relation) {
        relations.remove(relation);
        relation.setWord(null);
    }

    public void touch() {
        this.updatedAt = Instant.now();
    }
}
