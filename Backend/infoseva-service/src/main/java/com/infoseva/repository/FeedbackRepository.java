package com.infoseva.repository;

import com.infoseva.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    List<Feedback> findByStatus(String status);

    List<Feedback> findByResolvedTrue();

    List<Feedback> findByResolvedFalse();

    // Paginated admin methods
    org.springframework.data.domain.Page<Feedback> findAll(org.springframework.data.domain.Pageable pageable);
    
    org.springframework.data.domain.Page<Feedback> findByStatus(String status, org.springframework.data.domain.Pageable pageable);
}
