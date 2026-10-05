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
public class ContactDTO {

    private Long contactId;

    @NotBlank(message = "Name is required")
    @Size(max = 150, message = "Name cannot exceed 150 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 150, message = "Email cannot exceed 150 characters")
    private String email;

    @Pattern(regexp = "^\\+?[0-9]{10,20}$", message = "Invalid phone number format")
    private String phone;

    @NotBlank(message = "Subject is required")
    @Size(max = 300, message = "Subject cannot exceed 300 characters")
    private String subject;

    @NotBlank(message = "Message is required")
    private String message;

    @Size(max = 50, message = "Status cannot exceed 50 characters")
    private String status;

    private boolean replied;

    private LocalDate submittedDate;

    private String createdBy;

    private String updatedBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
