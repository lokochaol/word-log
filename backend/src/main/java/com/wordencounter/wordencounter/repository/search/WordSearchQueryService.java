package com.wordencounter.wordencounter.repository.search;

import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.stereotype.Component;

/**
 * Multi-field search (word text, meaning, related words) scoped to the current owner,
 * boosting exact/prefix matches on the word text itself above matches found only in
 * the meaning or related words.
 */
@Component
public class WordSearchQueryService {

    private final ElasticsearchOperations elasticsearchOperations;

    public WordSearchQueryService(ElasticsearchOperations elasticsearchOperations) {
        this.elasticsearchOperations = elasticsearchOperations;
    }

    public List<WordDocument> search(String ownerSub, String queryText, int limit) {
        Query ownerFilter = Query.of(q -> q.term(t -> t.field("ownerSub").value(ownerSub)));

        Query textMatch = Query.of(q -> q.match(m -> m.field("text").query(queryText).boost(3.0f)));
        Query textPrefix = Query.of(q -> q.matchPhrasePrefix(m -> m.field("text").query(queryText).boost(2.0f)));
        Query meaningMatch = Query.of(q -> q.match(m -> m.field("meaning").query(queryText).boost(1.0f)));
        Query relatedMatch = Query.of(q -> q.match(m -> m.field("relatedTexts").query(queryText).boost(1.0f)));

        Query boolQuery = Query.of(q -> q.bool(b -> b
                .filter(ownerFilter)
                .should(textMatch)
                .should(textPrefix)
                .should(meaningMatch)
                .should(relatedMatch)
                .minimumShouldMatch("1")));

        NativeQuery nativeQuery = NativeQuery.builder()
                .withQuery(boolQuery)
                .withMaxResults(limit)
                .build();

        return elasticsearchOperations.search(nativeQuery, WordDocument.class)
                .getSearchHits()
                .stream()
                .map(SearchHit::getContent)
                .collect(Collectors.toList());
    }
}
