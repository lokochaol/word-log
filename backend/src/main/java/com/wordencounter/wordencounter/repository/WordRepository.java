package com.wordencounter.wordencounter.repository;

import com.wordencounter.wordencounter.entity.Word;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WordRepository extends JpaRepository<Word, UUID> {

    Page<Word> findByOwnerSubOrderByEncounteredAtAscCreatedAtAsc(String ownerSub, Pageable pageable);

    Optional<Word> findByIdAndOwnerSub(UUID id, String ownerSub);

    Optional<Word> findByOwnerSubAndTextIgnoreCase(String ownerSub, String text);

    List<Word> findByOwnerSubAndTextIgnoreCaseIn(String ownerSub, List<String> texts);

    boolean existsByOwnerSubAndTextIgnoreCase(String ownerSub, String text);

    long countByOwnerSub(String ownerSub);
}
