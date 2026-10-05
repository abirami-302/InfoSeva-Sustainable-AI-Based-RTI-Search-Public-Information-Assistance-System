package com.infoseva.serviceImpl;
import com.infoseva.repository.ContactRepository;
import com.infoseva.dto.DashboardDTO;
import com.infoseva.repository.*;
import com.infoseva.service.DashboardService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private final DepartmentRepository departmentRepository;
    private final DocumentRepository documentRepository;
    private final NoticeRepository noticeRepository;
    private final FAQRepository faqRepository;
    private final FeedbackRepository feedbackRepository;
    private final RTIRepository rtiRepository;
    private final SchemeRepository schemeRepository;
    private final ContactRepository contactRepository;
    private final ComplaintRepository complaintRepository;
    private final SearchQueryRepository searchQueryRepository;
    private final org.springframework.data.mongodb.core.MongoTemplate mongoTemplate;

    public DashboardServiceImpl(DepartmentRepository departmentRepository,
                                DocumentRepository documentRepository,
                                NoticeRepository noticeRepository,
                                FAQRepository faqRepository,
                                FeedbackRepository feedbackRepository,
                                RTIRepository rtiRepository,
                                ContactRepository contactRepository,
                                SchemeRepository schemeRepository,
                                ComplaintRepository complaintRepository,
                                SearchQueryRepository searchQueryRepository,
                                org.springframework.data.mongodb.core.MongoTemplate mongoTemplate) {
        this.departmentRepository = departmentRepository;
        this.documentRepository = documentRepository;
        this.noticeRepository = noticeRepository;
        this.faqRepository = faqRepository;
        this.feedbackRepository = feedbackRepository;
        this.rtiRepository = rtiRepository;
        this.contactRepository = contactRepository;
        this.schemeRepository = schemeRepository;
        this.complaintRepository = complaintRepository;
        this.searchQueryRepository = searchQueryRepository;
        this.mongoTemplate = mongoTemplate;
    }

    // ----------------------------------------------------------------
    // Dashboard Summary
    // ----------------------------------------------------------------
    @Override
    public DashboardDTO getDashboardSummary() {
        return DashboardDTO.builder()
                .totalDepartments(departmentRepository.count())
                .totalDocuments(documentRepository.count())
                .totalNotices(noticeRepository.count())
                .totalFAQs(faqRepository.count())
                .totalFeedback(feedbackRepository.count())
                .totalRTIApplications(rtiRepository.count())
                .totalContacts(contactRepository.count())
                .publishedNotices(noticeRepository.countByPublishedTrue())
                .activeDocuments(documentRepository.count()) // Relying on @SQLRestriction for active=1
                .publishedFAQs(faqRepository.count()) // Assuming countByPublishedTrue could be added, or fallback
                .latestUpdates(getLatestUpdates())
                .trendingSearches(getTrendingSearches())
                .recentActivity(getRecentActivity())
                .build();
    }

    // ----------------------------------------------------------------
    // Citizen Dashboard Summary
    // ----------------------------------------------------------------
    @Override
    public DashboardDTO getCitizenDashboardSummary(String email) {
        return DashboardDTO.builder()
                .totalDocuments(documentRepository.count())
                .activeSchemes(schemeRepository.count())
                .processedRTIs(rtiRepository.countByApplicantEmailAndStatus(email, "RESOLVED"))
                .resolvedComplaints(complaintRepository.countByEmailAndStatus(email, com.infoseva.entity.ComplaintStatus.RESOLVED))
                .latestUpdates(getLatestUpdates())
                .recentActivity(getCitizenRecentActivity(email))
                .trendingSearches(getTrendingSearches())
                .build();
    }
    
    // ----------------------------------------------------------------
    // Data Manager Dashboard Summary
    // ----------------------------------------------------------------
    @Override
    public DashboardDTO getDataManagerDashboardSummary() {
        return DashboardDTO.builder()
                .totalDocuments(documentRepository.count())
                .publishedDocs(documentRepository.count() - documentRepository.findByReviewStatusAndActiveTrue("PENDING_REVIEW", org.springframework.data.domain.Pageable.unpaged()).getTotalElements())
                .pendingReviews(documentRepository.findByReviewStatusAndActiveTrue("PENDING_REVIEW", org.springframework.data.domain.Pageable.unpaged()).getTotalElements())
                .contentGaps(searchQueryRepository.findTopUnansweredQueries(org.springframework.data.domain.PageRequest.of(0, 1)).getTotalElements())
                .build();
    }
    // ----------------------------------------------------------------
    // Helper Methods
    // ----------------------------------------------------------------

    private java.util.List<com.infoseva.dto.DashboardUpdateDTO> getLatestUpdates() {
        java.util.List<com.infoseva.dto.DashboardUpdateDTO> updates = new java.util.ArrayList<>();
        
        // Fetch top 5 recent notices
        java.util.List<com.infoseva.entity.Notice> recentNotices = noticeRepository.findTop5ByPublishedTrueOrderByNoticeDateDesc();
        for (com.infoseva.entity.Notice notice : recentNotices) {
            String deptName = notice.getDepartmentRef() != null ? notice.getDepartmentRef().getDepartmentName() : "General";
            updates.add(com.infoseva.dto.DashboardUpdateDTO.builder()
                    .id(notice.getNoticeId())
                    .title(notice.getTitle())
                    .type(notice.getType()) // "Circular", "Notification", etc.
                    .departmentName(deptName)
                    .date(notice.getNoticeDate().atStartOfDay()) // Converting LocalDate to LocalDateTime
                    .route("/user/circulars/" + notice.getNoticeId())
                    .build());
        }
        
        // Fetch top 5 recent schemes via Pageable (since we don't have a top5 method defined)
        org.springframework.data.domain.Pageable top5 = org.springframework.data.domain.PageRequest.of(0, 5, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        org.springframework.data.domain.Page<com.infoseva.entity.Scheme> recentSchemesPage = schemeRepository.findAll(top5);
        
        for (com.infoseva.entity.Scheme scheme : recentSchemesPage.getContent()) {
            String deptName = scheme.getDepartment() != null ? scheme.getDepartment().getDepartmentName() : "General";
            updates.add(com.infoseva.dto.DashboardUpdateDTO.builder()
                    .id(scheme.getId())
                    .title(scheme.getTitle())
                    .type("Scheme")
                    .departmentName(deptName)
                    .date(scheme.getCreatedAt())
                    .route("/user/schemes/" + scheme.getId())
                    .build());
        }
        
        // Combine, sort by date descending, and take the top 5 absolute latest
        return updates.stream()
                .sorted((a, b) -> b.getDate().compareTo(a.getDate()))
                .limit(5)
                .collect(java.util.stream.Collectors.toList());
    }

    private java.util.List<String> getTrendingSearches() {
        try {
            org.springframework.data.mongodb.core.aggregation.Aggregation aggregation = org.springframework.data.mongodb.core.aggregation.Aggregation.newAggregation(
                    org.springframework.data.mongodb.core.aggregation.Aggregation.group("keyword").count().as("count"),
                    org.springframework.data.mongodb.core.aggregation.Aggregation.sort(org.springframework.data.domain.Sort.Direction.DESC, "count"),
                    org.springframework.data.mongodb.core.aggregation.Aggregation.limit(5)
            );
            org.springframework.data.mongodb.core.aggregation.AggregationResults<java.util.Map> results = mongoTemplate.aggregate(aggregation, "recent_searches", java.util.Map.class);
            return results.getMappedResults().stream()
                    .map(m -> (String) m.get("_id"))
                    .filter(k -> k != null && !k.isBlank())
                    .collect(java.util.stream.Collectors.toList());
        } catch (Exception e) {
            return new java.util.ArrayList<>();
        }
    }

    private java.util.List<com.infoseva.dto.DashboardActivityDTO> getRecentActivity() {
        return new java.util.ArrayList<>();
    }

    private java.util.List<com.infoseva.dto.DashboardActivityDTO> getCitizenRecentActivity(String email) {
        java.util.List<com.infoseva.dto.DashboardActivityDTO> activity = new java.util.ArrayList<>();
        
        org.springframework.data.domain.Pageable top5 = org.springframework.data.domain.PageRequest.of(0, 5, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        
        // Complaints
        org.springframework.data.domain.Page<com.infoseva.entity.Complaint> complaints = complaintRepository.findByEmail(email, top5);
        for (com.infoseva.entity.Complaint c : complaints.getContent()) {
            activity.add(com.infoseva.dto.DashboardActivityDTO.builder()
                    .action("Filed Complaint")
                    .item(c.getSubject())
                    .time(c.getCreatedAt() != null ? c.getCreatedAt().toString() : "")
                    .icon("FileText")
                    .route("/user/complaints/" + c.getId())
                    .rawDate(c.getCreatedAt())
                    .build());
        }
        
        // RTIs
        org.springframework.data.domain.Page<com.infoseva.entity.RTI> rtis = rtiRepository.findByApplicantEmail(email, top5);
        for (com.infoseva.entity.RTI r : rtis.getContent()) {
            activity.add(com.infoseva.dto.DashboardActivityDTO.builder()
                    .action("Filed RTI")
                    .item(r.getTitle())
                    .time(r.getCreatedAt() != null ? r.getCreatedAt().toString() : "")
                    .icon("MessageSquare")
                    .route("/user/rti/" + r.getRtiId())
                    .rawDate(r.getCreatedAt())
                    .build());
        }
        
        // Sort and take top 5
        return activity.stream()
                .filter(a -> a.getRawDate() != null)
                .sorted((a, b) -> b.getRawDate().compareTo(a.getRawDate()))
                .limit(5)
                .collect(java.util.stream.Collectors.toList());
    }
}
