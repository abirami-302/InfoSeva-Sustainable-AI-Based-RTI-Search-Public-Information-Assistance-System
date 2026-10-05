package com.infoseva.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateComplaintRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 150, message = "Name cannot exceed 150 characters")
    private String name;

    @Email(message = "Invalid email format")
    @Size(max = 150, message = "Email cannot exceed 150 characters")
    private String email;

    @Size(max = 20, message = "Mobile number cannot exceed 20 characters")
    private String mobile;

    @NotNull(message = "Department ID is required")
    private Long departmentId;

    @Size(max = 100, message = "Category cannot exceed 100 characters")
    private String category;

    // AI generates string priorities (e.g. "Medium", "High"). 
    // The Service layer will normalize this into the ComplaintPriority enum.
    @NotBlank(message = "Priority is required")
    @Size(max = 20, message = "Priority cannot exceed 20 characters")
    private String priority;

    @NotBlank(message = "Subject is required")
    @Size(max = 300, message = "Subject cannot exceed 300 characters")
    private String subject;

    @NotBlank(message = "Description is required")
    private String description;

}
