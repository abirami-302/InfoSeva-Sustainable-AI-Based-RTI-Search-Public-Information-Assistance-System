package com.auth.dto.request;

import jakarta.validation.constraints.NotBlank;

public class ForgotPasswordRequest {

    @NotBlank(message = "Target (email or phone) is required")
    private String target;

    public ForgotPasswordRequest() {
    }

    public ForgotPasswordRequest(String target) {
        this.target = target;
    }

    public String getTarget() {
        return target;
    }

    public void setTarget(String target) {
        this.target = target;
    }
}
