package com.infoseva.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@Table(name = "DEPARTMENTS", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"DEPARTMENT_NAME"})
})
@SQLDelete(sql = "UPDATE DEPARTMENTS SET active = 0, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE department_id = ? AND version = ?")
@SQLRestriction("active = 1")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Department extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "dept_seq_gen")
    @SequenceGenerator(name = "dept_seq_gen", sequenceName = "DEPARTMENT_SEQ", allocationSize = 1)
    @Column(name = "DEPARTMENT_ID")
    private Long departmentId;

    @Column(name = "DEPARTMENT_NAME", nullable = false, length = 100)
    private String departmentName;

    @Column(name = "DESCRIPTION", length = 500)
    private String description;

    @Column(name = "HEAD_OF_DEPARTMENT", length = 100)
    private String headOfDepartment;

    @Column(name = "EMAIL", length = 150)
    private String email;

    @Column(name = "PHONE", length = 20)
    private String phone;
}
