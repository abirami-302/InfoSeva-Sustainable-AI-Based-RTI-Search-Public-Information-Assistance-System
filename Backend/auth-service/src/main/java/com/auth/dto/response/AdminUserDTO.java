package com.auth.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class AdminUserDTO {

    private Long id;
    private String name;
    private String email;
    private String role;
    private String status;
    private Boolean accountEnabled;
    private String phone;
    private LocalDate dob;
    private String gender;
    private String profession;
    private String state;
    private String district;
    private String city;
    private String pincode;
    private Boolean profileComplete;
    private LocalDateTime joined;
    private Boolean isProtected;

    public AdminUserDTO() {
    }

    public AdminUserDTO(Long id, String name, String email, String role, String status,
                        Boolean accountEnabled, String phone, LocalDate dob, String gender,
                        String profession, String state, String district, String city,
                        String pincode, Boolean profileComplete, LocalDateTime joined, Boolean isProtected) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.status = status;
        this.accountEnabled = accountEnabled;
        this.phone = phone;
        this.dob = dob;
        this.gender = gender;
        this.profession = profession;
        this.state = state;
        this.district = district;
        this.city = city;
        this.pincode = pincode;
        this.profileComplete = profileComplete;
        this.joined = joined;
        this.isProtected = isProtected;
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

    public Boolean getAccountEnabled() {
        return accountEnabled;
    }

    public void setAccountEnabled(Boolean accountEnabled) {
        this.accountEnabled = accountEnabled;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public LocalDate getDob() {
        return dob;
    }

    public void setDob(LocalDate dob) {
        this.dob = dob;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getProfession() {
        return profession;
    }

    public void setProfession(String profession) {
        this.profession = profession;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getPincode() {
        return pincode;
    }

    public void setPincode(String pincode) {
        this.pincode = pincode;
    }

    public Boolean getProfileComplete() {
        return profileComplete;
    }

    public void setProfileComplete(Boolean profileComplete) {
        this.profileComplete = profileComplete;
    }

    public LocalDateTime getJoined() {
        return joined;
    }

    public void setJoined(LocalDateTime joined) {
        this.joined = joined;
    }

    public Boolean getIsProtected() {
        return isProtected;
    }

    public void setIsProtected(Boolean isProtected) {
        this.isProtected = isProtected;
    }
}
