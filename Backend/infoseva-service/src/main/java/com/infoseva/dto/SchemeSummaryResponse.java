package com.infoseva.dto;

import com.infoseva.entity.SchemeStatus;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchemeSummaryResponse {

    private Long id;
    private String title;
    
    // Flat properties to avoid exposing Entity objects
    private Long departmentId;
    private String departmentName;
    
    private String category;
    
    // For metric cards on the frontend
    private String benefits;
    private Integer launchedYear;
    private String beneficiaryCount;
    
    private SchemeStatus status;
    private boolean featured;

    // React Frontend Aliases
    public String getName() { return this.title; }
    public String getMinistry() { return this.departmentName; }
    public String getBenefit() { return this.benefits; }
    public String getBeneficiaries() { return this.beneficiaryCount; }
    public String getLaunched() { return this.launchedYear != null ? String.valueOf(this.launchedYear) : "—"; }
}
