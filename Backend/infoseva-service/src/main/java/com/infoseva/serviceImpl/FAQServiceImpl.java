package com.infoseva.serviceImpl;

import com.infoseva.dto.FAQDTO;
import com.infoseva.entity.Department;
import com.infoseva.entity.FAQ;
import com.infoseva.exception.ResourceNotFoundException;
import com.infoseva.repository.DepartmentRepository;
import com.infoseva.repository.FAQRepository;
import com.infoseva.service.FAQService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class FAQServiceImpl implements FAQService {

    private final FAQRepository faqRepository;
    private final DepartmentRepository departmentRepository;

    public FAQServiceImpl(FAQRepository faqRepository,
                          DepartmentRepository departmentRepository) {
        this.faqRepository = faqRepository;
        this.departmentRepository = departmentRepository;
    }

    // ----------------------------------------------------------------
    // Create
    // ----------------------------------------------------------------
    @Override
    public FAQDTO createFAQ(FAQDTO faqDTO) {
        Department department = resolveDepartment(faqDTO.getDepartmentId());
        FAQ faq = mapToEntity(faqDTO, department);
        FAQ saved = faqRepository.save(faq);
        return mapToDTO(saved);
    }

    // ----------------------------------------------------------------
    // Read - single
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public FAQDTO getFAQById(Long id) {
        FAQ faq = faqRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "FAQ not found with id: " + id));
        return mapToDTO(faq);
    }

    // ----------------------------------------------------------------
    // Read - all (admin view, sorted by displayOrder)
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<FAQDTO> getAllFAQs() {
        return faqRepository.findAllByOrderByDisplayOrderAsc()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ----------------------------------------------------------------
    // Read - feed with dynamic filtering and pagination
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<FAQDTO> getFAQsFeed(String category, int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        org.springframework.data.domain.Page<FAQ> faqPage;
        
        if (category == null || category.equalsIgnoreCase("All") || category.trim().isEmpty()) {
            faqPage = faqRepository.findByPublishedTrue(pageable);
        } else {
            faqPage = faqRepository.findByCategoryAndPublishedTrue(category, pageable);
        }
        
        return faqPage.map(this::mapToDTO);
    }

    // ----------------------------------------------------------------
    // Read - published only (citizen-facing, sorted by displayOrder)
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<FAQDTO> getPublishedFAQs() {
        return faqRepository.findByPublishedTrue()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ----------------------------------------------------------------
    // Read - by category
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<FAQDTO> getFAQsByCategory(String category) {
        return faqRepository.findByCategory(category)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ----------------------------------------------------------------
    // Read - by department
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<FAQDTO> getFAQsByDepartment(Long departmentId) {
        if (!departmentRepository.existsById(departmentId)) {
            throw new ResourceNotFoundException(
                    "Department not found with id: " + departmentId);
        }
        return faqRepository.findByDepartmentDepartmentId(departmentId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ----------------------------------------------------------------
    // Update
    // ----------------------------------------------------------------
    @Override
    public FAQDTO updateFAQ(Long id, FAQDTO faqDTO) {
        FAQ existing = faqRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "FAQ not found with id: " + id));

        Department department = resolveDepartment(faqDTO.getDepartmentId());

        existing.setQuestion(faqDTO.getQuestion());
        existing.setAnswer(faqDTO.getAnswer());
        existing.setCategory(faqDTO.getCategory());
        existing.setDisplayOrder(faqDTO.getDisplayOrder());
        existing.setPublished(faqDTO.isPublished());
        existing.setActive(faqDTO.isActive());
        existing.setDepartment(department);
        existing.setUpdatedBy(faqDTO.getUpdatedBy());

        FAQ updated = faqRepository.save(existing);
        return mapToDTO(updated);
    }

    // ----------------------------------------------------------------
    // Delete
    // ----------------------------------------------------------------
    @Override
    public void deleteFAQ(Long id) {
        if (!faqRepository.existsById(id)) {
            throw new ResourceNotFoundException("FAQ not found with id: " + id);
        }
        faqRepository.deleteById(id);
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

    private FAQ mapToEntity(FAQDTO dto, Department department) {
        FAQ faq = new FAQ();
        faq.setQuestion(dto.getQuestion());
        faq.setAnswer(dto.getAnswer());
        faq.setCategory(dto.getCategory());
        faq.setDisplayOrder(dto.getDisplayOrder());
        faq.setPublished(dto.isPublished());
        faq.setActive(dto.isActive());
        faq.setDepartment(department);
        faq.setCreatedBy(dto.getCreatedBy());
        faq.setUpdatedBy(dto.getUpdatedBy());
        return faq;
    }

    private FAQDTO mapToDTO(FAQ faq) {
        FAQDTO dto = new FAQDTO();
        dto.setFaqId(faq.getFaqId());
        dto.setQuestion(faq.getQuestion());
        dto.setAnswer(faq.getAnswer());
        dto.setCategory(faq.getCategory());
        dto.setDisplayOrder(faq.getDisplayOrder());
        dto.setPublished(faq.isPublished());
        dto.setActive(faq.isActive());
        dto.setCreatedBy(faq.getCreatedBy());
        dto.setUpdatedBy(faq.getUpdatedBy());
        dto.setCreatedAt(faq.getCreatedAt());
        dto.setUpdatedAt(faq.getUpdatedAt());

        if (faq.getDepartment() != null) {
            dto.setDepartmentId(faq.getDepartment().getDepartmentId());
            dto.setDepartmentName(faq.getDepartment().getDepartmentName());
        }

        return dto;
    }
}
