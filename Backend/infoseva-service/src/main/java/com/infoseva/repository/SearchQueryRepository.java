package com.infoseva.repository;

import com.infoseva.entity.SearchQuery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SearchQueryRepository extends JpaRepository<SearchQuery, Long> {

    Optional<SearchQuery> findFirstByKeyword(String keyword);

    /**
     * Returns only UNRESOLVED zero-result queries, sorted by search frequency descending.
     * Resolved gaps (resolved = true) are excluded from the default content-gaps view.
     */
    @Query("SELECT s.id as queryId, s.keyword as keyword, s.searchCount as searchCount, s.lastSearchedAt as lastSearchedAt " +
           "FROM SearchQuery s WHERE s.resultCount = 0 AND s.resolved = false ORDER BY s.searchCount DESC")
    Page<ContentGapProjection> findTopUnansweredQueries(Pageable pageable);

    /**
     * Marks any gap whose keyword contains (or is contained by) the given title/category words
     * as resolved. Called fire-and-forget after a document upload.
     * Uses LOWER() for case-insensitive matching on Oracle XE.
     */
    @Modifying
    @Query("UPDATE SearchQuery s SET s.resolved = true " +
           "WHERE s.resolved = false AND s.resultCount = 0 " +
           "AND (LOWER(s.keyword) LIKE LOWER(CONCAT('%', :term, '%')) " +
           "     OR LOWER(:term) LIKE LOWER(CONCAT('%', s.keyword, '%')))")
    void resolveMatchingGaps(@Param("term") String term);

    interface ContentGapProjection {
        Long getQueryId();
        String getKeyword();
        Long getSearchCount();
        java.time.LocalDateTime getLastSearchedAt();
    }
}
