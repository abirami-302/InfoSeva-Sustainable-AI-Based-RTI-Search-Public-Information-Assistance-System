package com.infoseva.repository;

import com.infoseva.entity.Scheme;
import com.infoseva.entity.SchemeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SchemeRepository extends JpaRepository<Scheme, Long>, JpaSpecificationExecutor<Scheme> {

    // Derived Query to quickly fetch featured schemes for the User Dashboard
    List<Scheme> findByFeaturedTrueAndStatus(SchemeStatus status, Pageable pageable);
}
