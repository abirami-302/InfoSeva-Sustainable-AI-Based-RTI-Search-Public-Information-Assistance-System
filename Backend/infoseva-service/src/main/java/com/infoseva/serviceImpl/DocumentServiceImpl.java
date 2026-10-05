package com.infoseva.serviceImpl;

import com.infoseva.dto.DocumentDTO;
import com.infoseva.entity.Department;
import com.infoseva.entity.Document;
import com.infoseva.exception.ResourceNotFoundException;
import com.infoseva.repository.DepartmentRepository;
import com.infoseva.repository.DocumentRepository;
import com.infoseva.service.DocumentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@Service
@Transactional
public class DocumentServiceImpl implements DocumentService {

    private final DocumentRepository documentRepository;
    private final DepartmentRepository departmentRepository;
    private final com.infoseva.repository.SchemeRepository schemeRepository;
    private final com.infoseva.util.FileStorageUtil fileStorageUtil;

    private final com.infoseva.client.AIServiceClient aiServiceClient;
    private final AuditLogService auditLogService;
    private final com.infoseva.service.NotificationService notificationService;

    @org.springframework.beans.factory.annotation.Value("${app.storage.documents-dir:./uploads/documents}")
    private String uploadDir;

    public DocumentServiceImpl(DocumentRepository documentRepository,
                               DepartmentRepository departmentRepository,
                               com.infoseva.repository.SchemeRepository schemeRepository,
                               com.infoseva.util.FileStorageUtil fileStorageUtil,
                               com.infoseva.client.AIServiceClient aiServiceClient,
                               AuditLogService auditLogService,
                               com.infoseva.service.NotificationService notificationService) {
        this.documentRepository = documentRepository;
        this.departmentRepository = departmentRepository;
        this.schemeRepository = schemeRepository;
        this.fileStorageUtil = fileStorageUtil;
        this.aiServiceClient = aiServiceClient;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
    }

    @Override
    public DocumentDTO uploadDocument(org.springframework.web.multipart.MultipartFile file, DocumentDTO documentDTO) {
        String generatedFileName = null;
        try {
            // Strict Source Type Validation
            String rawSourceType = documentDTO.getSourceType();
            if (rawSourceType == null || rawSourceType.trim().isEmpty()) {
                throw new IllegalArgumentException("source_type is required. Must be GOVERNMENT_VERIFIED or COMMUNITY_SOURCED.");
            }
            if (!com.infoseva.entity.SourceType.isValid(rawSourceType)) {
                throw new IllegalArgumentException("Invalid source_type: '" + rawSourceType + "'. Allowed values: GOVERNMENT_VERIFIED, COMMUNITY_SOURCED.");
            }
            // Normalize to uppercase enum name
            documentDTO.setSourceType(rawSourceType.trim().toUpperCase());

            generatedFileName = fileStorageUtil.storeFile(file, uploadDir);
            documentDTO.setFileUrl("documents/" + generatedFileName);
            documentDTO.setFileName(generatedFileName);
            documentDTO.setFileType(file.getContentType() != null ? file.getContentType() : "application/octet-stream");
            documentDTO.setFileSize(file.getSize());
            documentDTO.setUploadDate(java.time.LocalDate.now());

            String currentUsername = getCurrentUsername();
            documentDTO.setCreatedBy(currentUsername);

            if ("DRAFT".equalsIgnoreCase(documentDTO.getStatus()) || "DRAFT".equalsIgnoreCase(documentDTO.getReviewStatus())) {
                documentDTO.setStatus("DRAFT");
                documentDTO.setReviewStatus("DRAFT");
                documentDTO.setActive(true);
            } else if (documentDTO.isApprovalRequired() || "PENDING_REVIEW".equalsIgnoreCase(documentDTO.getReviewStatus())) {
                documentDTO.setStatus("PENDING");
                documentDTO.setReviewStatus("PENDING_REVIEW");
                documentDTO.setActive(true);
            } else {
                documentDTO.setStatus("ACTIVE");
                documentDTO.setReviewStatus("APPROVED");
                documentDTO.setActive(true);
            }

            // Save record to Oracle
            DocumentDTO savedDoc = createDocument(documentDTO);


            // Fetch actual file resource for upload
            java.nio.file.Path filePath = java.nio.file.Paths.get(uploadDir).resolve(generatedFileName).normalize().toAbsolutePath();
            org.springframework.core.io.Resource fileResource = new org.springframework.core.io.FileSystemResource(filePath.toFile());

            if (!"DRAFT".equalsIgnoreCase(savedDoc.getReviewStatus())) {
                // Call AI Service synchronously
                String dateStr = savedDoc.getUploadDate() != null ? savedDoc.getUploadDate().toString() : java.time.LocalDate.now().toString();
                com.infoseva.client.AIServiceClient.AIServiceResponse aiResponse = aiServiceClient.uploadToAIService(
                        fileResource,
                        savedDoc.getTitle(),
                        savedDoc.getDepartmentName(),
                        savedDoc.getCategory(),
                        dateStr,
                        savedDoc.getSourceType()
                );

                if (aiResponse.isSuccess()) {
                    savedDoc.setStatus("COMPLETED");
                    savedDoc.setAiDocumentId(aiResponse.getDocumentId());
                    if ("APPROVED".equalsIgnoreCase(savedDoc.getReviewStatus())) {
                        aiServiceClient.updateDocumentStatus(aiResponse.getDocumentId(), "ACTIVE");
                    }
                } else {
                    savedDoc.setStatus("FAILED");
                    System.err.println("AI Service Error: " + aiResponse.getMessage() + " | " + aiResponse.getError());
                }

                // Update status in Oracle securely
                Document entityToUpdate = documentRepository.findById(savedDoc.getDocumentId())
                        .orElseThrow(() -> new RuntimeException("Document disappeared after creation"));
                entityToUpdate.setStatus(savedDoc.getStatus());
                entityToUpdate.setAiDocumentId(savedDoc.getAiDocumentId());
                documentRepository.save(entityToUpdate);

                
                // If directly approved/published Scheme or Scholarship, sync to Oracle SCHEMES table immediately
                if ("APPROVED".equalsIgnoreCase(savedDoc.getReviewStatus()) &&
                    ("Schemes".equalsIgnoreCase(entityToUpdate.getCategory()) || 
                     "Agriculture".equalsIgnoreCase(entityToUpdate.getCategory()) || 
                     "Health".equalsIgnoreCase(entityToUpdate.getCategory()) || 
                     "Housing".equalsIgnoreCase(entityToUpdate.getCategory()) || 
                     "Education".equalsIgnoreCase(entityToUpdate.getCategory()) || 
                     "Finance".equalsIgnoreCase(entityToUpdate.getCategory()) || 
                     "Energy".equalsIgnoreCase(entityToUpdate.getCategory()))) {
                    try {
                        com.infoseva.entity.Scheme scheme = new com.infoseva.entity.Scheme();
                        scheme.setTitle(entityToUpdate.getTitle());
                        scheme.setDescription(entityToUpdate.getDescription() != null ? entityToUpdate.getDescription() : entityToUpdate.getTitle());
                        
                        // Ensure department is non-null for SCHEMES table
                        com.infoseva.entity.Department schemeDept = entityToUpdate.getDepartment();
                        if (schemeDept == null) {
                            schemeDept = departmentRepository.findAll().stream().findFirst().orElse(null);
                        }
                        scheme.setDepartment(schemeDept);

                        scheme.setCategory(entityToUpdate.getCategory().equalsIgnoreCase("Schemes") ? "Agriculture" : entityToUpdate.getCategory());
                        scheme.setStatus(com.infoseva.entity.SchemeStatus.ACTIVE);
                        scheme.setSchemeCode("SCH-" + entityToUpdate.getDocumentId());
                        scheme.setLaunchedYear(entityToUpdate.getUploadDate() != null ? entityToUpdate.getUploadDate().getYear() : java.time.LocalDate.now().getYear());
                        scheme.setRelatedDocument(entityToUpdate);
                        scheme.setBenefits(documentDTO.getBenefit() != null ? documentDTO.getBenefit() : "Refer to official scheme guidelines");
                        scheme.setEligibility(documentDTO.getEligibility() != null ? documentDTO.getEligibility() : "Refer to official scheme guidelines");
                        String benCount = documentDTO.getBeneficiaries() != null ? documentDTO.getBeneficiaries() : "All India";
                        if (benCount.length() > 950) {
                            benCount = benCount.substring(0, 950);
                        }
                        scheme.setBeneficiaryCount(benCount);

                        String appUrl = documentDTO.getApplyLink() != null ? documentDTO.getApplyLink() : "#";
                        if (appUrl.length() > 490) {
                            appUrl = appUrl.substring(0, 490);
                        }
                        scheme.setApplicationUrl(appUrl);
                        
                        if (schemeDept != null) {
                            schemeRepository.save(scheme);
                        }
                    } catch (Exception ex) {
                        System.err.println("Failed to sync Scheme entity on direct upload: " + ex.getMessage());
                    }

                }

                auditLogService.logAction("Document", entityToUpdate.getDocumentId(), "UPLOAD", "Uploaded document: " + entityToUpdate.getTitle());

                // Trigger notification for review queue if pending review
                if ("PENDING_REVIEW".equalsIgnoreCase(savedDoc.getReviewStatus())) {
                    com.infoseva.dto.NotificationEvent notif = com.infoseva.dto.NotificationEvent.builder()
                            .type(com.infoseva.entity.NotificationType.DOCUMENT_UPLOADED)
                            .title("New document uploaded")
                            .message("Data Manager uploaded document \"" + entityToUpdate.getTitle() + "\" for review.")
                            .referenceType("DOCUMENT")
                            .referenceId(String.valueOf(entityToUpdate.getDocumentId()))
                            .build();
                    notificationService.notifyOtherDataManagers(notif);
                } else if ("APPROVED".equalsIgnoreCase(savedDoc.getReviewStatus())) {
                    // Direct upload published immediately -> Notify matched citizens by domain
                    notificationService.notifyTargetCitizensByDomain(entityToUpdate);
                }
            } else {
                auditLogService.logAction("Document", savedDoc.getId(), "DRAFT", "Saved draft document: " + savedDoc.getTitle());
            }

            return savedDoc;

        } catch (Exception e) {
            if (generatedFileName != null) {
                // If it fails before saving to DB or AI call fails catastrophically before even PENDING is recorded
                // Actually, if we already saved to DB, we shouldn't delete the file or the DB record.
                // We should just mark it FAILED. But if createDocument fails, we should delete the file.
            }
            if (e instanceof IllegalArgumentException) {
                throw (IllegalArgumentException) e;
            }
            if (e instanceof SecurityException) {
                throw (SecurityException) e;
            }
            throw new RuntimeException("Failed to upload document and save metadata: " + e.getMessage(), e);
        }
    }

    // ----------------------------------------------------------------
    // Create
    // ----------------------------------------------------------------
    @Override
    public DocumentDTO createDocument(DocumentDTO documentDTO) {
        Department department = resolveDepartment(documentDTO.getDepartmentId());
        Document document = mapToEntity(documentDTO, department);
        Document saved = documentRepository.save(document);
        return mapToDTO(saved);
    }

    // ----------------------------------------------------------------
    // Read - single
    // ----------------------------------------------------------------
    @Override
    public org.springframework.data.domain.Page<DocumentDTO> getReviewQueue(int page, int size) {
        org.springframework.data.domain.Page<Document> documents = documentRepository.findByReviewStatusAndActiveTrue(
                "PENDING_REVIEW", 
                org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "uploadDate"))
        );
        return documents.map(this::mapToDTO);
    }

    @Override
    @Transactional
    public DocumentDTO reviewDocument(Long id, String decision, String reason) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found with id: " + id));

        if (!"PENDING_REVIEW".equals(document.getReviewStatus())) {
            throw new RuntimeException("Document is not in PENDING_REVIEW state");
        }

        if ("APPROVE".equalsIgnoreCase(decision)) {
            document.setReviewStatus("APPROVED");
            if (document.getAiDocumentId() != null) {
                aiServiceClient.updateDocumentStatus(document.getAiDocumentId(), "ACTIVE");
            }

            // If document category is Schemes or Scholarship, sync to Oracle SCHEMES table
            if ("Schemes".equalsIgnoreCase(document.getCategory()) || 
                "Agriculture".equalsIgnoreCase(document.getCategory()) || 
                "Health".equalsIgnoreCase(document.getCategory()) || 
                "Housing".equalsIgnoreCase(document.getCategory()) || 
                "Education".equalsIgnoreCase(document.getCategory()) || 
                "Finance".equalsIgnoreCase(document.getCategory()) || 
                "Energy".equalsIgnoreCase(document.getCategory())) {
                try {
                    com.infoseva.entity.Scheme scheme = new com.infoseva.entity.Scheme();
                    scheme.setTitle(document.getTitle());
                    scheme.setDescription(document.getDescription() != null ? document.getDescription() : document.getTitle());
                    
                    com.infoseva.entity.Department schemeDept = document.getDepartment();
                    if (schemeDept == null) {
                        schemeDept = departmentRepository.findAll().stream().findFirst().orElse(null);
                    }
                    scheme.setDepartment(schemeDept);

                    scheme.setCategory(document.getCategory().equalsIgnoreCase("Schemes") ? "Agriculture" : document.getCategory());
                    scheme.setStatus(com.infoseva.entity.SchemeStatus.ACTIVE);
                    scheme.setSchemeCode("SCH-" + document.getDocumentId());
                    scheme.setLaunchedYear(document.getUploadDate() != null ? document.getUploadDate().getYear() : java.time.LocalDate.now().getYear());
                    scheme.setRelatedDocument(document);
                    scheme.setBenefits("Refer to official scheme guidelines");
                    scheme.setEligibility("Refer to official scheme guidelines");
                    scheme.setBeneficiaryCount("All India");
                    
                    if (schemeDept != null) {
                        schemeRepository.save(scheme);
                    }
                } catch (Exception ex) {
                    System.err.println("Failed to sync Scheme entity on review approve: " + ex.getMessage());
                }

            }
        } else if ("REJECT".equalsIgnoreCase(decision)) {
            document.setReviewStatus("REJECTED");
            if (document.getAiDocumentId() != null) {
                aiServiceClient.updateDocumentStatus(document.getAiDocumentId(), "REJECTED");
            }
        } else {
            throw new IllegalArgumentException("Invalid review decision. Must be APPROVE or REJECT.");
        }

        String currentUsername = getCurrentUsername();
        if ("APPROVE".equalsIgnoreCase(decision)) {
            document.setApprovedBy(currentUsername);
            document.setApprovedAt(java.time.LocalDateTime.now());
        }

        document.setUpdatedBy(currentUsername);
        document = documentRepository.save(document);
        
        auditLogService.logAction("Document", document.getDocumentId(), decision.toUpperCase(), decision.toUpperCase() + " document: " + document.getTitle());
        
        // Trigger 3 distinct notifications: Admin, original uploader, and other DMs
        com.infoseva.entity.NotificationType type = "APPROVE".equalsIgnoreCase(decision) 
                ? com.infoseva.entity.NotificationType.DOCUMENT_APPROVED 
                : com.infoseva.entity.NotificationType.DOCUMENT_REJECTED;
                
        String actionStr = "APPROVE".equalsIgnoreCase(decision) ? "approved" : "rejected";
        String titleStr = "APPROVE".equalsIgnoreCase(decision) ? "Document approved" : "Document rejected";
        
        // 1. Notify Admins
        com.infoseva.dto.NotificationEvent adminNotif = com.infoseva.dto.NotificationEvent.builder()
                .type(type)
                .title(titleStr)
                .message("Data Manager " + currentUsername + " " + actionStr + " document \"" + document.getTitle() + "\".")
                .referenceType("DOCUMENT")
                .referenceId(String.valueOf(document.getDocumentId()))
                .build();
        notificationService.notifyAdmins(adminNotif);

        // 2. Notify Original Uploading DM (if not the same actor)
        if (document.getCreatedBy() != null && !document.getCreatedBy().equalsIgnoreCase(currentUsername)) {
            com.infoseva.dto.NotificationEvent uploaderNotif = com.infoseva.dto.NotificationEvent.builder()
                    .type(type)
                    .title(titleStr)
                    .message("Your uploaded document \"" + document.getTitle() + "\" has been " + actionStr + " by Data Manager " + currentUsername + ".")
                    .referenceType("DOCUMENT")
                    .referenceId(String.valueOf(document.getDocumentId()))
                    .build();
            notificationService.notifyDocumentUploader(document.getCreatedBy(), uploaderNotif);
        }

        // 3. Notify Other Data Managers (excluding the approving DM and the original uploader)
        com.infoseva.dto.NotificationEvent otherDmNotif = com.infoseva.dto.NotificationEvent.builder()
                .type(type)
                .title(titleStr)
                .message("Data Manager " + currentUsername + " " + actionStr + " document \"" + document.getTitle() + "\".")
                .referenceType("DOCUMENT")
                .referenceId(String.valueOf(document.getDocumentId()))
                .build();
        notificationService.notifyOtherDataManagers(otherDmNotif, document.getCreatedBy());

        // 4. Notify Citizens based on their domain/profession if document is approved
        if ("APPROVE".equalsIgnoreCase(decision)) {
            notificationService.notifyTargetCitizensByDomain(document);
        }

        return mapToDTO(document);
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentDTO getDocumentById(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Document not found with id: " + id));

        String reviewStatus = document.getReviewStatus() != null ? document.getReviewStatus().toUpperCase() : "PENDING_REVIEW";
        
        // 1. APPROVED / ACTIVE -> Publicly accessible
        if ("APPROVED".equals(reviewStatus)) {
            return mapToDTO(document);
        }

        // 2. DRAFT -> Accessible only to the creator Data Manager
        if ("DRAFT".equals(reviewStatus)) {
            if (isDataManager()) {
                String currentUsername = getCurrentUsername();
                if (document.getCreatedBy() != null && document.getCreatedBy().equalsIgnoreCase(currentUsername)) {
                    return mapToDTO(document);
                }
            }
            throw new ResourceNotFoundException("Document not found with id: " + id);
        }

        // 3. PENDING_REVIEW / REJECTED -> Accessible only to authorized Data Managers
        if (!isDataManager()) {
            throw new ResourceNotFoundException("Document not found with id: " + id);
        }
        
        return mapToDTO(document);
    }

    @Override
    @Transactional(readOnly = true)
    public void verifyDocumentDownloadAccess(String fileName) {
        if (fileName == null || fileName.trim().isEmpty()) {
            throw new ResourceNotFoundException("File not found: " + fileName);
        }
        java.util.Optional<Document> docOpt = documentRepository.findByFileName(fileName);
        if (docOpt.isEmpty()) {
            throw new ResourceNotFoundException("File not found: " + fileName);
        }

        Document doc = docOpt.get();
        String reviewStatus = doc.getReviewStatus() != null ? doc.getReviewStatus().toUpperCase() : "PENDING_REVIEW";
        
        // 1. APPROVED / ACTIVE -> Publicly accessible
        if ("APPROVED".equals(reviewStatus)) {
            return;
        }

        // 2. DRAFT -> Accessible only to the creator Data Manager
        // If not creator, hide existence completely by returning identical 404
        if ("DRAFT".equals(reviewStatus)) {
            if (isDataManager()) {
                String currentUsername = getCurrentUsername();
                if (doc.getCreatedBy() != null && doc.getCreatedBy().equalsIgnoreCase(currentUsername)) {
                    return;
                }
            }
            throw new ResourceNotFoundException("File not found: " + fileName);
        }

        // 3. PENDING_REVIEW -> Accessible to any authorized Data Manager
        if ("PENDING_REVIEW".equals(reviewStatus)) {
            if (isDataManager()) {
                return;
            }
            throw new SecurityException("Access denied: Document is not approved for public download.");
        }

        // Fallback for any unapproved state
        if (!isDataManager()) {
            throw new SecurityException("Access denied: Document is not approved for public download.");
        }
    }



    // ----------------------------------------------------------------
    // Read - all
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<DocumentDTO> getAllDocuments() {
        if (isDataManager()) {
            final String finalUser = getCurrentUsername();
            return documentRepository.findByActiveTrue()
                    .stream()
                    // If DRAFT, only visible to the user who created it
                    .filter(doc -> !"DRAFT".equalsIgnoreCase(doc.getReviewStatus()) || 
                                   (doc.getCreatedBy() != null && doc.getCreatedBy().equalsIgnoreCase(finalUser)))
                    .map(this::mapToDTO)
                    .collect(Collectors.toList());
        }
        return documentRepository.findByActiveTrueAndReviewStatus("APPROVED")
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ----------------------------------------------------------------
    // Read - feed with dynamic filtering and pagination
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<DocumentDTO> getDocumentsFeed(String category, int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        org.springframework.data.domain.Page<Document> docPage;
        
        boolean manager = isDataManager();
        
        if (category == null || category.equalsIgnoreCase("All") || category.trim().isEmpty()) {
            if (manager) {
                docPage = documentRepository.findByActiveTrue(pageable);
            } else {
                docPage = documentRepository.findByActiveTrueAndReviewStatus("APPROVED", pageable);
            }
        } else {
            if (manager) {
                docPage = documentRepository.findByCategoryIgnoreCaseAndActiveTrue(category, pageable);
            } else {
                docPage = documentRepository.findByCategoryIgnoreCaseAndActiveTrueAndReviewStatus(category, "APPROVED", pageable);
            }
        }
        
        return docPage.map(this::mapToDTO);
    }

    // ----------------------------------------------------------------
    // Read - by category
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<DocumentDTO> getDocumentsByCategory(String category) {
        return documentRepository.findByCategory(category)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ----------------------------------------------------------------
    // Read - by department
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<DocumentDTO> getDocumentsByDepartment(Long departmentId) {
        if (!departmentRepository.existsById(departmentId)) {
            throw new ResourceNotFoundException(
                    "Department not found with id: " + departmentId);
        }
        return documentRepository.findByDepartmentDepartmentId(departmentId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ----------------------------------------------------------------
    // Update
    // ----------------------------------------------------------------
    @Override
    public DocumentDTO updateDocument(Long id, DocumentDTO documentDTO) {
        Document existing = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Document not found with id: " + id));

        Department department = resolveDepartment(documentDTO.getDepartmentId());

        existing.setTitle(documentDTO.getTitle());
        existing.setDescription(documentDTO.getDescription());
        existing.setCategory(documentDTO.getCategory());
        existing.setFileName(documentDTO.getFileName());
        existing.setFileType(documentDTO.getFileType());
        existing.setFileUrl(documentDTO.getFileUrl());
        existing.setFileSize(documentDTO.getFileSize());
        existing.setDownloadable(documentDTO.isDownloadable());
        existing.setActive(documentDTO.isActive());
        existing.setUploadDate(documentDTO.getUploadDate());
        existing.setDepartment(department);
        existing.setUpdatedBy(documentDTO.getUpdatedBy());

        Document updated = documentRepository.save(existing);
        return mapToDTO(updated);
    }

    // ----------------------------------------------------------------
    // Delete
    // ----------------------------------------------------------------
    @Override
    public void deleteDocument(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + id));

        // If document is in DRAFT status, only the creator is allowed to delete it
        // Non-creators receive 404 Not Found, completely concealing the draft's existence
        if ("DRAFT".equalsIgnoreCase(document.getReviewStatus())) {
            String currentUsername = getCurrentUsername();
            if (document.getCreatedBy() == null || !document.getCreatedBy().equalsIgnoreCase(currentUsername)) {
                throw new ResourceNotFoundException("Document not found with id: " + id);
            }
        }

        documentRepository.deleteById(id);
        auditLogService.logAction("Document", id, "DELETE", "Deleted document: " + document.getTitle());
    }

    @Override
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<DocumentDTO> getMyDrafts(int page, int size) {
        String currentUsername = getCurrentUsername();
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                page, size, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "uploadDate", "createdAt")
        );
        org.springframework.data.domain.Page<Document> drafts = documentRepository.findByCreatedByIgnoreCaseAndReviewStatusAndActiveTrue(
                currentUsername, "DRAFT", pageable
        );
        return drafts.map(this::mapToDTO);
    }

    @Override
    @Transactional
    public DocumentDTO submitDraftForReview(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + id));

        String currentUsername = getCurrentUsername();

        // If document is in DRAFT status, only creator is permitted; non-creators receive 404
        if ("DRAFT".equalsIgnoreCase(document.getReviewStatus())) {
            if (document.getCreatedBy() == null || !document.getCreatedBy().equalsIgnoreCase(currentUsername)) {
                throw new ResourceNotFoundException("Document not found with id: " + id);
            }
        } else {
            throw new IllegalArgumentException("Only draft documents can be submitted for review.");
        }

        document.setReviewStatus("PENDING_REVIEW");
        document.setStatus("PENDING");
        document.setUpdatedBy(currentUsername);
        document = documentRepository.save(document);

        auditLogService.logAction("Document", document.getDocumentId(), "SUBMIT_DRAFT", "Submitted draft for review: " + document.getTitle());

        // Process AI Service if file exists
        try {
            if (document.getFileName() != null && (document.getAiDocumentId() == null || document.getAiDocumentId().trim().isEmpty())) {
                java.nio.file.Path filePath = java.nio.file.Paths.get(uploadDir).resolve(document.getFileName()).normalize().toAbsolutePath();
                if (java.nio.file.Files.exists(filePath)) {
                    org.springframework.core.io.Resource fileResource = new org.springframework.core.io.FileSystemResource(filePath.toFile());
                    String dateStr = document.getUploadDate() != null ? document.getUploadDate().toString() : java.time.LocalDate.now().toString();
                    String deptName = document.getDepartment() != null ? document.getDepartment().getDepartmentName() : "General";
                    com.infoseva.client.AIServiceClient.AIServiceResponse aiResponse = aiServiceClient.uploadToAIService(
                            fileResource,
                            document.getTitle(),
                            deptName,
                            document.getCategory(),
                            dateStr,
                            document.getSourceType() != null ? document.getSourceType() : "UNCLASSIFIED"
                    );
                    if (aiResponse != null && aiResponse.isSuccess()) {
                        document.setStatus("COMPLETED");
                        document.setAiDocumentId(aiResponse.getDocumentId());
                        documentRepository.save(document);
                    }
                }
            }
        } catch (Exception ex) {
            System.err.println("AI Service error on draft submission: " + ex.getMessage());
        }

        // Notify other Data Managers of new submission in review queue
        com.infoseva.dto.NotificationEvent notif = com.infoseva.dto.NotificationEvent.builder()
                .type(com.infoseva.entity.NotificationType.DOCUMENT_UPLOADED)
                .title("New document in review queue")
                .message("Data Manager " + currentUsername + " submitted draft \"" + document.getTitle() + "\" for review.")
                .referenceType("DOCUMENT")
                .referenceId(String.valueOf(document.getDocumentId()))
                .build();
        notificationService.notifyOtherDataManagers(notif);

        return mapToDTO(document);
    }

    // ----------------------------------------------------------------
    private String getCurrentUsername() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null && !auth.getName().trim().isEmpty()) {
                return auth.getName();
            }
        } catch (Exception ignored) {}
        return "DATA_MANAGER";
    }

    private boolean isDataManager() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return false;
        return auth.getAuthorities().stream().anyMatch(a -> {
            String role = a.getAuthority();
            return "ROLE_DATA_MANAGER".equalsIgnoreCase(role) || 
                   "DATA_MANAGER".equalsIgnoreCase(role);
        });
    }


    private Department resolveDepartment(Long departmentId) {
        if (departmentId != null) {
            return departmentRepository.findById(departmentId).orElseGet(() -> getOrCreateDefaultDepartment());
        }
        return getOrCreateDefaultDepartment();
    }

    private Department getOrCreateDefaultDepartment() {
        return departmentRepository.findAll().stream().findFirst().orElseGet(() -> {
            try {
                Department defaultDept = Department.builder()
                        .departmentName("Ministry of Agriculture & Farmers Welfare")
                        .description("Central Government Ministry")
                        .email("contact@agri.gov.in")
                        .build();
                return departmentRepository.save(defaultDept);
            } catch (Exception e) {
                return departmentRepository.findAll().stream().findFirst().orElse(null);
            }
        });
    }



    private Document mapToEntity(DocumentDTO dto, Department department) {
        Document document = new Document();
        document.setTitle(dto.getTitle());
        document.setDescription(dto.getDescription());
        document.setCategory(dto.getCategory());
        document.setFileName(dto.getFileName());
        document.setFileType(dto.getFileType());
        document.setFileUrl(dto.getFileUrl());
        document.setFileSize(dto.getFileSize());
        document.setDownloadable(dto.isDownloadable());
        document.setActive(dto.isActive());
        document.setUploadDate(dto.getUploadDate());
        document.setDepartment(department);
        document.setCreatedBy(dto.getCreatedBy());
        document.setUpdatedBy(dto.getUpdatedBy());
        document.setApprovedBy(dto.getApprovedBy());
        document.setApprovedAt(dto.getApprovedAt());
        
        if (dto.getStatus() != null) {
            document.setStatus(dto.getStatus());
        }
        if (dto.getReviewStatus() != null) {
            document.setReviewStatus(dto.getReviewStatus());
        }
        document.setAiDocumentId(dto.getAiDocumentId());
        if (dto.getSourceType() != null && !dto.getSourceType().isBlank()) {
            document.setSourceType(dto.getSourceType().trim().toUpperCase());
        }
        return document;
    }

    private DocumentDTO mapToDTO(Document document) {
        DocumentDTO dto = new DocumentDTO();
        dto.setDocumentId(document.getDocumentId());
        dto.setTitle(document.getTitle());
        dto.setDescription(document.getDescription());
        dto.setCategory(document.getCategory());
        dto.setFileName(document.getFileName());
        dto.setFileType(document.getFileType());
        dto.setFileUrl(document.getFileUrl());
        dto.setFileSize(document.getFileSize());
        dto.setDownloadable(document.isDownloadable());
        dto.setActive(document.isActive());
        dto.setUploadDate(document.getUploadDate());
        dto.setCreatedBy(document.getCreatedBy());
        dto.setUpdatedBy(document.getUpdatedBy());
        dto.setApprovedBy(document.getApprovedBy());
        dto.setApprovedAt(document.getApprovedAt());
        dto.setCreatedAt(document.getCreatedAt());
        dto.setUpdatedAt(document.getUpdatedAt());
        dto.setStatus(document.getStatus());
        dto.setReviewStatus(document.getReviewStatus());
        dto.setAiDocumentId(document.getAiDocumentId());
        dto.setSourceType(document.getSourceType());

        if (document.getDepartment() != null) {
            dto.setDepartmentId(document.getDepartment().getDepartmentId());
            dto.setDepartmentName(document.getDepartment().getDepartmentName());
        }

        // Set dynamic field defaults / metadata if attached
        dto.setDocumentType(document.getCategory());
        dto.setMinistry(document.getDepartment() != null ? document.getDepartment().getDepartmentName() : "Government of India");
        dto.setBenefit("See scheme / document details");
        dto.setBeneficiaries("All Citizens");
        dto.setLaunchedYear(document.getUploadDate() != null ? String.valueOf(document.getUploadDate().getYear()) : "2025");
        dto.setEligibility(document.getDescription() != null ? document.getDescription() : "Refer to official document guidelines.");

        return dto;
    }
}

