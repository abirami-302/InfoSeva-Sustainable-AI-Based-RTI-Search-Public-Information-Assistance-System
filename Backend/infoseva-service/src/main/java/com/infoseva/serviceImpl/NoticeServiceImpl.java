package com.infoseva.serviceImpl;

import com.infoseva.dto.NoticeDTO;
import com.infoseva.entity.Department;
import com.infoseva.entity.Notice;
import com.infoseva.exception.ResourceNotFoundException;
import com.infoseva.repository.DepartmentRepository;
import com.infoseva.repository.NoticeRepository;
import com.infoseva.service.NoticeService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class NoticeServiceImpl implements NoticeService {

    private final NoticeRepository noticeRepository;
    private final DepartmentRepository departmentRepository;

    public NoticeServiceImpl(NoticeRepository noticeRepository,
                             DepartmentRepository departmentRepository) {
        this.noticeRepository = noticeRepository;
        this.departmentRepository = departmentRepository;
    }

    // ----------------------------------------------------------------
    // Create
    // ----------------------------------------------------------------
    @Override
    public NoticeDTO createNotice(NoticeDTO noticeDTO) {
        Department departmentRef = resolveDepartment(noticeDTO.getDepartmentRefId());
        Notice notice = mapToEntity(noticeDTO, departmentRef);
        Notice saved = noticeRepository.save(notice);
        return mapToDTO(saved);
    }

    // ----------------------------------------------------------------
    // Read - single
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public NoticeDTO getNoticeById(Long id) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notice not found with id: " + id));
        return mapToDTO(notice);
    }

    // ----------------------------------------------------------------
    // Read - all (admin view)
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<NoticeDTO> getAllNotices() {
        return noticeRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ----------------------------------------------------------------
    // Read - published only (citizen-facing view)
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<NoticeDTO> getPublishedNotices() {
        return noticeRepository.findByPublishedTrueOrderByNoticeDateDesc()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ----------------------------------------------------------------
    // Read - published feed with dynamic filtering and pagination
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<NoticeDTO> getPublishedNoticesFeed(String type, int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        org.springframework.data.domain.Page<Notice> noticePage;
        
        if (type == null || type.equalsIgnoreCase("All")) {
            noticePage = noticeRepository.findByPublishedTrueOrderByNoticeDateDesc(pageable);
        } else {
            noticePage = noticeRepository.findByTypeAndPublishedTrueOrderByNoticeDateDesc(type, pageable);
        }
        
        return noticePage.map(this::mapToDTO);
    }

    // ----------------------------------------------------------------
    // Read - by type (Circular / Government Order / Act / Scheme)
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<NoticeDTO> getNoticesByType(String type) {
        return noticeRepository.findByTypeAndPublishedTrueOrderByNoticeDateDesc(type)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ----------------------------------------------------------------
    // Update
    // ----------------------------------------------------------------
    @Override
    public NoticeDTO updateNotice(Long id, NoticeDTO noticeDTO) {
        Notice existing = noticeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notice not found with id: " + id));

        Department departmentRef = resolveDepartment(noticeDTO.getDepartmentRefId());

        existing.setTitle(noticeDTO.getTitle());
        existing.setType(noticeDTO.getType());
        existing.setReferenceNo(noticeDTO.getReferenceNo());
        existing.setCategory(noticeDTO.getCategory());
        existing.setSummary(noticeDTO.getSummary());
        existing.setContent(noticeDTO.getContent());
        existing.setNoticeDate(noticeDTO.getNoticeDate());
        existing.setBadge(noticeDTO.getBadge());
        existing.setPublished(noticeDTO.isPublished());
        existing.setDepartmentRef(departmentRef);
        existing.setUpdatedBy(noticeDTO.getUpdatedBy());

        Notice updated = noticeRepository.save(existing);
        return mapToDTO(updated);
    }

    // ----------------------------------------------------------------
    // Delete
    // ----------------------------------------------------------------
    @Override
    public void deleteNotice(Long id) {
        if (!noticeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Notice not found with id: " + id);
        }
        noticeRepository.deleteById(id);
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

    private Notice mapToEntity(NoticeDTO dto, Department departmentRef) {
        Notice notice = new Notice();
        notice.setTitle(dto.getTitle());
        notice.setType(dto.getType());
        notice.setReferenceNo(dto.getReferenceNo());
        notice.setCategory(dto.getCategory());
        notice.setSummary(dto.getSummary());
        notice.setContent(dto.getContent());
        notice.setNoticeDate(dto.getNoticeDate());
        notice.setBadge(dto.getBadge());
        notice.setPublished(dto.isPublished());
        notice.setDepartmentRef(departmentRef);
        notice.setCreatedBy(dto.getCreatedBy());
        notice.setUpdatedBy(dto.getUpdatedBy());
        return notice;
    }

    private NoticeDTO mapToDTO(Notice notice) {
        NoticeDTO dto = new NoticeDTO();
        dto.setNoticeId(notice.getNoticeId());
        dto.setTitle(notice.getTitle());
        dto.setType(notice.getType());
        dto.setReferenceNo(notice.getReferenceNo());
        dto.setCategory(notice.getCategory());
        dto.setSummary(notice.getSummary());
        dto.setContent(notice.getContent());
        dto.setNoticeDate(notice.getNoticeDate());
        dto.setBadge(notice.getBadge());
        dto.setPublished(notice.isPublished());
        dto.setCreatedBy(notice.getCreatedBy());
        dto.setUpdatedBy(notice.getUpdatedBy());
        dto.setCreatedAt(notice.getCreatedAt());
        dto.setUpdatedAt(notice.getUpdatedAt());

        if (notice.getDepartmentRef() != null) {
            dto.setDepartmentRefId(notice.getDepartmentRef().getDepartmentId());
            dto.setDepartmentRefName(notice.getDepartmentRef().getDepartmentName());
        }

        return dto;
    }
}
