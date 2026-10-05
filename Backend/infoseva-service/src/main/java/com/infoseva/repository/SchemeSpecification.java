package com.infoseva.repository;

import com.infoseva.dto.SchemeFilterRequest;
import com.infoseva.entity.Scheme;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public class SchemeSpecification {

    public static Specification<Scheme> getSchemesByFilter(SchemeFilterRequest filter) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter != null) {
                // Keyword Search across title, description, category, and department name
                if (StringUtils.hasText(filter.getKeyword())) {
                    String keywordPattern = "%" + filter.getKeyword().toLowerCase() + "%";
                    Predicate titlePredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), keywordPattern);
                    Predicate descPredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("description").as(String.class)), keywordPattern);
                    Predicate categoryPredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("category")), keywordPattern);
                    Predicate deptPredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("department").get("departmentName")), keywordPattern);
                    
                    predicates.add(criteriaBuilder.or(titlePredicate, descPredicate, categoryPredicate, deptPredicate));
                }

                // Exact match filters
                if (filter.getDepartmentId() != null) {
                    predicates.add(criteriaBuilder.equal(root.get("department").get("departmentId"), filter.getDepartmentId()));
                }

                if (StringUtils.hasText(filter.getCategory())) {
                    predicates.add(criteriaBuilder.equal(root.get("category"), filter.getCategory()));
                }

                if (filter.getStatus() != null) {
                    predicates.add(criteriaBuilder.equal(root.get("status"), filter.getStatus()));
                }

                if (filter.getFeatured() != null) {
                    predicates.add(criteriaBuilder.equal(root.get("featured"), filter.getFeatured()));
                }

                if (filter.getLaunchedYear() != null) {
                    predicates.add(criteriaBuilder.equal(root.get("launchedYear"), filter.getLaunchedYear()));
                }
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
