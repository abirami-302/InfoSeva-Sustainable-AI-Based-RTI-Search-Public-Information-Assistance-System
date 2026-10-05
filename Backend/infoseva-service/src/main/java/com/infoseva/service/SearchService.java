package com.infoseva.service;

import com.infoseva.dto.SearchResultDTO;

import org.springframework.data.domain.Page;

import java.util.List;

public interface SearchService {

    List<SearchResultDTO> globalSearch(String keyword);

    Page<SearchResultDTO> globalSearchPaginated(String keyword, String category, String department, String year, int page, int size);
}
