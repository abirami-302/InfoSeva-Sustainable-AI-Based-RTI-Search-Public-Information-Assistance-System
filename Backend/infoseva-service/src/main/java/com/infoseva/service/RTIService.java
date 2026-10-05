package com.infoseva.service;

import com.infoseva.dto.RTIDTO;

import java.util.List;

public interface RTIService {

    RTIDTO createRTI(RTIDTO rtiDTO);

    RTIDTO getRTIById(Long id);

    List<RTIDTO> getAllRTIs();

    org.springframework.data.domain.Page<RTIDTO> getMyRTIs(String email, int page, int size);

    org.springframework.data.domain.Page<RTIDTO> searchRTIs(String query, int page, int size);

    RTIDTO getRTIByApplicationNumber(String applicationNumber);

    List<RTIDTO> getRTIsByStatus(String status);

    List<RTIDTO> getRTIsByDepartment(Long departmentId);

    RTIDTO updateRTI(Long id, RTIDTO rtiDTO);

    void deleteRTI(Long id);
}
