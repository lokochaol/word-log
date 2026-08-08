package com.wordencounter.wordencounter.repository.search;

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

public interface WordSearchRepository extends ElasticsearchRepository<WordDocument, String> {
}
