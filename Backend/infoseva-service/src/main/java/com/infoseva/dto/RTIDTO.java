package com.infoseva.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RTIDTO {

    private Long rtiId;

    @NotBlank(message = "Title is required")
    @Size(max = 300, message = "Title cannot exceed 300 characters")
    private String title;

    private String description;

    @NotBlank(message = "Applicant name is required")
    @Size(max = 150, message = "Applicant name cannot exceed 150 characters")
    private String applicantName;

    @NotBlank(message = "Applicant email is required")
    @Email(message = "Invalid email format")
    @Size(max = 150, message = "Email cannot exceed 150 characters")
    private String applicantEmail;

    @Pattern(regexp = "^\\+?[0-9]{10,20}$", message = "Invalid phone number format")
    private String applicantPhone;

    @Size(max = 100, message = "Application number cannot exceed 100 characters")
    private String applicationNumber;

    @Size(max = 50, message = "Status cannot exceed 50 characters")
    private String status;

    // Write: FK to link RTI with a Department
    private Long departmentId;

    // Read-enriched: resolved department name
    private String departmentName;

    private LocalDate submittedDate;

    private LocalDate dueDate;

    private String createdBy;

    private String updatedBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // Computed aliases for React compatibility
    public Long getId() { return this.rtiId; }
    public String getRtiNumber() { return this.applicationNumber; }
    public String getQuestion() { return this.title; }
    public String getDepartment() { return this.departmentName; }
    public LocalDate getDateFiled() { return this.submittedDate; }
    public LocalDate getDateReceived() { return this.dueDate; }
    public String getSummary() { return this.description; }
}
