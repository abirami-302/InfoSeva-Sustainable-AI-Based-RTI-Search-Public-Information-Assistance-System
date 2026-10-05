package com.infoseva.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.util.List;

@Entity
@Table(name = "SCHEMES")
@SQLDelete(sql = "UPDATE SCHEMES SET active = 0, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE scheme_id = ? AND version = ?")
@SQLRestriction("active = 1")
@EntityListeners(com.infoseva.listener.EntitySyncListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Scheme extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "scheme_seq_gen")
    @SequenceGenerator(name = "scheme_seq_gen", sequenceName = "SCHEME_SEQ", allocationSize = 1)
    @Column(name = "SCHEME_ID")
    private Long id;

    @Column(name = "SCHEME_CODE", length = 50, unique = true)
    private String schemeCode;

    @Column(name = "TITLE", nullable = false, length = 300)
    private String title;

    @Lob
    @Column(name = "DESCRIPTION", nullable = false)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DEPARTMENT_ID", nullable = false, foreignKey = @ForeignKey(name = "FK_SCHEME_DEPT"))
    private Department department;

    @Column(name = "CATEGORY", length = 100)
    private String category;

    @Lob
    @Column(name = "ELIGIBILITY")
    private String eligibility;

    @Lob
    @Column(name = "BENEFITS")
    private String benefits;

    @ElementCollection
    @CollectionTable(name = "SCHEME_REQUIRED_DOCUMENTS", joinColumns = @JoinColumn(name = "SCHEME_ID", foreignKey = @ForeignKey(name = "FK_SCHEME_DOCS_SCHEME")))
    @Column(name = "DOCUMENT_NAME")
    private List<String> requiredDocuments;

    @Lob
    @Column(name = "APPLICATION_PROCESS")
    private String applicationProcess;

    @Column(name = "APPLICATION_URL", length = 500)
    private String applicationUrl;

    @Column(name = "OFFICIAL_WEBSITE", length = 500)
    private String officialWebsite;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", nullable = false, length = 50)
    private SchemeStatus status;

    @Column(name = "LAUNCHED_YEAR")
    private Integer launchedYear;

    @Column(name = "BENEFICIARY_COUNT", length = 1000)
    private String beneficiaryCount;

    @ElementCollection
    @CollectionTable(name = "SCHEME_TAGS", joinColumns = @JoinColumn(name = "SCHEME_ID", foreignKey = @ForeignKey(name = "FK_SCHEME_TAGS_SCHEME")))
    @Column(name = "TAG_NAME")
    private List<String> tags;

    @Column(name = "FEATURED", nullable = false)
    private boolean featured;

    @Column(name = "DISPLAY_ORDER")
    private Integer displayOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "RELATED_DOCUMENT_ID", foreignKey = @ForeignKey(name = "FK_SCHEME_REL_DOC"))
    private Document relatedDocument;

}
