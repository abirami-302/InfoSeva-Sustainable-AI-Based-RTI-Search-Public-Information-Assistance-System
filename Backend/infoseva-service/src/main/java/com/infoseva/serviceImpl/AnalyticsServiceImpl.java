package com.infoseva.serviceImpl;

import com.infoseva.repository.SearchQueryRepository;
import com.infoseva.repository.SearchQueryRepository.ContentGapProjection;
import com.infoseva.service.AnalyticsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
public class AnalyticsServiceImpl implements AnalyticsService {

    private final SearchQueryRepository searchQueryRepository;

    public AnalyticsServiceImpl(SearchQueryRepository searchQueryRepository) {
        this.searchQueryRepository = searchQueryRepository;
    }

    @Override
    public Page<ContentGapProjection> getContentGapsPaginated(int page, int size) {
        return searchQueryRepository.findTopUnansweredQueries(PageRequest.of(page, size));
    }

    @Override
    public void deleteContentGap(Long queryId) {
        searchQueryRepository.deleteById(queryId);
    }

    /**
     * Resolves any open content gaps whose keyword fuzzy-matches the given term.
     * Each word in the term (≥4 chars) is matched individually for broader coverage.
     * Must never throw — called fire-and-forget from DocumentController.
     */
    @Override
    @Transactional
    public void resolveGapByTerm(String term) {
        if (term == null || term.isBlank()) return;
        try {
            // Match on full term first
            searchQueryRepository.resolveMatchingGaps(term.trim());
            // Then match on individual significant words for broader recall
            for (String word : term.trim().split("\\s+")) {
                if (word.length() >= 4) {
                    searchQueryRepository.resolveMatchingGaps(word);
                }
            }
            log.info("[CONTENT_GAP] Resolved gaps matching term: '{}'", term);
        } catch (Exception e) {
            log.warn("[CONTENT_GAP] Gap resolution failed silently for term '{}': {}", term, e.getMessage());
        }
    }
}
