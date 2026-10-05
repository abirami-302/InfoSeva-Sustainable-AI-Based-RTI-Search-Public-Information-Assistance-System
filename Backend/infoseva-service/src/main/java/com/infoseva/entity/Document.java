package com.infoseva.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "DOCUMENTS")
@SQLDelete(sql = "UPDATE DOCUMENTS SET active = 0, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE document_id = ? AND version = ?")
@SQLRestriction("active = 1")
@EntityListeners(com.infoseva.listener.EntitySyncListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "doc_seq_gen")
    @SequenceGenerator(name = "doc_seq_gen", sequenceName = "DOCUMENT_SEQ", allocationSize = 1)
    @Column(name = "DOCUMENT_ID")
    private Long documentId;

    @Column(name = "TITLE", nullable = false, length = 300)
    private String title;

    @Column(name = "DESCRIPTION", length = 1000)
    private String description;

    @Column(name = "CATEGORY", nullable = false, length = 100)
    private String category;

    @Column(name = "FILE_NAME", length = 255)
    private String fileName;

    @Column(name = "FILE_TYPE", length = 50)
    private String fileType;

    @Column(name = "FILE_URL", length = 500)
    private String fileUrl;

    @Column(name = "FILE_SIZE")
    private Long fileSize;

    @Column(name = "DOWNLOADABLE", nullable = false)
    private boolean downloadable;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DEPARTMENT_ID", foreignKey = @ForeignKey(name = "FK_DOC_DEPT"))
    private Department department;

    @Column(name = "UPLOAD_DATE")
    private LocalDate uploadDate;

    @Column(name = "STATUS", length = 20)
    @Builder.Default
    private String status = "PENDING"; // Default to PENDING

    @Column(name = "REVIEW_STATUS", length = 20)
    @Builder.Default
    private String reviewStatus = "NOT_REQUIRED"; // Default for generic docs

    @Column(name = "AI_DOCUMENT_ID", length = 100)
    private String aiDocumentId;

    @Column(name = "APPROVED_BY", length = 100)
    private String approvedBy;

    @Column(name = "APPROVED_AT")
    private LocalDateTime approvedAt;

    @Column(name = "SOURCE_TYPE", length = 50, nullable = false)
    @Builder.Default
    private String sourceType = "UNCLASSIFIED";

}
