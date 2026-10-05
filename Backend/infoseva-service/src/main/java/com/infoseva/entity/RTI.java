package com.infoseva.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "RTI_APPLICATIONS")
@SQLDelete(sql = "UPDATE RTI_APPLICATIONS SET active = 0, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE rti_id = ? AND version = ?")
@SQLRestriction("active = 1")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RTI extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "rti_seq_gen")
    @SequenceGenerator(name = "rti_seq_gen", sequenceName = "RTI_SEQ", allocationSize = 1)
    @Column(name = "RTI_ID")
    private Long rtiId;

    @Column(name = "TITLE", nullable = false, length = 300)
    private String title;

    @Lob
    @Column(name = "DESCRIPTION")
    private String description;

    @Column(name = "APPLICANT_NAME", nullable = false, length = 150)
    private String applicantName;

    @Column(name = "APPLICANT_EMAIL", nullable = false, length = 150)
    private String applicantEmail;

    @Column(name = "APPLICANT_PHONE", length = 20)
    private String applicantPhone;

    @Column(name = "APPLICATION_NUMBER", unique = true, length = 100)
    private String applicationNumber;

    @Column(name = "STATUS", nullable = false, length = 50)
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DEPARTMENT_ID", foreignKey = @ForeignKey(name = "FK_RTI_DEPT"))
    private Department department;

    @Column(name = "SUBMITTED_DATE")
    private LocalDate submittedDate;

    @Column(name = "DUE_DATE")
    private LocalDate dueDate;
}
