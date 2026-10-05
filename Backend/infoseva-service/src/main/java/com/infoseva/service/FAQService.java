package com.infoseva.service;

import com.infoseva.dto.FAQDTO;

import java.util.List;

public interface FAQService {

    FAQDTO createFAQ(FAQDTO faqDTO);

    FAQDTO getFAQById(Long id);

    List<FAQDTO> getAllFAQs();

    org.springframework.data.domain.Page<FAQDTO> getFAQsFeed(String category, int page, int size);

    List<FAQDTO> getPublishedFAQs();

    List<FAQDTO> getFAQsByCategory(String category);

    List<FAQDTO> getFAQsByDepartment(Long departmentId);

    FAQDTO updateFAQ(Long id, FAQDTO faqDTO);

    void deleteFAQ(Long id);
}
