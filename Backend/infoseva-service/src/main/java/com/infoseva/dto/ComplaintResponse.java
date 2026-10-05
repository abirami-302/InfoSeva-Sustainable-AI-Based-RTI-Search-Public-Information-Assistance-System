package com.infoseva.dto;

import com.infoseva.entity.ComplaintPriority;
import com.infoseva.entity.ComplaintStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintResponse {

    private Long id;
    private String trackingNumber;
    
    // Citizen Details
    private String name;
    private String email;
    private String mobile;

    // Flat Relationship Properties (Hiding Entity)
    private Long departmentId;
    private String departmentName;

    // Issue Details
    private String category;
    private ComplaintPriority priority;
    private String subject;
    private String description;
    
    // Tracking/Admin Details
    private ComplaintStatus status;
    private String remarks;
    private String resolvedBy;
    private LocalDateTime resolvedAt;

    // Audit Fields
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
