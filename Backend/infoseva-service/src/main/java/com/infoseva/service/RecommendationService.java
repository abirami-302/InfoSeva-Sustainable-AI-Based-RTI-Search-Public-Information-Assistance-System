package com.infoseva.service;

import com.infoseva.dto.RecommendationDTO;
import java.util.List;

public interface RecommendationService {

    List<RecommendationDTO> getRecommendationsForUser(Long userId, int limit);

    List<RecommendationDTO> getRecommendationsForUser(Long userId, String profession, int limit);
}
