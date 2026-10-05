package com.infoseva.service;

import com.infoseva.repository.SearchQueryRepository.ContentGapProjection;
import org.springframework.data.domain.Page;

public interface AnalyticsService {
    Page<ContentGapProjection> getContentGapsPaginated(int page, int size);
    void deleteContentGap(Long queryId);

    /**
     * Attempts to resolve any open content gaps whose keyword matches the given term.
     * Called fire-and-forget after a document upload — must never throw.
     */
    void resolveGapByTerm(String term);
}
