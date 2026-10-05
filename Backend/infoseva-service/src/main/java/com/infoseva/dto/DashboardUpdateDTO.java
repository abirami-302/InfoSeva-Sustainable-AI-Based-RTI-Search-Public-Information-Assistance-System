package com.infoseva.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardUpdateDTO {
    private Long id;
    private String title;
    private String type;
    private String departmentName;
    private LocalDateTime date;
    private String route;
}
