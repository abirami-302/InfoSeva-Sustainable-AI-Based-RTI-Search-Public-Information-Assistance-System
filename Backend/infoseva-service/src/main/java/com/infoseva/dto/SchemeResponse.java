package com.infoseva.dto;

import com.infoseva.entity.SchemeStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchemeResponse {

    private Long id;
    private String schemeCode;
    private String title;
    private String description;
    
    // Flat properties to avoid exposing Entity objects
    private Long departmentId;
    private String departmentName;
    
    private String category;
    private String eligibility;
    private String benefits;
    
    // Cleanly exposed collections
    private List<String> requiredDocuments;
    private String applicationProcess;
    private String applicationUrl;
    private String officialWebsite;
    private SchemeStatus status;
    private Integer launchedYear;
    private String beneficiaryCount;
    private List<String> tags;
    private boolean featured;
    private Integer displayOrder;
    
    // Related document references
    private Long relatedDocumentId;
    private String relatedDocumentTitle;
    
    // Audit fields for read operations
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // React Frontend Aliases
    public String getName() { return this.title; }
    public String getMinistry() { return this.departmentName; }
    public String getBenefit() { return this.benefits; }
    public String getBeneficiaries() { return this.beneficiaryCount; }
    public String getLaunched() { return this.launchedYear != null ? String.valueOf(this.launchedYear) : "—"; }
    public List<String> getDocumentsRequired() { return this.requiredDocuments; }
    public List<String> getHowToApply() { return this.applicationProcess != null ? List.of(this.applicationProcess.split("\\n")) : List.of(); }
    public String getApplyLink() { return this.applicationUrl; }
    public String getSampleDocumentUrl() { return null; } // No direct file URL in backend right now
}
