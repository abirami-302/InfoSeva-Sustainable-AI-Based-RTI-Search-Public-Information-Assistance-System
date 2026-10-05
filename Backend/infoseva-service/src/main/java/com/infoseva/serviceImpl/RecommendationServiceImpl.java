package com.infoseva.serviceImpl;

import com.infoseva.dto.RecommendationDTO;
import com.infoseva.dto.UserSummaryDTO;
import com.infoseva.entity.Document;
import com.infoseva.entity.DocumentView;
import com.infoseva.entity.UserSearch;
import com.infoseva.repository.DocumentRepository;
import com.infoseva.repository.DocumentViewRepository;
import com.infoseva.repository.UserSearchRepository;
import com.infoseva.security.CustomUserDetails;
import com.infoseva.service.RecommendationService;
import com.infoseva.util.DomainMappingUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@Transactional(readOnly = true)
public class RecommendationServiceImpl implements RecommendationService {

    private final DocumentRepository documentRepository;
    private final UserSearchRepository userSearchRepository;
    private final DocumentViewRepository documentViewRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${auth.service.url:http://localhost:8081}")
    private String authServiceUrl;

    public RecommendationServiceImpl(DocumentRepository documentRepository,
                                    UserSearchRepository userSearchRepository,
                                    DocumentViewRepository documentViewRepository) {
        this.documentRepository = documentRepository;
        this.userSearchRepository = userSearchRepository;
        this.documentViewRepository = documentViewRepository;
    }

    private String getCurrentJwtToken() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getCredentials() instanceof String) {
                String token = (String) authentication.getCredentials();
                if (token != null && !token.isBlank()) {
                    return token.startsWith("Bearer ") ? token : "Bearer " + token;
                }
            }
        } catch (Exception ignored) {}
        try {
            org.springframework.web.context.request.ServletRequestAttributes attrs =
                    (org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attrs != null && attrs.getRequest() != null) {
                String authHeader = attrs.getRequest().getHeader("Authorization");
                if (authHeader != null && !authHeader.isBlank()) {
                    return authHeader;
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    private String fetchUserProfession(Long userId) {
        if (userId == null) return null;
        try {
            String token = getCurrentJwtToken();
            HttpHeaders headers = new HttpHeaders();
            if (token != null) {
                headers.set(HttpHeaders.AUTHORIZATION, token);
            }
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            // Try fetching profile from auth-service
            String url = authServiceUrl + "/api/users/profile";
            ResponseEntity<Map> resp = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            if (resp.getBody() != null && resp.getBody().containsKey("data")) {
                Map data = (Map) resp.getBody().get("data");
                if (data != null && data.get("profession") != null) {
                    return data.get("profession").toString();
                }
            }
        } catch (Exception e) {
            log.warn("Could not retrieve profession for userId {}: {}", userId, e.getMessage());
        }
        return null;
    }

    @Override
    public List<RecommendationDTO> getRecommendationsForUser(Long userId, int limit) {
        return getRecommendationsForUser(userId, null, limit);
    }

    @Override
    public List<RecommendationDTO> getRecommendationsForUser(Long userId, String profession, int limit) {
        int maxResults = limit > 0 ? limit : 6;

        // 1. Fetch Candidate Approved Documents
        List<Document> approvedDocs = documentRepository.findAll().stream()
                .filter(Document::isActive)
                .filter(d -> d.getReviewStatus() == null || "APPROVED".equalsIgnoreCase(d.getReviewStatus()))
                .collect(Collectors.toList());

        if (approvedDocs.isEmpty()) {
            return Collections.emptyList();
        }

        // 2. Fetch User Context
        String userProfession = (profession != null && !profession.trim().isEmpty())
                ? profession.trim()
                : fetchUserProfession(userId);

        List<String> last10Searches = Collections.emptyList();
        if (userId != null && userId > 0) {
            List<UserSearch> searches = userSearchRepository.findTop10ByUserIdOrderBySearchedAtDesc(userId);
            last10Searches = searches.stream()
                    .map(UserSearch::getKeyword)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
        }

        Set<String> last10ViewedCategories = new HashSet<>();
        if (userId != null && userId > 0) {
            List<DocumentView> views = documentViewRepository.findTop10ByUserIdOrderByViewedAtDesc(userId);
            for (DocumentView view : views) {
                documentRepository.findById(view.getDocumentId()).ifPresent(d -> {
                    if (d.getCategory() != null) {
                        last10ViewedCategories.add(d.getCategory());
                    }
                });
            }
        }

        LocalDateTime now = LocalDateTime.now();

        // 3. Score Each Candidate Document
        List<RecommendationDTO> scoredList = new ArrayList<>();

        for (Document doc : approvedDocs) {
            double score = 0.0;
            List<String> reasons = new ArrayList<>();

            String cat = doc.getCategory() != null ? doc.getCategory() : "";
            String dept = doc.getDepartment() != null && doc.getDepartment().getDepartmentName() != null
                    ? doc.getDepartment().getDepartmentName() : "";
            String title = doc.getTitle() != null ? doc.getTitle() : "";

            // Rule 1: +3 points for profession match
            if (userProfession != null && DomainMappingUtil.matchesProfession(userProfession, cat, dept, title)) {
                score += 3.0;
                reasons.add("Matches your profession (" + userProfession.replace("_", " ") + ")");
            }

            // Rule 2: +2 points for search history match
            if (!last10Searches.isEmpty() && DomainMappingUtil.matchesSearchQueries(last10Searches, cat, dept, title)) {
                score += 2.0;
                reasons.add("Matches your recent searches");
            }

            // Rule 3: +1 point for viewed documents category match
            if (!last10ViewedCategories.isEmpty() && DomainMappingUtil.matchesViewedCategories(last10ViewedCategories, cat)) {
                score += 1.0;
                reasons.add("Related to documents you viewed");
            }

            // Rule 4: Recency boost (newer approved documents get fractional boost [0.0 to 0.9])
            LocalDateTime docDate = doc.getCreatedAt() != null ? doc.getCreatedAt() :
                    (doc.getUploadDate() != null ? doc.getUploadDate().atStartOfDay() : now.minusDays(30));
            long daysOld = Math.max(0, ChronoUnit.DAYS.between(docDate, now));
            double recencyBoost = Math.max(0.0, 0.9 - (daysOld * 0.01)); // Decays gently with age
            score += recencyBoost;

            if (reasons.isEmpty()) {
                reasons.add("Trending citizen service");
            }

            String docType = (cat.equalsIgnoreCase("Schemes") || cat.equalsIgnoreCase("Agriculture") || cat.equalsIgnoreCase("Health"))
                    ? "Scheme" : (cat.equalsIgnoreCase("Circulars") ? "Circular" : "Government Document");

            String route = "/user/documents/" + doc.getDocumentId();

            RecommendationDTO dto = RecommendationDTO.builder()
                    .id(doc.getDocumentId())
                    .title(doc.getTitle())
                    .description(doc.getDescription() != null ? doc.getDescription() : doc.getTitle())
                    .category(cat)
                    .department(dept)
                    .type(docType)
                    .score(Math.round(score * 100.0) / 100.0)
                    .matchReasons(reasons)
                    .route(route)
                    .createdAt(docDate)
                    .build();

            scoredList.add(dto);
        }

        // 4. Sort descending by score, take top maxResults
        scoredList.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));

        return scoredList.stream().limit(maxResults).collect(Collectors.toList());
    }
}
