package com.infoseva.repository;

import com.infoseva.entity.DocumentView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentViewRepository extends JpaRepository<DocumentView, Long> {

    List<DocumentView> findTop10ByUserIdOrderByViewedAtDesc(Long userId);
}
