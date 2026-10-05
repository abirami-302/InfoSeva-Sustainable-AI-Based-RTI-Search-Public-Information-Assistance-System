package com.infoseva.repository;

import com.infoseva.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long>, JpaSpecificationExecutor<Complaint> {

    // Supports fetching a specific complaint by its citizen-facing tracking number
    Optional<Complaint> findByTrackingNumber(String trackingNumber);

    // Support for listing complaints belonging to a specific citizen by their email
    org.springframework.data.domain.Page<Complaint> findByEmail(String email, org.springframework.data.domain.Pageable pageable);

    // Native query to safely retrieve the next Oracle sequence value for generating unique tracking numbers
    @Query(value = "SELECT COMPLAINT_SEQ.NEXTVAL FROM DUAL", nativeQuery = true)
    Long getNextTrackingSequence();
    
    // Support for Citizen Dashboard
    long countByEmailAndStatus(String email, com.infoseva.entity.ComplaintStatus status);
    
    // Support for duplicate detection strategy
    @Query("SELECT c FROM Complaint c WHERE c.mobile = :mobile AND c.department.departmentId = :departmentId AND LOWER(c.subject) = LOWER(:subject) AND c.status NOT IN :statuses")
    java.util.List<Complaint> findActiveDuplicates(@org.springframework.data.repository.query.Param("mobile") String mobile, 
                                                   @org.springframework.data.repository.query.Param("departmentId") Long departmentId, 
                                                   @org.springframework.data.repository.query.Param("subject") String subject, 
                                                   @org.springframework.data.repository.query.Param("statuses") java.util.List<com.infoseva.entity.ComplaintStatus> statuses);
}
