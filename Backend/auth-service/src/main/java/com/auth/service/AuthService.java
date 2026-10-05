package com.auth.service;

import com.auth.dto.LoginRequest;
import com.auth.dto.RegisterRequest;
import com.auth.dto.request.LogoutRequest;
import com.auth.dto.response.AuthResponseData;
import com.auth.dto.response.UserDto;

public interface AuthService {

    UserDto register(RegisterRequest request);

    AuthResponseData login(LoginRequest request);

    AuthResponseData loginWithGoogle(String email, String googleIdToken, String name);

    void logout(LogoutRequest request);

    java.util.List<com.auth.dto.response.TestUserDto> getTestUsers();
}
