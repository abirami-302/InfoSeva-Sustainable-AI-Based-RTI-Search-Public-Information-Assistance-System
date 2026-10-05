package com.infoseva.serviceImpl;

import com.infoseva.dto.SearchResultDTO;
import com.infoseva.dto.SchemeFilterRequest;
import com.infoseva.entity.Document;
import com.infoseva.entity.FAQ;
import com.infoseva.entity.Notice;
import com.infoseva.entity.Scheme;
import com.infoseva.repository.DocumentRepository;
import com.infoseva.repository.FAQRepository;
import com.infoseva.repository.NoticeRepository;
import com.infoseva.repository.SchemeRepository;
import com.infoseva.repository.SchemeSpecification;
import com.infoseva.repository.SearchQueryRepository;
import com.infoseva.entity.SearchQuery;
import com.infoseva.service.SearchService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.infoseva.client.AIServiceClient;
import org.springframework.dao.DataIntegrityViolationException;
import java.util.concurrent.CompletableFuture;

@Service
@Transactional(readOnly = true)
public class SearchServiceImpl implements SearchService {

    private final NoticeRepository noticeRepository;
    private final DocumentRepository documentRepository;
    private final FAQRepository faqRepository;
    private final SchemeRepository schemeRepository;
    private final SearchQueryRepository searchQueryRepository;
    private final AIServiceClient aiServiceClient;
    private final com.infoseva.repository.UserSearchRepository userSearchRepository;

    public SearchServiceImpl(NoticeRepository noticeRepository,
                             DocumentRepository documentRepository,
                             FAQRepository faqRepository,
                             SchemeRepository schemeRepository,
                             SearchQueryRepository searchQueryRepository,
                             AIServiceClient aiServiceClient,
                             com.infoseva.repository.UserSearchRepository userSearchRepository) {
        this.noticeRepository = noticeRepository;
        this.documentRepository = documentRepository;
        this.faqRepository = faqRepository;
        this.schemeRepository = schemeRepository;
        this.searchQueryRepository = searchQueryRepository;
        this.aiServiceClient = aiServiceClient;
        this.userSearchRepository = userSearchRepository;
    }

    @Override
    public List<SearchResultDTO> globalSearch(String keyword) {
        // Delegate to paginated method to preserve backward compatibility for internal callers
        return globalSearchPaginated(keyword, "All", "All Departments", "All Years", 0, 1000).getContent();
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public Page<SearchResultDTO> globalSearchPaginated(String keyword, String category, String department, String year, int page, int size) {
        List<SearchResultDTO> results = new ArrayList<>();

        // Log user search for recommendation scoring
        if (page == 0 && keyword != null && !keyword.trim().isBlank()) {
            Long currentUserId = null;
            try {
                org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.getPrincipal() instanceof com.infoseva.security.CustomUserDetails) {
                    currentUserId = ((com.infoseva.security.CustomUserDetails) auth.getPrincipal()).getId();
                }
            } catch (Exception ignored) {}

            if (currentUserId != null && currentUserId > 0) {
                final Long uid = currentUserId;
                final String kw = keyword.trim();
                CompletableFuture.runAsync(() -> {
                    try {
                        userSearchRepository.save(com.infoseva.entity.UserSearch.builder()
                                .userId(uid)
                                .keyword(kw)
                                .searchedAt(LocalDateTime.now())
                                .build());
                    } catch (Exception ignored) {}
                });
            }
        }

        if (keyword == null || keyword.isBlank()) {
            boolean isManager = false;
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null) {
                isManager = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_DATA_MANAGER"));
            }

            org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "uploadDate"));
            
            org.springframework.data.domain.Page<com.infoseva.entity.Document> defaultDocs;
            if (isManager) {
                defaultDocs = documentRepository.findByActiveTrue(pageable);
            } else {
                defaultDocs = documentRepository.findByActiveTrueAndReviewStatus("APPROVED", pageable);
            }

            for (com.infoseva.entity.Document document : defaultDocs.getContent()) {
                String deptName = document.getDepartment() != null ? document.getDepartment().getDepartmentName() : "General";
                java.time.LocalDateTime date = document.getUploadDate() != null ? document.getUploadDate().atStartOfDay() : document.getCreatedAt();
                results.add(SearchResultDTO.builder()
                        .module("Document")
                        .id(document.getDocumentId())
                        .title(document.getTitle())
                        .description(document.getDescription())
                        .type(document.getCategory())
                        .summary(document.getDescription() != null && document.getDescription().length() > 100 ? document.getDescription().substring(0, 100) + "..." : document.getDescription())
                        .department(deptName)
                        .date(date)
                        .route("/user/documents/" + document.getDocumentId())
                        .fileName(document.getFileName())
                        .build());
            }


            return new PageImpl<>(results, pageable, defaultDocs.getTotalElements());
        }

        String trimmedKeyword = keyword.trim();



        boolean isManager = false;
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            isManager = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_DATA_MANAGER"));
        }

        java.util.Set<Long> processedDocIds = new java.util.HashSet<>();

        // 1. Semantic Search via AI Service (Vector embeddings across verified documents)
        try {
            List<AIServiceClient.SemanticResult> semanticMatches = aiServiceClient.semanticSearch(trimmedKeyword, 15, isManager);
            if (semanticMatches != null && !semanticMatches.isEmpty()) {
                for (AIServiceClient.SemanticResult sr : semanticMatches) {
                    Document matchedDoc = null;
                    if (sr.getDocumentId() != null && !sr.getDocumentId().isBlank()) {
                        matchedDoc = documentRepository.findByAiDocumentId(sr.getDocumentId()).orElse(null);
                    }
                    if (matchedDoc == null && sr.getTitle() != null && !sr.getTitle().isBlank()) {
                        List<Document> byTitle = documentRepository.searchByKeyword(sr.getTitle().trim());
                        if (!byTitle.isEmpty()) {
                            matchedDoc = byTitle.get(0);
                        }
                    }

                    if (matchedDoc != null && matchedDoc.isActive()) {
                        if (!isManager && !"APPROVED".equals(matchedDoc.getReviewStatus())) {
                            continue;
                        }
                        if (processedDocIds.add(matchedDoc.getDocumentId())) {
                            String deptName = matchedDoc.getDepartment() != null ? matchedDoc.getDepartment().getDepartmentName() : (sr.getDepartment() != null ? sr.getDepartment() : "General");
                            LocalDateTime date = matchedDoc.getUploadDate() != null ? matchedDoc.getUploadDate().atStartOfDay() : matchedDoc.getCreatedAt();
                            results.add(SearchResultDTO.builder()
                                    .module("Document")
                                    .id(matchedDoc.getDocumentId())
                                    .title(matchedDoc.getTitle())
                                    .description(matchedDoc.getDescription())
                                    .type(matchedDoc.getCategory() != null ? matchedDoc.getCategory() : "Document")
                                    .summary(matchedDoc.getDescription())
                                    .department(deptName)
                                    .date(date)
                                    .route("/user/documents/" + matchedDoc.getDocumentId())
                                    .fileName(matchedDoc.getFileName())
                                    .similarityScore(sr.getScore())
                                    .snippet(sr.getSnippet())
                                    .build());
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error calling semantic search in SearchServiceImpl: " + e.getMessage());
        }

        // 2. Fetch from Oracle using existing repository keyword methods (Pushing keyword to DB)
        
        // Notices
        List<Notice> notices = noticeRepository.searchByKeyword(trimmedKeyword);
        for (Notice notice : notices) {
            String deptName = notice.getDepartmentRef() != null ? notice.getDepartmentRef().getDepartmentName() : "General";
            LocalDateTime date = notice.getNoticeDate() != null ? notice.getNoticeDate().atStartOfDay() : notice.getCreatedAt();
            results.add(SearchResultDTO.builder()
                    .module("Notice")
                    .id(notice.getNoticeId())
                    .title(notice.getTitle())
                    .description(notice.getSummary())
                    .type(notice.getType())
                    .summary(notice.getSummary())
                    .department(deptName)
                    .date(date)
                    .route("/user/circulars/" + notice.getNoticeId())
                    .build());
        }

        // Documents (Keyword matches)
        List<Document> documents = documentRepository.searchByKeyword(trimmedKeyword);
        for (Document document : documents) {
            if (!document.isActive()) continue;
            if (!isManager && !"APPROVED".equals(document.getReviewStatus())) continue;
            if (processedDocIds.add(document.getDocumentId())) {
                String deptName = document.getDepartment() != null ? document.getDepartment().getDepartmentName() : "General";
                LocalDateTime date = document.getUploadDate() != null ? document.getUploadDate().atStartOfDay() : document.getCreatedAt();
                results.add(SearchResultDTO.builder()
                        .module("Document")
                        .id(document.getDocumentId())
                        .title(document.getTitle())
                        .description(document.getDescription())
                        .type(document.getCategory() != null ? document.getCategory() : "Document")
                        .summary(document.getDescription())
                        .department(deptName)
                        .date(date)
                        .route("/user/documents/" + document.getDocumentId())
                        .fileName(document.getFileName())
                        .build());
            }
        }

        // FAQs
        List<FAQ> faqs = faqRepository.searchByKeyword(trimmedKeyword);
        for (FAQ faq : faqs) {
            String deptName = faq.getDepartment() != null ? faq.getDepartment().getDepartmentName() : "General";
            results.add(SearchResultDTO.builder()
                    .module("FAQ")
                    .id(faq.getFaqId())
                    .title(faq.getQuestion())
                    .description(faq.getAnswer())
                    .type("FAQ")
                    .summary(faq.getAnswer())
                    .department(deptName)
                    .date(faq.getCreatedAt())
                    .route("/user/faqs")
                    .build());
        }

        // 3. Apply Cross-Module Java Stream Filters
        List<SearchResultDTO> filtered = results.stream()
                .filter(item -> {
                    boolean match = true;
                    if (category != null && !category.equalsIgnoreCase("All") && !category.isBlank()) {
                        // Frontend mixes types and categories into one dropdown
                        match = item.getType() != null && item.getType().equalsIgnoreCase(category);
                    }
                    if (match && department != null && !department.equalsIgnoreCase("All Departments") && !department.isBlank()) {
                        match = item.getDepartment() != null && item.getDepartment().toLowerCase().contains(department.toLowerCase());
                    }
                    if (match && year != null && !year.equalsIgnoreCase("All Years") && !year.isBlank()) {
                        match = item.getDate() != null && String.valueOf(item.getDate().getYear()).equals(year);
                    }
                    return match;
                })
                .collect(Collectors.toList());

        // 4. Sort: Prioritize semantic matches by similarity score descending; then date descending
        filtered.sort((a, b) -> {
            Double scoreA = a.getSimilarityScore();
            Double scoreB = b.getSimilarityScore();
            if (scoreA != null || scoreB != null) {
                if (scoreA == null) return 1;
                if (scoreB == null) return -1;
                int cmp = Double.compare(scoreB, scoreA);
                if (cmp != 0) return cmp;
            }
            if (a.getDate() == null && b.getDate() == null) return 0;
            if (a.getDate() == null) return 1;
            if (b.getDate() == null) return -1;
            return b.getDate().compareTo(a.getDate());
        });

        // 4. Manual Pagination
        int total = filtered.size();
        int start = Math.min(page * size, total);
        int end = Math.min((page + 1) * size, total);
        List<SearchResultDTO> paginated = filtered.subList(start, end);

        // 5. Asynchronous Content Gap Processing for 0-result searches
        if (page == 0 && total == 0 && !trimmedKeyword.isBlank()) {
            CompletableFuture.runAsync(() -> {
                String normalized = trimmedKeyword.toLowerCase().replaceAll("\\s+", " ").trim();
                
                // Deterministic basic sanity check before calling Gemini
                if (normalized.length() < 3 || 
                    normalized.length() > 60 || // Extremely long queries are likely spam/gibberish
                    normalized.matches(".*(.)\\1{3,}.*") || // 4+ repeating characters (e.g. aaaa)
                    normalized.matches(".*[bcdfghjklmnpqrstvwxyz]{5,}.*") || // 5+ consecutive consonants (keyboard mashing)
                    normalized.matches(".*(?:asdf|qwer|zxcv|sdfg|dfgh|wert|erty|tyui).*") || // Common keyboard mashing
                    normalized.matches("^[a-z0-9_]{15,}$") || // Long random alphanumeric strings
                    normalized.equals("hello") || normalized.equals("hi") || normalized.equals("test")) {
                    System.out.println("[CONTENT_GAP_PIPELINE] Query: '" + normalized + "' -> REJECTED by deterministic sanity check");
                    return; // Ignore obvious non-information queries
                }

                System.out.println("[CONTENT_GAP_PIPELINE] Query: '" + normalized + "' -> PASSED sanity check. Calling Gemini AI validation...");
                boolean isValid = aiServiceClient.validateContentGap(normalized);
                System.out.println("[CONTENT_GAP_PIPELINE] Query: '" + normalized + "' -> Gemini Validation Result: " + isValid);
                
                if (isValid) {
                    try {
                        SearchQuery sq = searchQueryRepository.findFirstByKeyword(normalized).orElse(null);
                        if (sq != null) {
                            sq.setSearchCount(sq.getSearchCount() == null ? 2 : sq.getSearchCount() + 1);
                            sq.setLastSearchedAt(LocalDateTime.now());
                            System.out.println("[CONTENT_GAP_PIPELINE] Query: '" + normalized + "' -> SAVED (Incremented count to " + sq.getSearchCount() + ")");
                        } else {
                            sq = SearchQuery.builder()
                                .keyword(normalized)
                                .resultCount(0)
                                .searchCount(1)
                                .searchedAt(LocalDateTime.now())
                                .lastSearchedAt(LocalDateTime.now())
                                .build();
                            System.out.println("[CONTENT_GAP_PIPELINE] Query: '" + normalized + "' -> SAVED (Created new record)");
                        }
                        searchQueryRepository.save(sq);
                    } catch (DataIntegrityViolationException e) {
                        // Race condition: another thread inserted it. Let's try to update it once.
                        SearchQuery sq = searchQueryRepository.findFirstByKeyword(normalized).orElse(null);
                        if (sq != null) {
                            sq.setSearchCount(sq.getSearchCount() == null ? 2 : sq.getSearchCount() + 1);
                            sq.setLastSearchedAt(LocalDateTime.now());
                            searchQueryRepository.save(sq);
                            System.out.println("[CONTENT_GAP_PIPELINE] Query: '" + normalized + "' -> SAVED via Race Condition Fallback");
                        }
                    } catch (Exception e) {
                        System.err.println("[CONTENT_GAP_PIPELINE] Error saving content gap: " + e.getMessage());
                    }
                } else {
                    System.out.println("[CONTENT_GAP_PIPELINE] Query: '" + normalized + "' -> IGNORED (AI validation failed)");
                }
            });
        }

        return new PageImpl<>(paginated, PageRequest.of(page, size), total);
    }
}
