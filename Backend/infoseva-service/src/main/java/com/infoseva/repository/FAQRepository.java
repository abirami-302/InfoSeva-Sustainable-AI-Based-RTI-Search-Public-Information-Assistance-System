package com.infoseva.repository;

import com.infoseva.entity.FAQ;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FAQRepository extends JpaRepository<FAQ, Long> {

    List<FAQ> findByCategory(String category);

    List<FAQ> findByPublishedTrue();

    List<FAQ> findByActiveTrue();

    List<FAQ> findByDepartmentDepartmentId(Long departmentId);

    List<FAQ> findAllByOrderByDisplayOrderAsc();

    // Global keyword search across question and answer
    @Query("SELECT f FROM FAQ f WHERE " +
           "LOWER(f.question) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(CAST(f.answer AS string)) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<FAQ> searchByKeyword(@Param("keyword") String keyword);
    
    // Paginated feed methods
    org.springframework.data.domain.Page<FAQ> findByPublishedTrue(org.springframework.data.domain.Pageable pageable);
    
    org.springframework.data.domain.Page<FAQ> findByCategoryAndPublishedTrue(String category, org.springframework.data.domain.Pageable pageable);
}
