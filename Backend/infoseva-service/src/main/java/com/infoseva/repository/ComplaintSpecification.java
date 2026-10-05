package com.infoseva.repository;

import com.infoseva.dto.ComplaintFilterRequest;
import com.infoseva.entity.Complaint;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public class ComplaintSpecification {

    public static Specification<Complaint> getComplaintsByFilter(ComplaintFilterRequest filter) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter != null) {
                if (StringUtils.hasText(filter.getKeyword())) {
                    String pattern = "%" + filter.getKeyword().toLowerCase() + "%";
                    Predicate subjectPred = criteriaBuilder.like(criteriaBuilder.lower(root.get("subject")), pattern);
                    Predicate descPred = criteriaBuilder.like(criteriaBuilder.lower(root.get("description").as(String.class)), pattern);
                    Predicate catPred = criteriaBuilder.like(criteriaBuilder.lower(root.get("category")), pattern);
                    
                    predicates.add(criteriaBuilder.or(subjectPred, descPred, catPred));
                }

                if (filter.getDepartmentId() != null) {
                    predicates.add(criteriaBuilder.equal(root.get("department").get("departmentId"), filter.getDepartmentId()));
                }

                if (filter.getPriority() != null) {
                    predicates.add(criteriaBuilder.equal(root.get("priority"), filter.getPriority()));
                }

                if (filter.getStatus() != null) {
                    predicates.add(criteriaBuilder.equal(root.get("status"), filter.getStatus()));
                }

                if (StringUtils.hasText(filter.getTrackingNumber())) {
                    predicates.add(criteriaBuilder.equal(root.get("trackingNumber"), filter.getTrackingNumber()));
                }

                if (filter.getStartDate() != null) {
                    predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), filter.getStartDate()));
                }

                if (filter.getEndDate() != null) {
                    predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), filter.getEndDate()));
                }
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
