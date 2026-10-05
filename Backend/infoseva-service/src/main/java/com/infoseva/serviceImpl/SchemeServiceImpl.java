package com.infoseva.serviceImpl;

import com.infoseva.dto.*;
import com.infoseva.entity.Department;
import com.infoseva.entity.Document;
import com.infoseva.entity.Scheme;
import com.infoseva.entity.SchemeStatus;
import com.infoseva.exception.ResourceNotFoundException;
import com.infoseva.repository.DepartmentRepository;
import com.infoseva.repository.DocumentRepository;
import com.infoseva.repository.SchemeRepository;
import com.infoseva.repository.SchemeSpecification;
import com.infoseva.service.SchemeService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class SchemeServiceImpl implements SchemeService {

    private final SchemeRepository schemeRepository;
    private final DepartmentRepository departmentRepository;
    private final DocumentRepository documentRepository;

    public SchemeServiceImpl(SchemeRepository schemeRepository,
                             DepartmentRepository departmentRepository,
                             DocumentRepository documentRepository) {
        this.schemeRepository = schemeRepository;
        this.departmentRepository = departmentRepository;
        this.documentRepository = documentRepository;
    }

    @Override
    public SchemeResponse createScheme(CreateSchemeRequest request) {
        // Validate relationships
        Department department = getDepartment(request.getDepartmentId());
        Document relatedDoc = getDocumentIfExists(request.getRelatedDocumentId());

        Scheme scheme = mapToEntity(request, department, relatedDoc);
        Scheme saved = schemeRepository.save(scheme);
        return mapToResponseDTO(saved);
    }

    @Override
    public SchemeResponse updateScheme(Long id, UpdateSchemeRequest request) {
        Scheme existing = schemeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Scheme not found with id: " + id));

        // Validate relationships if changed
        Department department = getDepartment(request.getDepartmentId());
        Document relatedDoc = getDocumentIfExists(request.getRelatedDocumentId());

        updateEntityFields(existing, request, department, relatedDoc);
        Scheme updated = schemeRepository.save(existing);
        return mapToResponseDTO(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public SchemeResponse getSchemeById(Long id) {
        Scheme scheme = schemeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Scheme not found with id: " + id));
        return mapToResponseDTO(scheme);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SchemeSummaryResponse> searchSchemes(SchemeFilterRequest filter, int page, int size, String sortBy, String sortDir) {
        Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<Scheme> schemePage = schemeRepository.findAll(SchemeSpecification.getSchemesByFilter(filter), pageable);
        return schemePage.map(this::mapToSummaryResponseDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SchemeSummaryResponse> getFeaturedSchemes() {
        // Hardcoded top 4 featured active schemes
        Pageable pageable = PageRequest.of(0, 4, Sort.by(Sort.Direction.DESC, "launchedYear"));
        List<Scheme> featured = schemeRepository.findByFeaturedTrueAndStatus(SchemeStatus.ACTIVE, pageable);
        return featured.stream().map(this::mapToSummaryResponseDTO).collect(Collectors.toList());
    }

    @Override
    public void deleteScheme(Long id) {
        if (!schemeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Scheme not found with id: " + id);
        }
        schemeRepository.deleteById(id);
    }

    // ----------------------------------------------------------------
    // Validation Helpers
    // ----------------------------------------------------------------
    private Department getDepartment(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));
    }

    private Document getDocumentIfExists(Long id) {
        if (id == null) return null;
        return documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Related Document not found with id: " + id));
    }

    // ----------------------------------------------------------------
    // Manual Mapping Helpers
    // ----------------------------------------------------------------
    private Scheme mapToEntity(CreateSchemeRequest request, Department department, Document relatedDoc) {
        Scheme scheme = new Scheme();
        scheme.setTitle(request.getTitle());
        scheme.setDescription(request.getDescription());
        scheme.setDepartment(department);
        scheme.setCategory(request.getCategory());
        scheme.setEligibility(request.getEligibility());
        scheme.setBenefits(request.getBenefits());
        scheme.setRequiredDocuments(request.getRequiredDocuments());
        scheme.setApplicationProcess(request.getApplicationProcess());
        scheme.setApplicationUrl(request.getApplicationUrl());
        scheme.setOfficialWebsite(request.getOfficialWebsite());
        scheme.setStatus(request.getStatus());
        scheme.setLaunchedYear(request.getLaunchedYear());
        scheme.setBeneficiaryCount(request.getBeneficiaryCount());
        scheme.setTags(request.getTags());
        scheme.setFeatured(request.getFeatured());
        scheme.setDisplayOrder(request.getDisplayOrder());
        scheme.setRelatedDocument(relatedDoc);
        scheme.setActive(true);
        return scheme;
    }

    private void updateEntityFields(Scheme existing, UpdateSchemeRequest request, Department department, Document relatedDoc) {
        existing.setTitle(request.getTitle());
        existing.setDescription(request.getDescription());
        existing.setDepartment(department);
        existing.setCategory(request.getCategory());
        existing.setEligibility(request.getEligibility());
        existing.setBenefits(request.getBenefits());
        existing.setRequiredDocuments(request.getRequiredDocuments());
        existing.setApplicationProcess(request.getApplicationProcess());
        existing.setApplicationUrl(request.getApplicationUrl());
        existing.setOfficialWebsite(request.getOfficialWebsite());
        existing.setStatus(request.getStatus());
        existing.setLaunchedYear(request.getLaunchedYear());
        existing.setBeneficiaryCount(request.getBeneficiaryCount());
        existing.setTags(request.getTags());
        existing.setFeatured(request.getFeatured());
        existing.setDisplayOrder(request.getDisplayOrder());
        existing.setRelatedDocument(relatedDoc);
    }

    private SchemeResponse mapToResponseDTO(Scheme scheme) {
        SchemeResponse response = new SchemeResponse();
        response.setId(scheme.getId());
        response.setSchemeCode(scheme.getSchemeCode());
        response.setTitle(scheme.getTitle());
        response.setDescription(scheme.getDescription());
        response.setDepartmentId(scheme.getDepartment().getDepartmentId());
        response.setDepartmentName(scheme.getDepartment().getDepartmentName());
        response.setCategory(scheme.getCategory());
        response.setEligibility(scheme.getEligibility());
        response.setBenefits(scheme.getBenefits());
        response.setRequiredDocuments(scheme.getRequiredDocuments());
        response.setApplicationProcess(scheme.getApplicationProcess());
        response.setApplicationUrl(scheme.getApplicationUrl());
        response.setOfficialWebsite(scheme.getOfficialWebsite());
        response.setStatus(scheme.getStatus());
        response.setLaunchedYear(scheme.getLaunchedYear());
        response.setBeneficiaryCount(scheme.getBeneficiaryCount());
        response.setTags(scheme.getTags());
        response.setFeatured(scheme.isFeatured());
        response.setDisplayOrder(scheme.getDisplayOrder());
        
        if (scheme.getRelatedDocument() != null) {
            response.setRelatedDocumentId(scheme.getRelatedDocument().getDocumentId());
            response.setRelatedDocumentTitle(scheme.getRelatedDocument().getTitle());
        }

        response.setCreatedAt(scheme.getCreatedAt());
        response.setUpdatedAt(scheme.getUpdatedAt());
        return response;
    }

    private SchemeSummaryResponse mapToSummaryResponseDTO(Scheme scheme) {
        SchemeSummaryResponse response = new SchemeSummaryResponse();
        response.setId(scheme.getId());
        response.setTitle(scheme.getTitle());
        response.setDepartmentId(scheme.getDepartment().getDepartmentId());
        response.setDepartmentName(scheme.getDepartment().getDepartmentName());
        response.setCategory(scheme.getCategory());
        response.setBenefits(scheme.getBenefits());
        response.setLaunchedYear(scheme.getLaunchedYear());
        response.setBeneficiaryCount(scheme.getBeneficiaryCount());
        response.setStatus(scheme.getStatus());
        response.setFeatured(scheme.isFeatured());
        return response;
    }
}
