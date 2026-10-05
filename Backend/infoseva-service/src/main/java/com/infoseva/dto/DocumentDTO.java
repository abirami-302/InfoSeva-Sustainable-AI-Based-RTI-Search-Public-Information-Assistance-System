package com.infoseva.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentDTO {

    private Long documentId;

    @NotBlank(message = "Title is required")
    @Size(max = 300, message = "Title cannot exceed 300 characters")
    private String title;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    @NotBlank(message = "Category is required")
    @Size(max = 100, message = "Category cannot exceed 100 characters")
    private String category;

    @Size(max = 255, message = "File name cannot exceed 255 characters")
    private String fileName;

    @Size(max = 50, message = "File type cannot exceed 50 characters")
    private String fileType;

    @Size(max = 500, message = "File URL cannot exceed 500 characters")
    private String fileUrl;

    private Long fileSize;

    private boolean downloadable;

    // Audit fields (mostly read-only)
    @Builder.Default
    private boolean active = true;

    // Write: FK to link document with a department entity
    private Long departmentId;

    // Read-enriched: resolved department name
    private String departmentName;

    private LocalDate uploadDate;

    private String createdBy;

    private String updatedBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private String status;

    private String reviewStatus;

    private String approvedBy;

    private LocalDateTime approvedAt;

    private boolean approvalRequired;

    private String aiDocumentId;

    private String documentType;
    private String ministry;
    private String benefit;
    private String beneficiaries;
    private String launchedYear;
    private String eligibility;
    private java.util.List<java.util.Map<String, Object>> eligibilityQuestions;
    private java.util.List<String> documentsRequired;
    private java.util.List<String> howToApply;
    private java.util.List<java.util.Map<String, String>> faqs;
    private String applyLink;
    private String educationLevel;
    private String applicationDeadline;
    private String goNumber;
    private String notificationNumber;
    private String circularNumber;
    private String actYear;
    private String actNumber;
    private String issueDate;
    private String effectiveDate;
    private String summary;
    private String directives;
    private String targetAudience;
    private String jurisdiction;
    private String sourceType;

    // Computed aliases for React compatibility
    public Long getId() {
        return this.documentId;
    }

    public String getDepartment() {
        return this.departmentName;
    }

    public LocalDate getDate() {
        return this.uploadDate;
    }

    public void setDepartment(String department) {
        this.departmentName = department;
    }
}

