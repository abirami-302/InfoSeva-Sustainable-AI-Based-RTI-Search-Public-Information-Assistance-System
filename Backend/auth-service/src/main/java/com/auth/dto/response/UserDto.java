package com.auth.dto.response;

public class UserDto {

    private Long id;
    private String name;
    private String email;
    private String role;
    private String status;
    private boolean profileCompleted;
    private String authProvider;
    private String profession;
    private String profilePhotoUrl;
    private String phoneNumber;
    private String state;
    private String city;

    public UserDto() {
    }

    public UserDto(Long id, String name, String email, String role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.status = "ACTIVE";
        this.profileCompleted = false;
        this.authProvider = "LOCAL";
    }

    public UserDto(Long id, String name, String email, String role, String status, boolean profileCompleted, String authProvider) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.status = status;
        this.profileCompleted = profileCompleted;
        this.authProvider = authProvider;
    }

    public UserDto(Long id, String name, String email, String role, String status, boolean profileCompleted, String authProvider, String profession, String profilePhotoUrl) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.status = status;
        this.profileCompleted = profileCompleted;
        this.authProvider = authProvider;
        this.profession = profession;
        this.profilePhotoUrl = profilePhotoUrl;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isProfileCompleted() {
        return profileCompleted;
    }

    public void setProfileCompleted(boolean profileCompleted) {
        this.profileCompleted = profileCompleted;
    }

    public String getAuthProvider() {
        return authProvider;
    }

    public void setAuthProvider(String authProvider) {
        this.authProvider = authProvider;
    }

    public String getProfession() {
        return profession;
    }

    public void setProfession(String profession) {
        this.profession = profession;
    }

    public String getProfilePhotoUrl() {
        return profilePhotoUrl;
    }

    public void setProfilePhotoUrl(String profilePhotoUrl) {
        this.profilePhotoUrl = profilePhotoUrl;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }
}
