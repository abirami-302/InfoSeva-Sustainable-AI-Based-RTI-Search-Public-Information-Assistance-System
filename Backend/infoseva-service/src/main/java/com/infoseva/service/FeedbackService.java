package com.infoseva.service;

import com.infoseva.dto.FeedbackDTO;

import java.util.List;

public interface FeedbackService {

    FeedbackDTO createFeedback(FeedbackDTO feedbackDTO);

    FeedbackDTO getFeedbackById(Long id);

    List<FeedbackDTO> getAllFeedback();

    List<FeedbackDTO> getFeedbackByStatus(String status);

    org.springframework.data.domain.Page<FeedbackDTO> getFeedbackFeed(String status, int page, int size);

    FeedbackDTO markResolved(Long id);

    void deleteFeedback(Long id);
}
