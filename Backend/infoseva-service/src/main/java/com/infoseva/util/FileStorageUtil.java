package com.infoseva.util;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Component
public class FileStorageUtil {

    public String storeFile(MultipartFile file, String uploadDir) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Failed to store empty file.");
        }
        
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "");
        if (originalFilename.contains("..")) {
            throw new SecurityException("Cannot store file with relative path outside current directory " + originalFilename);
        }

        // Extract file extension
        String extension = "";
        if (originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // Allow common document and data file types
        java.util.Set<String> allowedContentTypes = new java.util.HashSet<>(java.util.Arrays.asList(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
            "application/msword",                                                      // .doc
            "text/plain",                                                             // .txt
            "text/csv",                                                               // .csv
            "application/json",                                                       // .json
            "application/xml", "text/xml",                                           // .xml
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",     // .xlsx
            "application/vnd.ms-excel",                                              // .xls
            "image/jpeg", "image/png",                                               // images
            "application/zip", "application/x-zip-compressed"                        // .zip
        ));
        String contentType = file.getContentType();
        if (contentType == null || !allowedContentTypes.contains(contentType)) {
            throw new IllegalArgumentException("Unsupported file type: " + contentType + ". Allowed types: PDF, DOCX, DOC, TXT, CSV, JSON, XML, XLSX, ZIP, images.");
        }

        java.util.Set<String> allowedExtensions = new java.util.HashSet<>(java.util.Arrays.asList(
            ".pdf", ".docx", ".doc", ".txt", ".csv", ".json", ".xml", ".xlsx", ".xls", ".jpg", ".jpeg", ".png", ".zip"
        ));
        if (!extension.isEmpty() && !allowedExtensions.contains(extension.toLowerCase())) {
            throw new IllegalArgumentException("Unsupported file extension: " + extension);
        }

        String newFileName = UUID.randomUUID().toString() + extension;
        Path rootLocation = Paths.get(uploadDir);

        if (!Files.exists(rootLocation)) {
            Files.createDirectories(rootLocation);
        }

        Path destinationFile = rootLocation.resolve(Paths.get(newFileName))
                .normalize().toAbsolutePath();

        if (!destinationFile.getParent().equals(rootLocation.toAbsolutePath().normalize())) {
            throw new SecurityException("Cannot store file outside current directory.");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
        }

        return newFileName;
    }

    public void deleteFile(String fileName, String uploadDir) {
        try {
            Path file = Paths.get(uploadDir).resolve(fileName).normalize().toAbsolutePath();
            Files.deleteIfExists(file);
        } catch (IOException e) {
            // Log the error but don't fail the transaction, rollback is already happening
            System.err.println("Could not delete orphan file: " + fileName);
        }
    }
}
