package com.infoseva.service;

import com.infoseva.dto.ContactDTO;

import java.util.List;

public interface ContactService {

    ContactDTO createContact(ContactDTO contactDTO);

    org.springframework.data.domain.Page<ContactDTO> getContactsFeed(String status, int page, int size);

    ContactDTO getContactById(Long id);

    List<ContactDTO> getAllContacts();

    List<ContactDTO> getContactsByStatus(String status);

    ContactDTO markAsReplied(Long id);

    void deleteContact(Long id);
}
