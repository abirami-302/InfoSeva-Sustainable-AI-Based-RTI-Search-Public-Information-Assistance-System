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
public class ComplaintSummaryResponse {

    private Long id;
    private String trackingNumber;
    
    // Flat Relationship Properties
    private Long departmentId;
    private String departmentName;

    private String category;
    private ComplaintPriority priority;
    private String subject;
    
    private ComplaintStatus status;
    private LocalDateTime createdAt;
}
