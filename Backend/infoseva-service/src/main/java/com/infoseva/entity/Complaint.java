package com.infoseva.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@Table(name = "COMPLAINTS")
@SQLDelete(sql = "UPDATE COMPLAINTS SET active = 0, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE complaint_id = ? AND version = ?")
@SQLRestriction("active = 1")
@EntityListeners(com.infoseva.listener.EntitySyncListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Complaint extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "complaint_seq_gen")
    @SequenceGenerator(name = "complaint_seq_gen", sequenceName = "COMPLAINT_SEQ", allocationSize = 1)
    @Column(name = "COMPLAINT_ID")
    private Long id;

    @Column(name = "TRACKING_NUMBER", unique = true, nullable = false, length = 50, updatable = false)
    private String trackingNumber;

    @Column(name = "NAME", nullable = false, length = 150)
    private String name;

    @Email
    @Column(name = "EMAIL", length = 150)
    private String email;

    @Column(name = "MOBILE", length = 20)
    private String mobile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DEPARTMENT_ID", nullable = false, foreignKey = @ForeignKey(name = "FK_COMPLAINT_DEPT"))
    private Department department;

    @Column(name = "CATEGORY", length = 100)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(name = "PRIORITY", nullable = false, length = 20)
    private ComplaintPriority priority;

    @Column(name = "SUBJECT", nullable = false, length = 300)
    private String subject;

    @Lob
    @Column(name = "DESCRIPTION", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", nullable = false, length = 30)
    private ComplaintStatus status;

    @Lob
    @Column(name = "REMARKS")
    private String remarks;

    @Column(name = "RESOLVED_BY", length = 100)
    private String resolvedBy;

    @Column(name = "RESOLVED_AT")
    private LocalDateTime resolvedAt;

}
