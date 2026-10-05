package com.infoseva.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "FEEDBACKS")
@SQLDelete(sql = "UPDATE FEEDBACKS SET active = 0, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE feedback_id = ? AND version = ?")
@SQLRestriction("active = 1")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Feedback extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "feedback_seq_gen")
    @SequenceGenerator(name = "feedback_seq_gen", sequenceName = "FEEDBACK_SEQ", allocationSize = 1)
    @Column(name = "FEEDBACK_ID")
    private Long feedbackId;

    @Column(name = "NAME", nullable = false, length = 150)
    private String name;

    @Column(name = "EMAIL", length = 150)
    private String email;

    @Column(name = "PHONE", length = 20)
    private String phone;

    @Column(name = "SUBJECT", nullable = false, length = 300)
    private String subject;

    @Lob
    @Column(name = "MESSAGE", nullable = false)
    private String message;

    @Column(name = "STATUS", nullable = false, length = 50)
    private String status;

    @Column(name = "RESOLVED", nullable = false)
    private boolean resolved;

    @Column(name = "SUBMITTED_DATE")
    private LocalDate submittedDate;
}
