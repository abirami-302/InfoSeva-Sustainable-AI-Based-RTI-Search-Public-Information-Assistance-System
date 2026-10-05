package com.infoseva.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "APP_USER_SEARCHES", indexes = {
    @Index(name = "idx_user_searches_user", columnList = "USER_ID, SEARCHED_AT")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSearch {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "user_search_seq_gen")
    @SequenceGenerator(name = "user_search_seq_gen", sequenceName = "USER_SEARCH_SEQ", allocationSize = 1)
    @Column(name = "ID")
    private Long id;

    @Column(name = "USER_ID", nullable = false)
    private Long userId;

    @Column(name = "KEYWORD", nullable = false, length = 300)
    private String keyword;

    @Column(name = "SEARCHED_AT", nullable = false)
    private LocalDateTime searchedAt;
}
