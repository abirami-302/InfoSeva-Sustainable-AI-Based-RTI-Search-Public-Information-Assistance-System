package com.infoseva.dto;

import com.infoseva.entity.SchemeStatus;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchemeFilterRequest {

    // Advanced search attributes for Specifications
    private String keyword;
    private Long departmentId;
    private String category;
    private SchemeStatus status;
    private Boolean featured;
    private Integer launchedYear;
    
}
