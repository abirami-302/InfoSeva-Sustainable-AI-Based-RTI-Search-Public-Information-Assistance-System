package com.auth.dto.response;

public class TestUserDto {

    private String email;
    private String password;
    private String name;
    private String role;
    private String label;
    private String profilePhotoUrl;

    public TestUserDto() {
    }

    public TestUserDto(String email, String password, String name, String role, String label, String profilePhotoUrl) {
        this.email = email;
        this.password = password;
        this.name = name;
        this.role = role;
        this.label = label;
        this.profilePhotoUrl = profilePhotoUrl;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getProfilePhotoUrl() {
        return profilePhotoUrl;
    }

    public void setProfilePhotoUrl(String profilePhotoUrl) {
        this.profilePhotoUrl = profilePhotoUrl;
    }
}
