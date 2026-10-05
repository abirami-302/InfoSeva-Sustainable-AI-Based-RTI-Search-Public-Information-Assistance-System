package com.infoseva.repository;

import com.infoseva.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByCategory(String category);

    List<Document> findByDepartmentDepartmentId(Long departmentId);

    List<Document> findByActiveTrue();

    List<Document> findByActiveTrueAndReviewStatus(String reviewStatus);

    java.util.Optional<Document> findByFileName(String fileName);

    java.util.Optional<Document> findByAiDocumentId(String aiDocumentId);

    List<Document> findByAiDocumentIdIn(List<String> aiDocumentIds);

    List<Document> findByDownloadableTrue();

    // Global keyword search across title and description
    @Query("SELECT d FROM Document d WHERE " +
           "LOWER(d.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(CAST(d.description AS string)) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Document> searchByKeyword(@Param("keyword") String keyword);

    // Paginated feed methods for frontend integration
    org.springframework.data.domain.Page<Document> findByActiveTrue(org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<Document> findByActiveTrueAndReviewStatus(String reviewStatus, org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<Document> findByCategoryIgnoreCaseAndActiveTrue(String category, org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<Document> findByCategoryIgnoreCaseAndActiveTrueAndReviewStatus(String category, String reviewStatus, org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<Document> findByReviewStatusAndActiveTrue(String reviewStatus, org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<Document> findByCreatedByIgnoreCaseAndReviewStatusAndActiveTrue(String createdBy, String reviewStatus, org.springframework.data.domain.Pageable pageable);
}
