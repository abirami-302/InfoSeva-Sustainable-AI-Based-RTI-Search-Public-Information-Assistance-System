package com.infoseva.entity;

public enum SourceType {
    GOVERNMENT_VERIFIED,
    COMMUNITY_SOURCED,
    UNCLASSIFIED;

    public static boolean isValid(String value) {
        if (value == null) return false;
        for (SourceType st : values()) {
            if (st.name().equalsIgnoreCase(value.trim())) {
                return true;
            }
        }
        return false;
    }

    public static SourceType fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return UNCLASSIFIED;
        }
        for (SourceType st : values()) {
            if (st.name().equalsIgnoreCase(value.trim())) {
                return st;
            }
        }
        throw new IllegalArgumentException("Invalid source type: " + value);
    }
}
