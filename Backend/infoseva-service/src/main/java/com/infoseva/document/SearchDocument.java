package com.infoseva.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Document(collection = "search_index")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchDocument {
    @Id
    private String id;
    @Indexed
    private String sourceType; // NOTICE, FAQ, DOCUMENT
    private Long sourceId;
    @Indexed
    private String title;
    private String content;
    private List<String> tags;
    private String departmentName;
    private String url;
}
