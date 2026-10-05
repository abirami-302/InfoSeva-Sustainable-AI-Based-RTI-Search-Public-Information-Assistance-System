package com.infoseva.service;

import com.infoseva.dto.DashboardDTO;

public interface DashboardService {

    DashboardDTO getDashboardSummary();
    DashboardDTO getCitizenDashboardSummary(String email);
    DashboardDTO getDataManagerDashboardSummary();
}
