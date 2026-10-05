package com.infoseva.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FAQDTO {

    private Long faqId;

    @NotBlank(message = "Question is required")
    @Size(max = 500, message = "Question cannot exceed 500 characters")
    private String question;

    @NotBlank(message = "Answer is required")
    private String answer;

    @Size(max = 100, message = "Category cannot exceed 100 characters")
    private String category;

    private Integer displayOrder;

    private boolean published;

    private boolean active;

    // Write: FK to link FAQ with a Department
    private Long departmentId;

    // Read-enriched: resolved department name
    private String departmentName;

    private String createdBy;

    private String updatedBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // Computed aliases for React compatibility (ApplyServices.jsx)
    public String getQ() { return this.question; }
    public String getA() { return this.answer; }
    
    // Alias for ID
    public Long getId() { return this.faqId; }
}
