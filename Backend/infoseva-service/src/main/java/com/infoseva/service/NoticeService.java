package com.infoseva.service;

import com.infoseva.dto.NoticeDTO;

import java.util.List;

public interface NoticeService {

    NoticeDTO createNotice(NoticeDTO noticeDTO);

    NoticeDTO getNoticeById(Long id);

    List<NoticeDTO> getAllNotices();

    List<NoticeDTO> getPublishedNotices();

    org.springframework.data.domain.Page<NoticeDTO> getPublishedNoticesFeed(String type, int page, int size);

    List<NoticeDTO> getNoticesByType(String type);

    NoticeDTO updateNotice(Long id, NoticeDTO noticeDTO);

    void deleteNotice(Long id);
}
