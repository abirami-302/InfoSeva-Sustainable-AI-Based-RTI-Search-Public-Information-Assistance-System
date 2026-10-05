package com.infoseva.serviceImpl;

import com.infoseva.dto.ComplaintFilterRequest;
import com.infoseva.dto.ComplaintResponse;
import com.infoseva.dto.ComplaintSummaryResponse;
import com.infoseva.dto.CreateComplaintRequest;
import com.infoseva.entity.Complaint;
import com.infoseva.entity.ComplaintPriority;
import com.infoseva.entity.ComplaintStatus;
import com.infoseva.entity.Department;
import com.infoseva.exception.DuplicateComplaintException;
import com.infoseva.exception.ResourceNotFoundException;
import com.infoseva.repository.ComplaintRepository;
import com.infoseva.repository.ComplaintSpecification;
import com.infoseva.repository.DepartmentRepository;
import com.infoseva.service.ComplaintService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
@Transactional
public class ComplaintServiceImpl implements ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final DepartmentRepository departmentRepository;
    
    private static final Map<String, ComplaintPriority> PRIORITY_MAP = new HashMap<>();
    
    static {
        PRIORITY_MAP.put("LOW", ComplaintPriority.LOW);
        PRIORITY_MAP.put("MEDIUM", ComplaintPriority.MEDIUM);
        PRIORITY_MAP.put("HIGH", ComplaintPriority.HIGH);
        PRIORITY_MAP.put("URGENT", ComplaintPriority.HIGH);
        PRIORITY_MAP.put("CRITICAL", ComplaintPriority.CRITICAL);
        PRIORITY_MAP.put("IMMEDIATE", ComplaintPriority.CRITICAL);
        PRIORITY_MAP.put("VERY HIGH", ComplaintPriority.CRITICAL);
        PRIORITY_MAP.put("SEVERE", ComplaintPriority.CRITICAL);
    }

    public ComplaintServiceImpl(ComplaintRepository complaintRepository, DepartmentRepository departmentRepository) {
        this.complaintRepository = complaintRepository;
        this.departmentRepository = departmentRepository;
    }

    @Override
    public ComplaintResponse createComplaint(CreateComplaintRequest request) {
        // 1. Duplicate Detection Check
        checkForDuplicates(request.getMobile(), request.getDepartmentId(), request.getSubject());

        // 2. Relationship Validation
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + request.getDepartmentId()));

        // 3. Entity Construction
        Complaint complaint = new Complaint();
        complaint.setName(request.getName());
        complaint.setEmail(request.getEmail());
        complaint.setMobile(request.getMobile());
        complaint.setDepartment(department);
        complaint.setCategory(request.getCategory());
        complaint.setSubject(request.getSubject());
        complaint.setDescription(request.getDescription());
        
        // 4. AI Priority Normalization
        complaint.setPriority(normalizePriority(request.getPriority()));
        
        // Defaults for new complaint
        complaint.setStatus(ComplaintStatus.NEW);
        complaint.setActive(true);

        // 5. Generate Tracking Number safely using Oracle Sequence
        Long nextSeq = complaintRepository.getNextTrackingSequence();
        String trackingNo = String.format("CMP-%d-%06d", Year.now().getValue(), nextSeq);
        complaint.setTrackingNumber(trackingNo);

        Complaint saved = complaintRepository.save(complaint);
        return mapToResponseDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ComplaintResponse getComplaintById(Long id) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + id));
        return mapToResponseDTO(complaint);
    }

    @Override
    @Transactional(readOnly = true)
    public ComplaintResponse getComplaintByTrackingNumber(String trackingNumber) {
        Complaint complaint = complaintRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with tracking number: " + trackingNumber));
        return mapToResponseDTO(complaint);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ComplaintSummaryResponse> searchComplaints(ComplaintFilterRequest filter, int page, int size, String sortBy, String sortDir) {
        Sort.Direction direction = Sort.Direction.fromString(sortDir);
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<Complaint> complaints = complaintRepository.findAll(ComplaintSpecification.getComplaintsByFilter(filter), pageable);
        return complaints.map(this::mapToSummaryResponseDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ComplaintSummaryResponse> getMyComplaints(String email, int page, int size, String sortBy, String sortDir) {
        Sort.Direction direction = Sort.Direction.fromString(sortDir);
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<Complaint> complaints = complaintRepository.findByEmail(email, pageable);
        return complaints.map(this::mapToSummaryResponseDTO);
    }


    // ----------------------------------------------------------------
    // Implementation of Update and Delete
    // ----------------------------------------------------------------

    @Override
    public ComplaintResponse updateComplaint(Long id, CreateComplaintRequest request) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + id));

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + request.getDepartmentId()));

        complaint.setName(request.getName());
        complaint.setEmail(request.getEmail());
        complaint.setMobile(request.getMobile());
        complaint.setDepartment(department);
        complaint.setCategory(request.getCategory());
        complaint.setSubject(request.getSubject());
        complaint.setDescription(request.getDescription());
        complaint.setPriority(normalizePriority(request.getPriority()));

        Complaint saved = complaintRepository.save(complaint);
        return mapToResponseDTO(saved);
    }

    @Override
    public void deleteComplaint(Long id) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + id));
        complaint.setActive(false);
        complaintRepository.save(complaint);
    }

    // ----------------------------------------------------------------
    // Business Logic Helpers
    // ----------------------------------------------------------------

    private void checkForDuplicates(String mobile, Long departmentId, String subject) {
        if (mobile == null || mobile.trim().isEmpty()) {
            return; // Skip if mobile is not provided
        }
        
        List<ComplaintStatus> terminalStatuses = Arrays.asList(ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED);
        List<Complaint> activeDuplicates = complaintRepository.findActiveDuplicates(mobile, departmentId, subject, terminalStatuses);
        
        if (!activeDuplicates.isEmpty()) {
            Complaint existing = activeDuplicates.get(0);
            throw new DuplicateComplaintException("An active complaint already exists for this issue. Tracking Number: " + existing.getTrackingNumber());
        }
    }

    private ComplaintPriority normalizePriority(String rawPriority) {
        if (rawPriority == null || rawPriority.trim().isEmpty()) {
            return ComplaintPriority.MEDIUM; // Safe default
        }
        
        String normalized = rawPriority.trim().toUpperCase();
        return PRIORITY_MAP.getOrDefault(normalized, ComplaintPriority.MEDIUM);
    }

    // ----------------------------------------------------------------
    // Mapping Helpers
    // ----------------------------------------------------------------

    private ComplaintResponse mapToResponseDTO(Complaint complaint) {
        ComplaintResponse response = new ComplaintResponse();
        response.setId(complaint.getId());
        response.setTrackingNumber(complaint.getTrackingNumber());
        response.setName(complaint.getName());
        response.setEmail(complaint.getEmail());
        response.setMobile(complaint.getMobile());
        
        if (complaint.getDepartment() != null) {
            response.setDepartmentId(complaint.getDepartment().getDepartmentId());
            response.setDepartmentName(complaint.getDepartment().getDepartmentName());
        }
        
        response.setCategory(complaint.getCategory());
        response.setPriority(complaint.getPriority());
        response.setSubject(complaint.getSubject());
        response.setDescription(complaint.getDescription());
        response.setStatus(complaint.getStatus());
        response.setRemarks(complaint.getRemarks());
        response.setResolvedBy(complaint.getResolvedBy());
        response.setResolvedAt(complaint.getResolvedAt());
        response.setCreatedAt(complaint.getCreatedAt());
        response.setUpdatedAt(complaint.getUpdatedAt());
        return response;
    }

    private ComplaintSummaryResponse mapToSummaryResponseDTO(Complaint complaint) {
        ComplaintSummaryResponse response = new ComplaintSummaryResponse();
        response.setId(complaint.getId());
        response.setTrackingNumber(complaint.getTrackingNumber());
        
        if (complaint.getDepartment() != null) {
            response.setDepartmentId(complaint.getDepartment().getDepartmentId());
            response.setDepartmentName(complaint.getDepartment().getDepartmentName());
        }
        
        response.setCategory(complaint.getCategory());
        response.setPriority(complaint.getPriority());
        response.setSubject(complaint.getSubject());
        response.setStatus(complaint.getStatus());
        response.setCreatedAt(complaint.getCreatedAt());
        return response;
    }
}
