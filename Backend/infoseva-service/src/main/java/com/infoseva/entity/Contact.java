package com.infoseva.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "CONTACTS")
@SQLDelete(sql = "UPDATE CONTACTS SET active = 0, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE contact_id = ? AND version = ?")
@SQLRestriction("active = 1")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contact extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "contact_seq_gen")
    @SequenceGenerator(name = "contact_seq_gen", sequenceName = "CONTACT_SEQ", allocationSize = 1)
    @Column(name = "CONTACT_ID")
    private Long contactId;

    @Column(name = "NAME", nullable = false, length = 150)
    private String name;

    @Column(name = "EMAIL", nullable = false, length = 150)
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

    @Column(name = "REPLIED", nullable = false)
    private boolean replied;

    @Column(name = "SUBMITTED_DATE")
    private LocalDate submittedDate;
}
