package com.auth.service;

import com.auth.dto.request.AddressUpdateRequest;
import com.auth.dto.request.PreferencesUpdateRequest;
import com.auth.dto.request.ProfileUpdateRequest;
import com.auth.entity.Address;
import com.auth.entity.UserPreference;
import com.auth.entity.UserProfile;

public interface UserProfileService {

    UserProfile getUserProfile(Long userId);

    UserProfile updateUserProfile(Long userId, ProfileUpdateRequest request);

    Address getUserAddress(Long userId);

    Address updateUserAddress(Long userId, AddressUpdateRequest request);

    UserPreference getUserPreferences(Long userId);

    UserPreference updateUserPreferences(Long userId, PreferencesUpdateRequest request);
}
