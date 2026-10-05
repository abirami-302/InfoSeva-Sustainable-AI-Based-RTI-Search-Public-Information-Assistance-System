package com.infoseva.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "APP_DOCUMENT_VIEWS", indexes = {
    @Index(name = "idx_doc_views_user", columnList = "USER_ID, VIEWED_AT")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentView {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "doc_view_seq_gen")
    @SequenceGenerator(name = "doc_view_seq_gen", sequenceName = "DOC_VIEW_SEQ", allocationSize = 1)
    @Column(name = "ID")
    private Long id;

    @Column(name = "USER_ID", nullable = false)
    private Long userId;

    @Column(name = "DOCUMENT_ID", nullable = false)
    private Long documentId;

    @Column(name = "VIEWED_AT", nullable = false)
    private LocalDateTime viewedAt;
}
