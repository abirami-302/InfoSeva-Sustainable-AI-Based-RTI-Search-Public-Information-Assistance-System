package com.infoseva.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@Table(name = "FAQS")
@SQLDelete(sql = "UPDATE FAQS SET active = 0, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE faq_id = ? AND version = ?")
@SQLRestriction("active = 1")
@EntityListeners(com.infoseva.listener.EntitySyncListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FAQ extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "faq_seq_gen")
    @SequenceGenerator(name = "faq_seq_gen", sequenceName = "FAQ_SEQ", allocationSize = 1)
    @Column(name = "FAQ_ID")
    private Long faqId;

    @Column(name = "QUESTION", nullable = false, length = 500)
    private String question;

   @Column(name = "ANSWER", nullable = false, length = 4000)
private String answer;

    @Column(name = "CATEGORY", length = 100)
    private String category;

    @Column(name = "DISPLAY_ORDER")
    private Integer displayOrder;

    @Column(name = "PUBLISHED", nullable = false)
    private boolean published;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DEPARTMENT_ID", foreignKey = @ForeignKey(name = "FK_FAQ_DEPT"))
    private Department department;
}
