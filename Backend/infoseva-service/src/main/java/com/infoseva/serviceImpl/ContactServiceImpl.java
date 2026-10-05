package com.infoseva.serviceImpl;

import com.infoseva.dto.ContactDTO;
import com.infoseva.entity.Contact;
import com.infoseva.exception.ResourceNotFoundException;
import com.infoseva.repository.ContactRepository;
import com.infoseva.service.ContactService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ContactServiceImpl implements ContactService {

    private final ContactRepository contactRepository;

    public ContactServiceImpl(ContactRepository contactRepository) {
        this.contactRepository = contactRepository;
    }

    // ----------------------------------------------------------------
    // Create
    // ----------------------------------------------------------------
    @Override
    public ContactDTO createContact(ContactDTO contactDTO) {
        Contact contact = mapToEntity(contactDTO);
        if (contact.getStatus() == null || contact.getStatus().isBlank()) {
            contact.setStatus("NEW");
        }
        Contact saved = contactRepository.save(contact);
        return mapToDTO(saved);
    }

    // ----------------------------------------------------------------
    // Read - single
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public ContactDTO getContactById(Long id) {
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Contact not found with id: " + id));
        return mapToDTO(contact);
    }

    // ----------------------------------------------------------------
    // Read - all
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<ContactDTO> getAllContacts() {
        return contactRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ----------------------------------------------------------------
    // Read - paginated feed
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<ContactDTO> getContactsFeed(String status, int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending());
        org.springframework.data.domain.Page<Contact> contactPage;
        
        if (status == null || status.equalsIgnoreCase("All") || status.trim().isEmpty()) {
            contactPage = contactRepository.findAll(pageable);
        } else {
            contactPage = contactRepository.findByStatus(status, pageable);
        }
        
        return contactPage.map(this::mapToDTO);
    }

    // ----------------------------------------------------------------
    // Read - by status
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<ContactDTO> getContactsByStatus(String status) {
        return contactRepository.findByStatus(status)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ----------------------------------------------------------------
    // Mark as replied
    // ----------------------------------------------------------------
    @Override
    public ContactDTO markAsReplied(Long id) {
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Contact not found with id: " + id));
        contact.setReplied(true);
        contact.setStatus("REPLIED");
        Contact updated = contactRepository.save(contact);
        return mapToDTO(updated);
    }

    // ----------------------------------------------------------------
    // Delete
    // ----------------------------------------------------------------
    @Override
    public void deleteContact(Long id) {
        if (!contactRepository.existsById(id)) {
            throw new ResourceNotFoundException("Contact not found with id: " + id);
        }
        contactRepository.deleteById(id);
    }

    // ----------------------------------------------------------------
    // Private helpers
    // ----------------------------------------------------------------
    private Contact mapToEntity(ContactDTO dto) {
        Contact contact = new Contact();
        contact.setName(dto.getName());
        contact.setEmail(dto.getEmail());
        contact.setPhone(dto.getPhone());
        contact.setSubject(dto.getSubject());
        contact.setMessage(dto.getMessage());
        contact.setStatus(dto.getStatus());
        contact.setReplied(dto.isReplied());
        contact.setSubmittedDate(dto.getSubmittedDate());
        contact.setCreatedBy(dto.getCreatedBy());
        contact.setUpdatedBy(dto.getUpdatedBy());
        return contact;
    }

    private ContactDTO mapToDTO(Contact contact) {
        ContactDTO dto = new ContactDTO();
        dto.setContactId(contact.getContactId());
        dto.setName(contact.getName());
        dto.setEmail(contact.getEmail());
        dto.setPhone(contact.getPhone());
        dto.setSubject(contact.getSubject());
        dto.setMessage(contact.getMessage());
        dto.setStatus(contact.getStatus());
        dto.setReplied(contact.isReplied());
        dto.setSubmittedDate(contact.getSubmittedDate());
        dto.setCreatedBy(contact.getCreatedBy());
        dto.setUpdatedBy(contact.getUpdatedBy());
        dto.setCreatedAt(contact.getCreatedAt());
        dto.setUpdatedAt(contact.getUpdatedAt());
        return dto;
    }
}
