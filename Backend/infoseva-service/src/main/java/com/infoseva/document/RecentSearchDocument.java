package com.infoseva.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "recent_searches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecentSearchDocument {
    @Id
    private String id;
    @Indexed
    private String keyword;
    private String userIp;
    private LocalDateTime timestamp;
}
