package com.infoseva.security;

import com.infoseva.repository.ComplaintRepository;
import com.infoseva.repository.RTIRepository;
import org.springframework.stereotype.Component;

@Component("authz")
public class SecurityEvaluator {

    private final ComplaintRepository complaintRepository;
    private final RTIRepository rtiRepository;

    public SecurityEvaluator(ComplaintRepository complaintRepository, RTIRepository rtiRepository) {
        this.complaintRepository = complaintRepository;
        this.rtiRepository = rtiRepository;
    }

    public boolean isComplaintOwner(Long id, String email) {
        if (id == null || email == null) return false;
        return complaintRepository.findById(id)
                .map(c -> email.equalsIgnoreCase(c.getEmail()))
                .orElse(false);
    }

    public boolean isComplaintOwnerByTracking(String trackingNum, String email) {
        if (trackingNum == null || email == null) return false;
        return complaintRepository.findByTrackingNumber(trackingNum)
                .map(c -> email.equalsIgnoreCase(c.getEmail()))
                .orElse(false);
    }

    public boolean isRtiOwner(Long id, String email) {
        if (id == null || email == null) return false;
        return rtiRepository.findById(id)
                .map(r -> email.equalsIgnoreCase(r.getApplicantEmail()))
                .orElse(false);
    }

    public boolean isRtiOwnerByAppNum(String appNum, String email) {
        if (appNum == null || email == null) return false;
        return rtiRepository.findByApplicationNumber(appNum)
                .map(r -> email.equalsIgnoreCase(r.getApplicantEmail()))
                .orElse(false);
    }
}
