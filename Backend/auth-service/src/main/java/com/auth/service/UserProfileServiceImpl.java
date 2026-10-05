package com.auth.service;

import com.auth.dto.request.AddressUpdateRequest;
import com.auth.dto.request.PreferencesUpdateRequest;
import com.auth.dto.request.ProfileUpdateRequest;
import com.auth.entity.*;
import com.auth.exception.ResourceNotFoundException;
import com.auth.repository.AddressRepository;
import com.auth.repository.AppUserRepository;
import com.auth.repository.UserPreferenceRepository;
import com.auth.repository.UserProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class UserProfileServiceImpl implements UserProfileService {

    private final AppUserRepository appUserRepository;
    private final UserProfileRepository userProfileRepository;
    private final AddressRepository addressRepository;
    private final UserPreferenceRepository userPreferenceRepository;

    public UserProfileServiceImpl(AppUserRepository appUserRepository,
                                  UserProfileRepository userProfileRepository,
                                  AddressRepository addressRepository,
                                  UserPreferenceRepository userPreferenceRepository) {
        this.appUserRepository = appUserRepository;
        this.userProfileRepository = userProfileRepository;
        this.addressRepository = addressRepository;
        this.userPreferenceRepository = userPreferenceRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfile getUserProfile(Long userId) {
        return userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found for user ID: " + userId));
    }

    @Override
    @Transactional
    public UserProfile updateUserProfile(Long userId, ProfileUpdateRequest request) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
            appUserRepository.save(user);
        }

        UserProfile profile = getUserProfile(userId);

        if (request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank()) {
            String newPhone = request.getPhoneNumber().trim();
            if (!newPhone.equals(profile.getPhoneNumber())) {
                boolean phoneExists = userProfileRepository.existsByPhoneNumber(newPhone);
                if (!phoneExists) {
                    profile.setPhoneNumber(newPhone);
                }
            }
        }
        if (request.getDateOfBirth() != null && !request.getDateOfBirth().isBlank()) {
            profile.setDateOfBirth(LocalDate.parse(request.getDateOfBirth()));
        }
        if (request.getGender() != null) {
            profile.setGender(Gender.valueOf(request.getGender().toUpperCase()));
        }
        if (request.getProfession() != null && !request.getProfession().isBlank()) {
            try {
                String profStr = request.getProfession().toUpperCase().replace(" ", "_");
                profile.setProfession(Profession.valueOf(profStr));
            } catch (Exception e) {
                profile.setProfession(Profession.OTHER);
            }
        }
        if (request.getProfilePhotoUrl() != null) {
            if (request.getProfilePhotoUrl().isBlank()) {
                profile.setProfilePhotoUrl(null);
            } else {
                profile.setProfilePhotoUrl(request.getProfilePhotoUrl());
            }
        }

        profile.setProfileCompleted(true);
        return userProfileRepository.save(profile);
    }

    @Override
    @Transactional
    public Address getUserAddress(Long userId) {
        UserProfile profile = getUserProfile(userId);
        if (profile.getAddress() == null) {
            Address newAddress = new Address();
            newAddress = addressRepository.save(newAddress);
            profile.setAddress(newAddress);
            userProfileRepository.save(profile);
            return newAddress;
        }
        return profile.getAddress();
    }

    @Override
    @Transactional
    public Address updateUserAddress(Long userId, AddressUpdateRequest request) {
        UserProfile profile = getUserProfile(userId);
        Address address = profile.getAddress();
        if (address == null) {
            address = new Address();
            address = addressRepository.save(address);
            profile.setAddress(address);
        }

        if (request.getDoorNumber() != null) address.setDoorNumber(request.getDoorNumber());
        if (request.getStreet() != null) address.setStreet(request.getStreet());
        if (request.getArea() != null) address.setArea(request.getArea());
        if (request.getLandmark() != null) address.setLandmark(request.getLandmark());
        if (request.getVillage() != null) address.setVillage(request.getVillage());
        if (request.getCity() != null) address.setCity(request.getCity());
        if (request.getDistrict() != null) address.setDistrict(request.getDistrict());
        if (request.getState() != null) address.setState(request.getState());
        if (request.getCountry() != null) address.setCountry(request.getCountry());
        if (request.getPincode() != null) address.setPincode(request.getPincode());

        Address savedAddress = addressRepository.save(address);
        userProfileRepository.save(profile);
        return savedAddress;
    }

    @Override
    @Transactional
    public UserPreference getUserPreferences(Long userId) {
        UserProfile profile = getUserProfile(userId);
        if (profile.getUserPreference() == null) {
            UserPreference newPref = new UserPreference();
            newPref = userPreferenceRepository.save(newPref);
            profile.setUserPreference(newPref);
            userProfileRepository.save(profile);
            return newPref;
        }
        return profile.getUserPreference();
    }

    @Override
    @Transactional
    public UserPreference updateUserPreferences(Long userId, PreferencesUpdateRequest request) {
        UserProfile profile = getUserProfile(userId);
        UserPreference pref = profile.getUserPreference();
        if (pref == null) {
            pref = new UserPreference();
            pref = userPreferenceRepository.save(pref);
            profile.setUserPreference(pref);
        }

        if (request.getPreferredLanguage() != null) {
            pref.setPreferredLanguage(Language.valueOf(request.getPreferredLanguage().toUpperCase()));
        }
        if (request.getEmailNotifications() != null) pref.setEmailNotifications(request.getEmailNotifications());
        if (request.getSmsNotifications() != null) pref.setSmsNotifications(request.getSmsNotifications());
        if (request.getPushNotifications() != null) pref.setPushNotifications(request.getPushNotifications());
        if (request.getDarkMode() != null) pref.setDarkMode(request.getDarkMode());

        UserPreference savedPref = userPreferenceRepository.save(pref);
        userProfileRepository.save(profile);
        return savedPref;
    }
}
