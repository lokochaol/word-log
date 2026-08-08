package com.wordencounter.wordencounter.repository.search;

import java.time.Instant;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.DateFormat;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import org.springframework.data.elasticsearch.annotations.InnerField;
import org.springframework.data.elasticsearch.annotations.MultiField;
import org.springframework.data.elasticsearch.annotations.Setting;

/**
 * Search-optimized projection of a {@link com.wordencounter.wordencounter.entity.Word},
 * kept in sync on every create/update so full-text and prefix search stay fast even as
 * the personal dictionary grows.
 */
@Document(indexName = "words")
@Setting(settingPath = "elasticsearch/word-settings.json")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WordDocument {

    @Id
    private String id;

    @Field(type = FieldType.Keyword, name = "ownerSub")
    private String ownerSub;

    @MultiField(
            mainField = @Field(type = FieldType.Text, analyzer = "autocomplete_analyzer", searchAnalyzer = "autocomplete_search_analyzer"),
            otherFields = {@InnerField(suffix = "keyword", type = FieldType.Keyword)})
    private String text;

    @Field(type = FieldType.Text)
    private String meaning;

    @Field(type = FieldType.Text, name = "relatedTexts")
    private List<String> relatedTexts;

    @Field(type = FieldType.Date, format = DateFormat.date_time, name = "encounteredAt")
    private Instant encounteredAt;
}
