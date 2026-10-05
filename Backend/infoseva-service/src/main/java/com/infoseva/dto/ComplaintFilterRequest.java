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
public class ComplaintFilterRequest {
    private String keyword;
    private Long departmentId;
    private ComplaintPriority priority;
    private ComplaintStatus status;
    private String trackingNumber;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
}
