package com.infoseva.service;

import com.infoseva.dto.DocumentDTO;

import java.util.List;

public interface DocumentService {

    DocumentDTO createDocument(DocumentDTO documentDTO);

    DocumentDTO getDocumentById(Long id);

    List<DocumentDTO> getAllDocuments();

    org.springframework.data.domain.Page<DocumentDTO> getDocumentsFeed(String category, int page, int size);

    org.springframework.data.domain.Page<DocumentDTO> getReviewQueue(int page, int size);

    DocumentDTO reviewDocument(Long id, String decision, String reason);

    List<DocumentDTO> getDocumentsByCategory(String category);

    List<DocumentDTO> getDocumentsByDepartment(Long departmentId);

    DocumentDTO updateDocument(Long id, DocumentDTO documentDTO);

    void deleteDocument(Long id);

    void verifyDocumentDownloadAccess(String fileName);

    DocumentDTO uploadDocument(org.springframework.web.multipart.MultipartFile file, DocumentDTO documentDTO);

    org.springframework.data.domain.Page<DocumentDTO> getMyDrafts(int page, int size);

    DocumentDTO submitDraftForReview(Long id);
}
