package com.infoseva.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "APP_NOTIFICATIONS", indexes = {
        @Index(name = "idx_notif_recipient_read", columnList = "RECIPIENT_USER_ID, IS_READ"),
        @Index(name = "idx_notif_recipient_created", columnList = "RECIPIENT_USER_ID, CREATED_AT")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "notif_seq_gen")
    @SequenceGenerator(name = "notif_seq_gen", sequenceName = "NOTIFICATION_SEQ", allocationSize = 1)
    @Column(name = "ID")
    private Long id;

    @Column(name = "RECIPIENT_USER_ID", nullable = false)
    private Long recipientUserId;

    @Column(name = "ACTOR_USER_ID", nullable = false)
    private Long actorUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "TYPE", nullable = false, length = 50)
    private NotificationType type;

    @Column(name = "TITLE", nullable = false, length = 200)
    private String title;

    @Column(name = "MESSAGE", nullable = false, length = 1000)
    private String message;

    @Column(name = "REFERENCE_TYPE", length = 50)
    private String referenceType;

    @Column(name = "REFERENCE_ID", length = 100)
    private String referenceId;

    @Column(name = "IS_READ", nullable = false)
    @Builder.Default
    private boolean isRead = false;

    @CreationTimestamp
    @Column(name = "CREATED_AT", updatable = false)
    private LocalDateTime createdAt;
}
