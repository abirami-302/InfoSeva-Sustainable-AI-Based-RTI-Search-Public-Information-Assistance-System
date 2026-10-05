package com.infoseva.serviceImpl;

import com.infoseva.dto.DepartmentDTO;
import com.infoseva.entity.Department;
import com.infoseva.exception.ResourceNotFoundException;
import com.infoseva.repository.DepartmentRepository;
import com.infoseva.service.DepartmentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;

    public DepartmentServiceImpl(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    // ----------------------------------------------------------------
    // Create
    // ----------------------------------------------------------------
    @Override
    public DepartmentDTO createDepartment(DepartmentDTO departmentDTO) {
        Department department = mapToEntity(departmentDTO);
        Department saved = departmentRepository.save(department);
        return mapToDTO(saved);
    }

    // ----------------------------------------------------------------
    // Read - single
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public DepartmentDTO getDepartmentById(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Department not found with id: " + id));
        return mapToDTO(department);
    }

    // ----------------------------------------------------------------
    // Read - all
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<DepartmentDTO> getAllDepartments() {
        return departmentRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ----------------------------------------------------------------
    // Update
    // ----------------------------------------------------------------
    @Override
    public DepartmentDTO updateDepartment(Long id, DepartmentDTO departmentDTO) {
        Department existing = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Department not found with id: " + id));

        existing.setDepartmentName(departmentDTO.getDepartmentName());
        existing.setDescription(departmentDTO.getDescription());
        existing.setHeadOfDepartment(departmentDTO.getHeadOfDepartment());
        existing.setEmail(departmentDTO.getEmail());
        existing.setPhone(departmentDTO.getPhone());
        existing.setUpdatedBy(departmentDTO.getUpdatedBy());

        Department updated = departmentRepository.save(existing);
        return mapToDTO(updated);
    }

    // ----------------------------------------------------------------
    // Delete
    // ----------------------------------------------------------------
    @Override
    public void deleteDepartment(Long id) {
        if (!departmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Department not found with id: " + id);
        }
        departmentRepository.deleteById(id);
    }

    // ----------------------------------------------------------------
    // Manual mapping helpers
    // ----------------------------------------------------------------
    private Department mapToEntity(DepartmentDTO dto) {
        Department department = new Department();
        department.setDepartmentName(dto.getDepartmentName());
        department.setDescription(dto.getDescription());
        department.setHeadOfDepartment(dto.getHeadOfDepartment());
        department.setEmail(dto.getEmail());
        department.setPhone(dto.getPhone());
        department.setActive(true);
        department.setCreatedBy(dto.getCreatedBy());
        department.setUpdatedBy(dto.getUpdatedBy());
        return department;
    }

    private DepartmentDTO mapToDTO(Department department) {
        DepartmentDTO dto = new DepartmentDTO();
        dto.setDepartmentId(department.getDepartmentId());
        dto.setDepartmentName(department.getDepartmentName());
        dto.setDescription(department.getDescription());
        dto.setHeadOfDepartment(department.getHeadOfDepartment());
        dto.setEmail(department.getEmail());
        dto.setPhone(department.getPhone());
            department.setActive(true);
        dto.setCreatedBy(department.getCreatedBy());
        dto.setUpdatedBy(department.getUpdatedBy());
        dto.setCreatedAt(department.getCreatedAt());
        dto.setUpdatedAt(department.getUpdatedAt());
        return dto;
    }
}
