package com.auth.service;

import com.auth.dto.request.ForgotPasswordRequest;
import com.auth.dto.request.ResetPasswordRequest;
import com.auth.dto.request.SendOtpRequest;
import com.auth.dto.request.VerifyOtpRequest;

public interface OTPService {

    void sendOTP(SendOtpRequest request);

    boolean verifyOTP(VerifyOtpRequest request);

    void forgotPassword(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);
}
