package com.auth.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class AddressUpdateRequest {

    @Size(max = 50, message = "Door number cannot exceed 50 characters")
    private String doorNumber;

    @Size(max = 150, message = "Street cannot exceed 150 characters")
    private String street;

    @Size(max = 150, message = "Area cannot exceed 150 characters")
    private String area;

    @Size(max = 150, message = "Landmark cannot exceed 150 characters")
    private String landmark;

    @Size(max = 100, message = "Village cannot exceed 100 characters")
    private String village;

    @Size(max = 100, message = "City cannot exceed 100 characters")
    private String city;

    @Size(max = 100, message = "District cannot exceed 100 characters")
    private String district;

    @Size(max = 100, message = "State cannot exceed 100 characters")
    private String state;

    @Size(max = 100, message = "Country cannot exceed 100 characters")
    private String country;

    @Pattern(regexp = "^[0-9]{6}$", message = "Pincode must be exactly 6 digits")
    private String pincode;

    public AddressUpdateRequest() {
    }

    public String getDoorNumber() {
        return doorNumber;
    }

    public void setDoorNumber(String doorNumber) {
        this.doorNumber = doorNumber;
    }

    public String getStreet() {
        return street;
    }

    public void setStreet(String street) {
        this.street = street;
    }

    public String getArea() {
        return area;
    }

    public void setArea(String area) {
        this.area = area;
    }

    public String getLandmark() {
        return landmark;
    }

    public void setLandmark(String landmark) {
        this.landmark = landmark;
    }

    public String getVillage() {
        return village;
    }

    public void setVillage(String village) {
        this.village = village;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getPincode() {
        return pincode;
    }

    public void setPincode(String pincode) {
        this.pincode = pincode;
    }
}
