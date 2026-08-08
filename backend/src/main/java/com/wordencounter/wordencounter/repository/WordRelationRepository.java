package com.wordencounter.wordencounter.repository;

import com.wordencounter.wordencounter.entity.WordRelation;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WordRelationRepository extends JpaRepository<WordRelation, UUID> {

    /**
     * Relations in other words of the same owner whose related-word text points at
     * {@code relatedText} — used to suggest linking back the other way.
     */
    List<WordRelation> findByRelatedTextIgnoreCaseAndWord_OwnerSubAndWord_IdNot(
            String relatedText, String ownerSub, UUID wordId);
}
