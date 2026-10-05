package com.infoseva.repository;

import com.infoseva.entity.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, Long> {

    // All published notices ordered by most recent first
    List<Notice> findByPublishedTrueOrderByNoticeDateDesc();

    // Top 5 published notices
    List<Notice> findTop5ByPublishedTrueOrderByNoticeDateDesc();

    // Count all published notices
    long countByPublishedTrue();

    // Filter by type (e.g. "Circular", "Government Order", "Act", "Scheme")
    List<Notice> findByTypeAndPublishedTrueOrderByNoticeDateDesc(String type);

    // Filter by department name string via departmentRef
    List<Notice> findByDepartmentRefDepartmentNameContainingIgnoreCaseAndPublishedTrue(String department);

    // All notices for a linked Department entity
    List<Notice> findByDepartmentRefDepartmentIdAndPublishedTrue(Long departmentId);

    // Global keyword search across title, summary, and department name
    @Query("SELECT n FROM Notice n WHERE " +
           "LOWER(n.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(CAST(n.summary AS string)) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(n.departmentRef.departmentName) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Notice> searchByKeyword(@Param("keyword") String keyword);
    // Phase 3: Paginated feed methods
    org.springframework.data.domain.Page<Notice> findByPublishedTrueOrderByNoticeDateDesc(org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<Notice> findByTypeAndPublishedTrueOrderByNoticeDateDesc(String type, org.springframework.data.domain.Pageable pageable);
}
