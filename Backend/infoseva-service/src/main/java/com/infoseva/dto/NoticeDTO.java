package com.infoseva.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoticeDTO {

    private Long noticeId;

    @NotBlank(message = "Title is required")
    @Size(max = 300, message = "Title cannot exceed 300 characters")
    private String title;

    @NotBlank(message = "Type is required")
    @Size(max = 60, message = "Type cannot exceed 60 characters")
    private String type;

    @Size(max = 100, message = "Reference number cannot exceed 100 characters")
    private String referenceNo;

    @Size(max = 80, message = "Category cannot exceed 80 characters")
    private String category;

    private String summary;

    private String content;

    private LocalDate noticeDate;

    @Size(max = 40, message = "Badge cannot exceed 40 characters")
    private String badge;

    private boolean published;

    // Optional FK to link the notice with a Department entity
    private Long departmentRefId;

    // Read-enriched: resolved department name
    private String departmentRefName;

    private String createdBy;

    private String updatedBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // Computed aliases for React GovernmentUpdates.jsx compatibility
    public Long getId() {
        return this.noticeId;
    }

    public String getDepartment() {
        return this.departmentRefName;
    }

    public LocalDate getDate() {
        return this.noticeDate;
    }
}
