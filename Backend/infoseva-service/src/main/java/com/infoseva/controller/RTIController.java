package com.infoseva.controller;

import com.infoseva.dto.RTIDTO;
import com.infoseva.response.ApiResponse;
import com.infoseva.service.RTIService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

import java.util.List;

@RestController
@RequestMapping("/api/rti")
@io.swagger.v3.oas.annotations.tags.Tag(name = "Citizen / RTI", description = "RTI Management for Citizens")
public class RTIController {

    private final RTIService rtiService;

    public RTIController(RTIService rtiService) {
        this.rtiService = rtiService;
    }

    // POST /api/rti
    @PostMapping
    public ResponseEntity<ApiResponse<RTIDTO>> createRTI(@Valid @RequestBody RTIDTO rtiDTO) {
        RTIDTO created = rtiService.createRTI(rtiDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<RTIDTO>builder()
                        .success(true)
                        .message("RTI application created successfully")
                        .data(created)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/rti
    @GetMapping
    public ResponseEntity<ApiResponse<List<RTIDTO>>> getAllRTIs() {
        List<RTIDTO> rtis = rtiService.getAllRTIs();
        return ResponseEntity.ok(
                ApiResponse.<List<RTIDTO>>builder()
                        .success(true)
                        .message("Fetched all RTI applications successfully")
                        .data(rtis)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/rti/search
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<RTIDTO>>> searchRTIs(
            @RequestParam(value = "query", defaultValue = "") String query,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "4") int size) {
        
        org.springframework.data.domain.Page<RTIDTO> results = rtiService.searchRTIs(query, page, size);
        return ResponseEntity.ok(
                ApiResponse.<org.springframework.data.domain.Page<RTIDTO>>builder()
                        .success(true)
                        .message("RTI search completed successfully")
                        .data(results)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/rti/my
    @GetMapping("/my")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ROLE_CITIZEN')")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<RTIDTO>>> getMyRTIs(
            org.springframework.security.core.Authentication authentication,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "4") int size) {
        
        String email = authentication.getName();
        org.springframework.data.domain.Page<RTIDTO> results = rtiService.getMyRTIs(email, page, size);
        
        return ResponseEntity.ok(
                ApiResponse.<org.springframework.data.domain.Page<RTIDTO>>builder()
                        .success(true)
                        .message("Fetched your RTI applications successfully")
                        .data(results)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/rti/{id}
    @GetMapping("/{id:\\d+}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_DATA_MANAGER') or (hasAuthority('ROLE_CITIZEN') and @authz.isRtiOwner(#id, authentication.name))")
    public ResponseEntity<ApiResponse<RTIDTO>> getRTIById(@PathVariable Long id) {
        RTIDTO rti = rtiService.getRTIById(id);
        return ResponseEntity.ok(
                ApiResponse.<RTIDTO>builder()
                        .success(true)
                        .message("Fetched RTI application successfully")
                        .data(rti)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/rti/application-number/{applicationNumber}
    @GetMapping("/application-number/{applicationNumber}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_DATA_MANAGER') or (hasAuthority('ROLE_CITIZEN') and @authz.isRtiOwnerByAppNum(#applicationNumber, authentication.name))")
    public ResponseEntity<ApiResponse<RTIDTO>> getRTIByApplicationNumber(@PathVariable String applicationNumber) {
        RTIDTO rti = rtiService.getRTIByApplicationNumber(applicationNumber);
        return ResponseEntity.ok(
                ApiResponse.<RTIDTO>builder()
                        .success(true)
                        .message("Fetched RTI application by number successfully")
                        .data(rti)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/rti/status/{status}
    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<RTIDTO>>> getRTIsByStatus(@PathVariable String status) {
        List<RTIDTO> rtis = rtiService.getRTIsByStatus(status);
        return ResponseEntity.ok(
                ApiResponse.<List<RTIDTO>>builder()
                        .success(true)
                        .message("Fetched RTI applications by status successfully")
                        .data(rtis)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/rti/department/{departmentId}
    @GetMapping("/department/{departmentId}")
    public ResponseEntity<ApiResponse<List<RTIDTO>>> getRTIsByDepartment(@PathVariable Long departmentId) {
        List<RTIDTO> rtis = rtiService.getRTIsByDepartment(departmentId);
        return ResponseEntity.ok(
                ApiResponse.<List<RTIDTO>>builder()
                        .success(true)
                        .message("Fetched RTI applications by department successfully")
                        .data(rtis)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // PUT /api/rti/{id}
    @PutMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<RTIDTO>> updateRTI(
            @PathVariable Long id,
            @Valid @RequestBody RTIDTO rtiDTO) {
        RTIDTO updated = rtiService.updateRTI(id, rtiDTO);
        return ResponseEntity.ok(
                ApiResponse.<RTIDTO>builder()
                        .success(true)
                        .message("RTI application updated successfully")
                        .data(updated)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // DELETE /api/rti/{id}
    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<Void>> deleteRTI(@PathVariable Long id) {
        rtiService.deleteRTI(id);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("RTI application deleted successfully")
                        .data(null)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }
}
