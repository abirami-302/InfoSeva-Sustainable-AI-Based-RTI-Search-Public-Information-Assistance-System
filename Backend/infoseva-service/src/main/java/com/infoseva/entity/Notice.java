package com.infoseva.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "NOTICES")
@SQLDelete(sql = "UPDATE NOTICES SET active = 0, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE notice_id = ? AND version = ?")
@SQLRestriction("active = 1")
@EntityListeners(com.infoseva.listener.EntitySyncListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notice extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "notice_seq_gen")
    @SequenceGenerator(name = "notice_seq_gen", sequenceName = "NOTICE_SEQ", allocationSize = 1)
    @Column(name = "NOTICE_ID")
    private Long noticeId;

    @Column(name = "TITLE", nullable = false, length = 300)
    private String title;

    @Column(name = "TYPE", nullable = false, length = 60)
    private String type;

    @Column(name = "REFERENCE_NO", length = 100)
    private String referenceNo;

    @Column(name = "CATEGORY", length = 80)
    private String category;

    @Column(name = "SUMMARY", length = 2000)
private String summary;

    @Lob
    @Column(name = "CONTENT")
    private String content;

    @Column(name = "NOTICE_DATE")
    private LocalDate noticeDate;

    @Column(name = "BADGE", length = 40)
    private String badge;

    @Column(name = "PUBLISHED", nullable = false)
    private boolean published;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DEPARTMENT_ID", foreignKey = @ForeignKey(name = "FK_NOTICE_DEPT"))
    private Department departmentRef;
}
