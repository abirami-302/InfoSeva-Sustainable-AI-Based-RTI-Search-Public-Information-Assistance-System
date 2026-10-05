package com.infoseva.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "APP_SEARCH_QUERIES", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"KEYWORD"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchQuery {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "search_seq_gen")
    @SequenceGenerator(name = "search_seq_gen", sequenceName = "SEARCH_SEQ", allocationSize = 1)
    @Column(name = "SEARCH_ID")
    private Long id;

    @Column(name = "KEYWORD", nullable = false, length = 300)
    private String keyword;

    @Column(name = "RESULT_COUNT", nullable = false)
    private Integer resultCount;

    @Column(name = "SEARCH_COUNT")
    private Integer searchCount;

    @Column(name = "SEARCHED_AT", nullable = false)
    private LocalDateTime searchedAt; // Serves as firstSearchedAt

    @Column(name = "LAST_SEARCHED_AT")
    private LocalDateTime lastSearchedAt;

    /**
     * Soft-resolved flag: set to true when a Data Manager uploads a document
     * whose title/category covers this keyword. Resolved gaps are hidden from
     * the default content-gaps view but can be shown via ?includeResolved=true.
     */
    @Column(name = "RESOLVED", nullable = false)
    @Builder.Default
    private boolean resolved = false;
}
