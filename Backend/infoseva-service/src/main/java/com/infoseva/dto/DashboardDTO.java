package com.infoseva.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardDTO {

    private Long totalDepartments;

    private Long totalDocuments;

    private Long totalNotices;

    private Long totalFAQs;

    private Long totalFeedback;

    private Long totalRTIApplications;

    private Long totalContacts;

    private Long publishedNotices;

    private Long activeDocuments;

    private Long publishedFAQs;

    private java.util.List<DashboardUpdateDTO> latestUpdates;
    
    private java.util.List<String> trendingSearches;
    
    private java.util.List<DashboardActivityDTO> recentActivity;

    // Fields for Citizen Dashboard
    private Long activeSchemes;
    private Long processedRTIs;
    private Long resolvedComplaints;

    // Fields for Data Manager Dashboard
    private Long pendingReviews;
    private Long contentGaps;
    private Long publishedDocs;
}
