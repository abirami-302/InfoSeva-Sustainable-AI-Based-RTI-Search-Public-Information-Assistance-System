package com.infoseva.util;

import java.util.*;

public class DomainMappingUtil {

    private static final Map<String, List<String>> PROFESSION_KEYWORDS = new HashMap<>();

    static {
        // Student / Academics
        PROFESSION_KEYWORDS.put("STUDENT", Arrays.asList("educat", "scholar", "fellowship", "student", "college", "school", "university", "exam", "internship", "stipend", "skill", "training"));
        PROFESSION_KEYWORDS.put("TEACHER", Arrays.asList("educat", "scholar", "teacher", "faculty", "school", "university", "academic", "pedagogy"));
        PROFESSION_KEYWORDS.put("RESEARCHER", Arrays.asList("research", "fellowship", "phd", "grant", "innovation", "science", "technology", "scholar"));

        // Agriculture / Farmers
        PROFESSION_KEYWORDS.put("FARMER", Arrays.asList("agri", "kisan", "farmer", "crop", "soil", "fertilizer", "irrigation", "tractor", "seed", "horticulture", "pmkisan", "pmfby", "solar pump"));

        // Health / Medical
        PROFESSION_KEYWORDS.put("DOCTOR", Arrays.asList("health", "medic", "hospital", "ayushman", "pharma", "doctor", "nurse", "clinic", "treatment"));

        // Law / Legal
        PROFESSION_KEYWORDS.put("LAWYER", Arrays.asList("law", "act", "rule", "court", "justice", "legal", "advocate", "circular", "gazette", "judiciary"));

        // Business / Trade
        PROFESSION_KEYWORDS.put("BUSINESS_OWNER", Arrays.asList("business", "msme", "commerce", "startup", "trade", "tax", "gst", "subsidy", "industry", "loan", "mudra", "credit"));
        PROFESSION_KEYWORDS.put("SELF_EMPLOYED", Arrays.asList("self employed", "msme", "micro", "skill", "loan", "subsidy", "mudra", "venture", "business"));

        // Employees
        PROFESSION_KEYWORDS.put("GOVERNMENT_EMPLOYEE", Arrays.asList("service", "pension", "pf", "allowance", "order", "circular", "rules", "welfare", "conduct"));
        PROFESSION_KEYWORDS.put("PRIVATE_EMPLOYEE", Arrays.asList("employment", "labour", "pf", "epfo", "esi", "pension", "tax", "career", "skill"));

        // Citizen Welfare / Others
        PROFESSION_KEYWORDS.put("HOMEMAKER", Arrays.asList("ration", "gas", "ujjwala", "housing", "pmay", "maternity", "women", "nutrition", "family"));
        PROFESSION_KEYWORDS.put("RETIRED", Arrays.asList("pension", "senior citizen", "health", "ayushman", "welfare", "provident"));
        PROFESSION_KEYWORDS.put("UNEMPLOYED", Arrays.asList("employment", "skill", "job", "recruitment", "training", "stipend", "assistance"));
    }

    /**
     * Checks whether a document matches a user's profession.
     */
    public static boolean matchesProfession(String profession, String category, String department, String title) {
        if (profession == null || profession.isBlank()) {
            return false;
        }
        String profUpper = profession.toUpperCase().replace(" ", "_");
        List<String> keywords = PROFESSION_KEYWORDS.get(profUpper);
        if (keywords == null) {
            return false;
        }

        String searchScope = ((category != null ? category : "") + " "
                + (department != null ? department : "") + " "
                + (title != null ? title : "")).toLowerCase();

        for (String kw : keywords) {
            if (searchScope.contains(kw)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks if a document category / title matches any user search query.
     */
    public static boolean matchesSearchQueries(List<String> userSearches, String category, String department, String title) {
        if (userSearches == null || userSearches.isEmpty()) {
            return false;
        }
        String docText = ((category != null ? category : "") + " "
                + (department != null ? department : "") + " "
                + (title != null ? title : "")).toLowerCase();

        for (String query : userSearches) {
            if (query == null || query.isBlank()) continue;
            String q = query.trim().toLowerCase();
            // Direct query substring or word matching
            if (docText.contains(q)) {
                return true;
            }
            for (String word : q.split("\\s+")) {
                if (word.length() >= 4 && docText.contains(word)) {
                    return true;
                }
            }

            // Domain matching: if search query and document belong to the same interest domain
            for (Map.Entry<String, List<String>> entry : PROFESSION_KEYWORDS.entrySet()) {
                boolean queryMatchesDomain = entry.getValue().stream().anyMatch(q::contains);
                if (queryMatchesDomain) {
                    boolean docMatchesDomain = entry.getValue().stream().anyMatch(docText::contains);
                    if (docMatchesDomain) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Checks if a document category matches any viewed document categories.
     */
    public static boolean matchesViewedCategories(Set<String> viewedCategories, String category) {
        if (viewedCategories == null || viewedCategories.isEmpty() || category == null) {
            return false;
        }
        String docCat = category.trim().toLowerCase();
        for (String viewed : viewedCategories) {
            if (viewed != null && (docCat.contains(viewed.toLowerCase()) || viewed.toLowerCase().contains(docCat))) {
                return true;
            }
        }
        return false;
    }
}
