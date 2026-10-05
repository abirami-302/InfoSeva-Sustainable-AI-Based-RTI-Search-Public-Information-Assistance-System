package com.infoseva.service;

import com.infoseva.dto.CreateSchemeRequest;
import com.infoseva.dto.SchemeFilterRequest;
import com.infoseva.dto.SchemeResponse;
import com.infoseva.dto.SchemeSummaryResponse;
import com.infoseva.dto.UpdateSchemeRequest;
import org.springframework.data.domain.Page;

import java.util.List;

public interface SchemeService {

    SchemeResponse createScheme(CreateSchemeRequest request);

    SchemeResponse updateScheme(Long id, UpdateSchemeRequest request);

    SchemeResponse getSchemeById(Long id);

    Page<SchemeSummaryResponse> searchSchemes(SchemeFilterRequest filter, int page, int size, String sortBy, String sortDir);

    List<SchemeSummaryResponse> getFeaturedSchemes();

    void deleteScheme(Long id);
}
