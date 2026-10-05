package com.infoseva.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Component
public class AIServiceClient {

    private final RestTemplate restTemplate;
    private final String aiServiceUrl;

    public AIServiceClient(@Value("${ai.service.url:http://localhost:8000}") String aiServiceUrl) {
        this.aiServiceUrl = aiServiceUrl;
        
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000); // 10 seconds
        factory.setReadTimeout(120000); // 120 seconds for large PDFs
        this.restTemplate = new RestTemplate(factory);
    }

    public AIServiceResponse uploadToAIService(Resource fileResource, String title, String department, String documentType, String documentDate, String sourceType) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", fileResource);
        body.add("title", title != null ? title : "Untitled Document");
        body.add("department", department != null && !department.isBlank() ? department : "General");
        body.add("documentType", documentType != null && !documentType.isBlank() ? documentType : "Uncategorized");
        body.add("documentDate", documentDate != null && !documentDate.isBlank() ? documentDate : java.time.LocalDate.now().toString());
        body.add("source", "Upload");
        body.add("sourceType", sourceType != null && !sourceType.isBlank() ? sourceType : "UNCLASSIFIED");

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        String url = aiServiceUrl + "/api/v1/upload";
        
        try {
            ResponseEntity<AIServiceResponse> response = restTemplate.postForEntity(url, requestEntity, AIServiceResponse.class);
            return response.getBody();
        } catch (Exception e) {
            AIServiceResponse errorResponse = new AIServiceResponse();
            errorResponse.setSuccess(false);
            errorResponse.setError(e.getMessage());
            errorResponse.setMessage("Failed to reach AI service or received error.");
            return errorResponse;
        }
    }

    public boolean validateContentGap(String query) {
        String url = aiServiceUrl + "/api/v1/validate-gap"; // Matches @router.post("/validate-gap") in search.py under /api/v1
        try {
            java.util.Map<String, String> requestBody = new java.util.HashMap<>();
            requestBody.put("query", query);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<java.util.Map<String, String>> requestEntity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<ValidationResponse> response = restTemplate.postForEntity(url, requestEntity, ValidationResponse.class);
            if (response.getBody() != null) {
                return response.getBody().isValid();
            }
        } catch (Exception e) {
            // Gracefully degrade: do not break search, just skip logging
            System.err.println("Failed to validate content gap via AI: " + e.getMessage());
        }
        return false;
    }

    public boolean updateDocumentStatus(String aiDocumentId, String newStatus) {
        if (aiDocumentId == null || aiDocumentId.isBlank()) {
            return false;
        }
        String url = aiServiceUrl + "/api/v1/documents/" + aiDocumentId + "/status";
        try {
            java.util.Map<String, String> requestBody = new java.util.HashMap<>();
            requestBody.put("status", newStatus);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<java.util.Map<String, String>> requestEntity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(url, org.springframework.http.HttpMethod.PATCH, requestEntity, String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            System.err.println("Failed to update document status in AI service: " + e.getMessage());
            return false;
        }
    }

    public java.util.List<SemanticResult> semanticSearch(String query, int topK, boolean isManager) {
        if (query == null || query.isBlank()) {
            return java.util.Collections.emptyList();
        }
        String url = aiServiceUrl + "/api/v1/search";
        try {
            java.util.Map<String, Object> requestBody = new java.util.HashMap<>();
            requestBody.put("query", query.trim());
            requestBody.put("topK", topK > 0 ? topK : 10);
            requestBody.put("isManager", isManager);
            requestBody.put("minScore", 0.30);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<java.util.Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<SemanticSearchResponse> response = restTemplate.postForEntity(url, requestEntity, SemanticSearchResponse.class);
            if (response.getBody() != null && response.getBody().getResults() != null) {
                return response.getBody().getResults();
            }
        } catch (Exception e) {
            System.err.println("Failed to perform semantic search via AI service: " + e.getMessage());
        }
        return java.util.Collections.emptyList();
    }

    public static class SemanticResult {
        private String documentId;
        private String title;
        private String department;
        private Double score;
        private String snippet;
        private String sourceType;

        public String getDocumentId() { return documentId; }
        public void setDocumentId(String documentId) { this.documentId = documentId; }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }

        public Double getScore() { return score; }
        public void setScore(Double score) { this.score = score; }

        public String getSnippet() { return snippet; }
        public void setSnippet(String snippet) { this.snippet = snippet; }

        public String getSourceType() { return sourceType; }
        public void setSourceType(String sourceType) { this.sourceType = sourceType; }
    }

    public static class SemanticSearchResponse {
        private boolean success;
        private java.util.List<SemanticResult> results;
        private int totalResults;

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }

        public java.util.List<SemanticResult> getResults() { return results; }
        public void setResults(java.util.List<SemanticResult> results) { this.results = results; }

        public int getTotalResults() { return totalResults; }
        public void setTotalResults(int totalResults) { this.totalResults = totalResults; }
    }

    public static class ValidationResponse {
        private boolean valid;
        public boolean isValid() { return valid; }
        public void setValid(boolean valid) { this.valid = valid; }
    }

    public static class AIServiceResponse {
        private boolean success;
        private String documentId;
        private String title;
        private String department;
        private int chunksProcessed;
        private String message;
        private boolean rollbackAttempted;
        private boolean rollbackSuccess;
        private String error;

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        
        public String getDocumentId() { return documentId; }
        public void setDocumentId(String documentId) { this.documentId = documentId; }
        
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        
        public int getChunksProcessed() { return chunksProcessed; }
        public void setChunksProcessed(int chunksProcessed) { this.chunksProcessed = chunksProcessed; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public boolean isRollbackAttempted() { return rollbackAttempted; }
        public void setRollbackAttempted(boolean rollbackAttempted) { this.rollbackAttempted = rollbackAttempted; }
        
        public boolean isRollbackSuccess() { return rollbackSuccess; }
        public void setRollbackSuccess(boolean rollbackSuccess) { this.rollbackSuccess = rollbackSuccess; }
        
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }
}
