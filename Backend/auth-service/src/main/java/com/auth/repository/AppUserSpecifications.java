package com.auth.repository;

import com.auth.entity.AppUser;
import com.auth.entity.Role;
import com.auth.entity.UserProfile;
import com.auth.entity.UserStatus;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class AppUserSpecifications {

    public static Specification<AppUser> withFilters(String search, Role role, String status) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Ensure distinct results when doing joins
            query.distinct(true);

            // Left join UserProfile for status and profile check
            Join<AppUser, UserProfile> profileJoin = root.join("profile", JoinType.LEFT);

            // 0. Exclude DELETED users (soft delete filter)
            Predicate notDeletedUserStatus = cb.or(
                    cb.isNull(profileJoin.get("status")),
                    cb.notEqual(profileJoin.get("status"), UserStatus.DELETED)
            );
            predicates.add(notDeletedUserStatus);

            // 1. Search across ID, Name, and Email
            if (search != null && !search.trim().isEmpty()) {
                String term = "%" + search.trim().toLowerCase() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("name")), term);
                Predicate emailLike = cb.like(cb.lower(root.get("email")), term);

                Predicate searchPredicate;
                try {
                    Long idVal = Long.parseLong(search.trim());
                    Predicate idMatch = cb.equal(root.get("id"), idVal);
                    searchPredicate = cb.or(idMatch, nameLike, emailLike);
                } catch (NumberFormatException e) {
                    searchPredicate = cb.or(nameLike, emailLike);
                }
                predicates.add(searchPredicate);
            }

            // 2. Role filter
            if (role != null) {
                predicates.add(cb.equal(root.get("role"), role));
            }

            // 3. Status / Pending filter
            if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) {
                String normalizedStatus = status.trim().toUpperCase();
                if ("ACTIVE".equals(normalizedStatus)) {
                    Predicate enabled = cb.isTrue(root.get("accountEnabled"));
                    Predicate activeStatus = cb.or(
                            cb.isNull(profileJoin.get("status")),
                            cb.equal(profileJoin.get("status"), UserStatus.ACTIVE)
                    );
                    predicates.add(cb.and(enabled, activeStatus));
                } else if ("SUSPENDED".equals(normalizedStatus) || "INACTIVE".equals(normalizedStatus)) {
                    Predicate disabled = cb.isFalse(root.get("accountEnabled"));
                    Predicate suspendedStatus = cb.equal(profileJoin.get("status"), UserStatus.SUSPENDED);
                    predicates.add(cb.or(disabled, suspendedStatus));
                } else if ("PENDING".equals(normalizedStatus)) {
                    Predicate profileNull = cb.isNull(profileJoin.get("id"));
                    Predicate profileIncomplete = cb.or(profileNull, cb.isFalse(profileJoin.get("profileCompleted")));
                    predicates.add(profileIncomplete);
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
