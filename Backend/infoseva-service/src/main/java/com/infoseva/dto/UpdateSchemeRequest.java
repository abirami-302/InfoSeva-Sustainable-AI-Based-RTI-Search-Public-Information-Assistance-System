package com.infoseva.dto;

import com.infoseva.entity.SchemeStatus;
import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateSchemeRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 300, message = "Title cannot exceed 300 characters")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Department ID is required")
    private Long departmentId;

    @Size(max = 100, message = "Category cannot exceed 100 characters")
    private String category;

    @NotBlank(message = "Eligibility criteria is required")
    private String eligibility;

    @NotBlank(message = "Benefits description is required")
    private String benefits;

    @NotEmpty(message = "At least one required document must be specified")
    private List<String> requiredDocuments;

    @NotBlank(message = "Application process is required")
    private String applicationProcess;

    @Size(max = 500, message = "Application URL cannot exceed 500 characters")
    private String applicationUrl;

    @Size(max = 500, message = "Official website URL cannot exceed 500 characters")
    private String officialWebsite;

    @NotNull(message = "Status is required")
    private SchemeStatus status;

    @NotNull(message = "Launched year is required")
    @Min(value = 1947, message = "Launched year must be valid")
    private Integer launchedYear;

    @NotBlank(message = "Beneficiary count is required")
    @Size(max = 100, message = "Beneficiary count cannot exceed 100 characters")
    private String beneficiaryCount;

    @NotEmpty(message = "At least one tag is required")
    private List<String> tags;

    @NotNull(message = "Featured flag is required")
    private Boolean featured;

    @Positive(message = "Display order must be positive")
    private Integer displayOrder;

    private Long relatedDocumentId;
}
