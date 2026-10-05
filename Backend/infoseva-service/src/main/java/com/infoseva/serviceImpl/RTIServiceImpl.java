package com.infoseva.serviceImpl;

import com.infoseva.dto.RTIDTO;
import com.infoseva.entity.Department;
import com.infoseva.entity.RTI;
import com.infoseva.exception.ResourceNotFoundException;
import com.infoseva.repository.DepartmentRepository;
import com.infoseva.repository.RTIRepository;
import com.infoseva.service.RTIService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class RTIServiceImpl implements RTIService {

    private final RTIRepository rtiRepository;
    private final DepartmentRepository departmentRepository;

    public RTIServiceImpl(RTIRepository rtiRepository,
                          DepartmentRepository departmentRepository) {
        this.rtiRepository = rtiRepository;
        this.departmentRepository = departmentRepository;
    }

    // ----------------------------------------------------------------
    // Create
    // ----------------------------------------------------------------
    @Override
    public RTIDTO createRTI(RTIDTO rtiDTO) {
        Department department = resolveDepartment(rtiDTO.getDepartmentId());
        RTI rti = mapToEntity(rtiDTO, department);
        if (rti.getStatus() == null || rti.getStatus().isBlank()) {
            rti.setStatus("PENDING");
        }
        RTI saved = rtiRepository.save(rti);
        return mapToDTO(saved);
    }

    // ----------------------------------------------------------------
    // Read - single by ID
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public RTIDTO getRTIById(Long id) {
        RTI rti = rtiRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "RTI application not found with id: " + id));
        return mapToDTO(rti);
    }

    // ----------------------------------------------------------------
    // Read - all
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<RTIDTO> getAllRTIs() {
        return rtiRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ----------------------------------------------------------------
    // Read - Paginated search
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<RTIDTO> searchRTIs(String query, int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return rtiRepository.searchByKeyword(query, pageable).map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<RTIDTO> getMyRTIs(String email, int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return rtiRepository.findByApplicantEmail(email, pageable).map(this::mapToDTO);
    }

    // ----------------------------------------------------------------
    // Read - by application number
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public RTIDTO getRTIByApplicationNumber(String applicationNumber) {
        RTI rti = rtiRepository.findByApplicationNumber(applicationNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "RTI application not found with application number: " + applicationNumber));
        return mapToDTO(rti);
    }

    // ----------------------------------------------------------------
    // Read - by status
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<RTIDTO> getRTIsByStatus(String status) {
        return rtiRepository.findByStatus(status)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ----------------------------------------------------------------
    // Read - by department
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<RTIDTO> getRTIsByDepartment(Long departmentId) {
        if (!departmentRepository.existsById(departmentId)) {
            throw new ResourceNotFoundException(
                    "Department not found with id: " + departmentId);
        }
        return rtiRepository.findByDepartmentDepartmentId(departmentId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ----------------------------------------------------------------
    // Update
    // ----------------------------------------------------------------
    @Override
    public RTIDTO updateRTI(Long id, RTIDTO rtiDTO) {
        RTI existing = rtiRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "RTI application not found with id: " + id));

        Department department = resolveDepartment(rtiDTO.getDepartmentId());

        existing.setTitle(rtiDTO.getTitle());
        existing.setDescription(rtiDTO.getDescription());
        existing.setApplicantName(rtiDTO.getApplicantName());
        existing.setApplicantEmail(rtiDTO.getApplicantEmail());
        existing.setApplicantPhone(rtiDTO.getApplicantPhone());
        existing.setApplicationNumber(rtiDTO.getApplicationNumber());
        existing.setStatus(rtiDTO.getStatus());
        existing.setSubmittedDate(rtiDTO.getSubmittedDate());
        existing.setDueDate(rtiDTO.getDueDate());
        existing.setDepartment(department);
        existing.setUpdatedBy(rtiDTO.getUpdatedBy());

        RTI updated = rtiRepository.save(existing);
        return mapToDTO(updated);
    }

    // ----------------------------------------------------------------
    // Delete
    // ----------------------------------------------------------------
    @Override
    public void deleteRTI(Long id) {
        if (!rtiRepository.existsById(id)) {
            throw new ResourceNotFoundException("RTI application not found with id: " + id);
        }
        rtiRepository.deleteById(id);
    }

    // ----------------------------------------------------------------
    // Private helpers
    // ----------------------------------------------------------------
    private Department resolveDepartment(Long departmentId) {
        if (departmentId == null) {
            return null;
        }
        return departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Department not found with id: " + departmentId));
    }

    private RTI mapToEntity(RTIDTO dto, Department department) {
        RTI rti = new RTI();
        rti.setTitle(dto.getTitle());
        rti.setDescription(dto.getDescription());
        rti.setApplicantName(dto.getApplicantName());
        rti.setApplicantEmail(dto.getApplicantEmail());
        rti.setApplicantPhone(dto.getApplicantPhone());
        rti.setApplicationNumber(dto.getApplicationNumber());
        rti.setStatus(dto.getStatus());
        rti.setSubmittedDate(dto.getSubmittedDate());
        rti.setDueDate(dto.getDueDate());
        rti.setDepartment(department);
        rti.setCreatedBy(dto.getCreatedBy());
        rti.setUpdatedBy(dto.getUpdatedBy());
        return rti;
    }

    private RTIDTO mapToDTO(RTI rti) {
        RTIDTO dto = new RTIDTO();
        dto.setRtiId(rti.getRtiId());
        dto.setTitle(rti.getTitle());
        dto.setDescription(rti.getDescription());
        dto.setApplicantName(rti.getApplicantName());
        dto.setApplicantEmail(rti.getApplicantEmail());
        dto.setApplicantPhone(rti.getApplicantPhone());
        dto.setApplicationNumber(rti.getApplicationNumber());
        dto.setStatus(rti.getStatus());
        dto.setSubmittedDate(rti.getSubmittedDate());
        dto.setDueDate(rti.getDueDate());
        dto.setCreatedBy(rti.getCreatedBy());
        dto.setUpdatedBy(rti.getUpdatedBy());
        dto.setCreatedAt(rti.getCreatedAt());
        dto.setUpdatedAt(rti.getUpdatedAt());

        if (rti.getDepartment() != null) {
            dto.setDepartmentId(rti.getDepartment().getDepartmentId());
            dto.setDepartmentName(rti.getDepartment().getDepartmentName());
        }

        return dto;
    }
}
