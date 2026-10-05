package com.infoseva.repository;

import com.infoseva.entity.UserSearch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserSearchRepository extends JpaRepository<UserSearch, Long> {

    List<UserSearch> findTop10ByUserIdOrderBySearchedAtDesc(Long userId);
}
