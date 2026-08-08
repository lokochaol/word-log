package com.wordencounter.wordencounter.repository;

import com.wordencounter.wordencounter.entity.WordRelation;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WordRelationRepository extends JpaRepository<WordRelation, UUID> {
}
