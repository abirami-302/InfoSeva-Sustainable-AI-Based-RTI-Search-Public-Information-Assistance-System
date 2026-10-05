package com.infoseva.controller;

import com.infoseva.dto.ContactDTO;
import com.infoseva.response.ApiResponse;
import com.infoseva.service.ContactService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

import java.util.List;

@RestController
@RequestMapping("/api/contact")
public class ContactController {

    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    // POST /api/contact
    @PostMapping
    public ResponseEntity<ApiResponse<ContactDTO>> createContact(@Valid @RequestBody ContactDTO contactDTO) {
        ContactDTO created = contactService.createContact(contactDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<ContactDTO>builder()
                        .success(true)
                        .message("Contact message created successfully")
                        .data(created)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/contact
    @GetMapping
    public ResponseEntity<ApiResponse<List<ContactDTO>>> getAllContacts() {
        List<ContactDTO> contacts = contactService.getAllContacts();
        return ResponseEntity.ok(
                ApiResponse.<List<ContactDTO>>builder()
                        .success(true)
                        .message("Fetched all contact messages successfully")
                        .data(contacts)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/contact/feed
    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<ContactDTO>>> getContactsFeed(
            @RequestParam(value = "status", defaultValue = "All") String status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
            
        org.springframework.data.domain.Page<ContactDTO> contacts = contactService.getContactsFeed(status, page, size);
        return ResponseEntity.ok(
                ApiResponse.<org.springframework.data.domain.Page<ContactDTO>>builder()
                        .success(true)
                        .message("Fetched contact feed successfully")
                        .data(contacts)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/contact/{id}
    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<ContactDTO>> getContactById(@PathVariable Long id) {
        ContactDTO contact = contactService.getContactById(id);
        return ResponseEntity.ok(
                ApiResponse.<ContactDTO>builder()
                        .success(true)
                        .message("Fetched contact message successfully")
                        .data(contact)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/contact/status/{status}
    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<ContactDTO>>> getContactsByStatus(@PathVariable String status) {
        List<ContactDTO> contacts = contactService.getContactsByStatus(status);
        return ResponseEntity.ok(
                ApiResponse.<List<ContactDTO>>builder()
                        .success(true)
                        .message("Fetched contact messages by status successfully")
                        .data(contacts)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // PUT /api/contact/reply/{id}
    @PutMapping("/reply/{id}")
    public ResponseEntity<ApiResponse<ContactDTO>> markAsReplied(@PathVariable Long id) {
        ContactDTO replied = contactService.markAsReplied(id);
        return ResponseEntity.ok(
                ApiResponse.<ContactDTO>builder()
                        .success(true)
                        .message("Contact message marked as replied successfully")
                        .data(replied)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // DELETE /api/contact/{id}
    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<Void>> deleteContact(@PathVariable Long id) {
        contactService.deleteContact(id);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Contact message deleted successfully")
                        .data(null)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }
}
