package com.infoseva.service;

import com.infoseva.dto.ComplaintFilterRequest;
import com.infoseva.dto.ComplaintResponse;
import com.infoseva.dto.ComplaintSummaryResponse;
import com.infoseva.dto.CreateComplaintRequest;
import org.springframework.data.domain.Page;

public interface ComplaintService {

    ComplaintResponse createComplaint(CreateComplaintRequest request);

    ComplaintResponse getComplaintById(Long id);

    ComplaintResponse getComplaintByTrackingNumber(String trackingNumber);

    Page<ComplaintSummaryResponse> getMyComplaints(String email, int page, int size, String sortBy, String sortDir);

    Page<ComplaintSummaryResponse> searchComplaints(ComplaintFilterRequest filter, int page, int size, String sortBy, String sortDir);

    ComplaintResponse updateComplaint(Long id, CreateComplaintRequest request);

    void deleteComplaint(Long id);
}
