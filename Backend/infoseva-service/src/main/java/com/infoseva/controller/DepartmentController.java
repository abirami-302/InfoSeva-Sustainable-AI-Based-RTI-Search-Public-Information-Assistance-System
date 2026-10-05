package com.infoseva.controller;

import com.infoseva.dto.DepartmentDTO;
import com.infoseva.response.ApiResponse;
import com.infoseva.service.DepartmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    // POST /api/departments
    @PostMapping
    public ResponseEntity<ApiResponse<DepartmentDTO>> createDepartment(@Valid @RequestBody DepartmentDTO departmentDTO) {
        DepartmentDTO created = departmentService.createDepartment(departmentDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<DepartmentDTO>builder()
                        .success(true)
                        .message("Department created successfully")
                        .data(created)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/departments
    @GetMapping
    public ResponseEntity<ApiResponse<List<DepartmentDTO>>> getAllDepartments() {
        List<DepartmentDTO> departments = departmentService.getAllDepartments();
        return ResponseEntity.ok(
                ApiResponse.<List<DepartmentDTO>>builder()
                        .success(true)
                        .message("Fetched all departments successfully")
                        .data(departments)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/departments/{id}
    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<DepartmentDTO>> getDepartmentById(@PathVariable Long id) {
        DepartmentDTO department = departmentService.getDepartmentById(id);
        return ResponseEntity.ok(
                ApiResponse.<DepartmentDTO>builder()
                        .success(true)
                        .message("Fetched department successfully")
                        .data(department)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // PUT /api/departments/{id}
    @PutMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<DepartmentDTO>> updateDepartment(
            @PathVariable Long id,
            @Valid @RequestBody DepartmentDTO departmentDTO) {
        DepartmentDTO updated = departmentService.updateDepartment(id, departmentDTO);
        return ResponseEntity.ok(
                ApiResponse.<DepartmentDTO>builder()
                        .success(true)
                        .message("Department updated successfully")
                        .data(updated)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // DELETE /api/departments/{id}
    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<Void>> deleteDepartment(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Department deleted successfully")
                        .data(null)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }
}
