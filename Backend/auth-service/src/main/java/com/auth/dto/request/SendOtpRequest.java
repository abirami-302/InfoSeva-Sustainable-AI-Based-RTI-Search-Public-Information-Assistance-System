package com.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class SendOtpRequest {

    @NotBlank(message = "Target (email or phone) is required")
    private String target;

    @NotBlank(message = "Verification type is required")
    @Pattern(regexp = "^(EMAIL|PHONE|EMAIL_VERIFICATION|PHONE_VERIFICATION|FORGOT_PASSWORD|PASSWORD_RESET)$", message = "Type must be EMAIL, PHONE, FORGOT_PASSWORD or PASSWORD_RESET")
    private String type;

    public SendOtpRequest() {
    }

    public SendOtpRequest(String target, String type) {
        this.target = target;
        this.type = type;
    }

    public String getTarget() {
        return target;
    }

    public void setTarget(String target) {
        this.target = target;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
