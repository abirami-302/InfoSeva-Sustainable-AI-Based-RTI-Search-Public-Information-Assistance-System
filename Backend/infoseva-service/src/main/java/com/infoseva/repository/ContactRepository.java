package com.infoseva.repository;

import com.infoseva.entity.Contact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {

    List<Contact> findByStatus(String status);

    List<Contact> findByRepliedTrue();

    List<Contact> findByRepliedFalse();

    // Paginated admin methods
    org.springframework.data.domain.Page<Contact> findAll(org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<Contact> findByStatus(String status, org.springframework.data.domain.Pageable pageable);

}