package com.infoseva.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardActivityDTO {
    private String action;
    private String item;
    private String time;
    private String icon;
    private String route;
    
    @com.fasterxml.jackson.annotation.JsonIgnore
    private java.time.LocalDateTime rawDate;
}
