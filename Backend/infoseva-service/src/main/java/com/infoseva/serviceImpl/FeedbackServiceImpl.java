package com.infoseva.serviceImpl;

import com.infoseva.dto.FeedbackDTO;
import com.infoseva.entity.Feedback;
import com.infoseva.exception.ResourceNotFoundException;
import com.infoseva.repository.FeedbackRepository;
import com.infoseva.service.FeedbackService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class FeedbackServiceImpl implements FeedbackService {

    private final FeedbackRepository feedbackRepository;

    public FeedbackServiceImpl(FeedbackRepository feedbackRepository) {
        this.feedbackRepository = feedbackRepository;
    }

    // ----------------------------------------------------------------
    // Create
    // ----------------------------------------------------------------
    @Override
    public FeedbackDTO createFeedback(FeedbackDTO feedbackDTO) {
        Feedback feedback = mapToEntity(feedbackDTO);
        // Set default status on creation if not provided
        if (feedback.getStatus() == null || feedback.getStatus().isBlank()) {
            feedback.setStatus("PENDING");
        }
        Feedback saved = feedbackRepository.save(feedback);
        return mapToDTO(saved);
    }

    // ----------------------------------------------------------------
    // Read - single
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public FeedbackDTO getFeedbackById(Long id) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Feedback not found with id: " + id));
        return mapToDTO(feedback);
    }

    // ----------------------------------------------------------------
    // Read - all
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<FeedbackDTO> getAllFeedback() {
        return feedbackRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ----------------------------------------------------------------
    // Read - paginated feed
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<FeedbackDTO> getFeedbackFeed(String status, int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending());
        org.springframework.data.domain.Page<com.infoseva.entity.Feedback> feedbackPage;
        
        if (status == null || status.equalsIgnoreCase("All") || status.trim().isEmpty()) {
            feedbackPage = feedbackRepository.findAll(pageable);
        } else {
            feedbackPage = feedbackRepository.findByStatus(status, pageable);
        }
        
        return feedbackPage.map(this::mapToDTO);
    }

    // ----------------------------------------------------------------
    // Read - by status
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<FeedbackDTO> getFeedbackByStatus(String status) {
        return feedbackRepository.findByStatus(status)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ----------------------------------------------------------------
    // Mark Resolved
    // ----------------------------------------------------------------
    @Override
    public FeedbackDTO markResolved(Long id) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Feedback not found with id: " + id));
        feedback.setResolved(true);
        feedback.setStatus("RESOLVED");
        Feedback updated = feedbackRepository.save(feedback);
        return mapToDTO(updated);
    }

    // ----------------------------------------------------------------
    // Delete
    // ----------------------------------------------------------------
    @Override
    public void deleteFeedback(Long id) {
        if (!feedbackRepository.existsById(id)) {
            throw new ResourceNotFoundException("Feedback not found with id: " + id);
        }
        feedbackRepository.deleteById(id);
    }

    // ----------------------------------------------------------------
    // Private helpers
    // ----------------------------------------------------------------
    private Feedback mapToEntity(FeedbackDTO dto) {
        Feedback feedback = new Feedback();
        feedback.setName(dto.getName());
        feedback.setEmail(dto.getEmail());
        feedback.setPhone(dto.getPhone());
        feedback.setSubject(dto.getSubject());
        feedback.setMessage(dto.getMessage());
        feedback.setStatus(dto.getStatus());
        feedback.setResolved(dto.isResolved());
        feedback.setSubmittedDate(dto.getSubmittedDate());
        feedback.setCreatedBy(dto.getCreatedBy());
        feedback.setUpdatedBy(dto.getUpdatedBy());
        return feedback;
    }

    private FeedbackDTO mapToDTO(Feedback feedback) {
        FeedbackDTO dto = new FeedbackDTO();
        dto.setFeedbackId(feedback.getFeedbackId());
        dto.setName(feedback.getName());
        dto.setEmail(feedback.getEmail());
        dto.setPhone(feedback.getPhone());
        dto.setSubject(feedback.getSubject());
        dto.setMessage(feedback.getMessage());
        dto.setStatus(feedback.getStatus());
        dto.setResolved(feedback.isResolved());
        dto.setSubmittedDate(feedback.getSubmittedDate());
        dto.setCreatedBy(feedback.getCreatedBy());
        dto.setUpdatedBy(feedback.getUpdatedBy());
        dto.setCreatedAt(feedback.getCreatedAt());
        dto.setUpdatedAt(feedback.getUpdatedAt());
        return dto;
    }
}
