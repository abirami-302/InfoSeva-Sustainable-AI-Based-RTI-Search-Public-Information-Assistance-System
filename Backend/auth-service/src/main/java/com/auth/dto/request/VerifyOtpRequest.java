package com.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class VerifyOtpRequest {

    @NotBlank(message = "Target (email or phone) is required")
    private String target;

    @NotBlank(message = "OTP code is required")
    @Size(min = 6, max = 6, message = "OTP code must be exactly 6 digits")
    private String otpCode;

    @NotBlank(message = "Verification type is required")
    @Pattern(regexp = "^(EMAIL|PHONE|EMAIL_VERIFICATION|PHONE_VERIFICATION|FORGOT_PASSWORD|PASSWORD_RESET)$", message = "Type must be EMAIL, PHONE, FORGOT_PASSWORD or PASSWORD_RESET")
    private String type;

    public VerifyOtpRequest() {
    }

    public VerifyOtpRequest(String target, String otpCode, String type) {
        this.target = target;
        this.otpCode = otpCode;
        this.type = type;
    }

    public String getTarget() {
        return target;
    }

    public void setTarget(String target) {
        this.target = target;
    }

    public String getOtpCode() {
        return otpCode;
    }

    public void setOtpCode(String otpCode) {
        this.otpCode = otpCode;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
