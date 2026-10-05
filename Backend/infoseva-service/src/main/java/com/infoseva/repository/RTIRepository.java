package com.infoseva.repository;

import com.infoseva.entity.RTI;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RTIRepository extends JpaRepository<RTI, Long> {

    List<RTI> findByStatus(String status);

    List<RTI> findByDepartmentDepartmentId(Long departmentId);

    List<RTI> findByApplicantEmail(String applicantEmail);

    org.springframework.data.domain.Page<RTI> findByApplicantEmail(String applicantEmail, org.springframework.data.domain.Pageable pageable);

    Optional<RTI> findByApplicationNumber(String applicationNumber);

    long countByApplicantEmailAndStatus(String applicantEmail, String status);

    // Global keyword search across title and description with pagination
    @org.springframework.data.jpa.repository.Query("SELECT r FROM RTI r WHERE " +
           "LOWER(r.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(CAST(r.description AS string)) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    org.springframework.data.domain.Page<RTI> searchByKeyword(@org.springframework.data.repository.query.Param("keyword") String keyword, org.springframework.data.domain.Pageable pageable);
}
