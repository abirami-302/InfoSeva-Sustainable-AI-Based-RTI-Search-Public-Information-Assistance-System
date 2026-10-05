package com.auth.dto.response;

import java.util.List;

public class AdminDashboardDTO {

    private long totalUsers;
    private long citizens;
    private long dataManagers;
    private long admins;
    private long activeUsers;
    private long suspendedUsers;
    private long pendingUsers;
    private long pendingDataManagers;

    private List<MonthlyCountDTO> userRegistrationsByMonth;

    public AdminDashboardDTO() {
    }

    public AdminDashboardDTO(long totalUsers, long citizens, long dataManagers, long admins,
                             long activeUsers, long suspendedUsers, long pendingUsers,
                             long pendingDataManagers, List<MonthlyCountDTO> userRegistrationsByMonth) {
        this.totalUsers = totalUsers;
        this.citizens = citizens;
        this.dataManagers = dataManagers;
        this.admins = admins;
        this.activeUsers = activeUsers;
        this.suspendedUsers = suspendedUsers;
        this.pendingUsers = pendingUsers;
        this.pendingDataManagers = pendingDataManagers;
        this.userRegistrationsByMonth = userRegistrationsByMonth;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getCitizens() {
        return citizens;
    }

    public void setCitizens(long citizens) {
        this.citizens = citizens;
    }

    public long getDataManagers() {
        return dataManagers;
    }

    public void setDataManagers(long dataManagers) {
        this.dataManagers = dataManagers;
    }

    public long getAdmins() {
        return admins;
    }

    public void setAdmins(long admins) {
        this.admins = admins;
    }

    public long getActiveUsers() {
        return activeUsers;
    }

    public void setActiveUsers(long activeUsers) {
        this.activeUsers = activeUsers;
    }

    public long getSuspendedUsers() {
        return suspendedUsers;
    }

    public void setSuspendedUsers(long suspendedUsers) {
        this.suspendedUsers = suspendedUsers;
    }

    public long getPendingUsers() {
        return pendingUsers;
    }

    public void setPendingUsers(long pendingUsers) {
        this.pendingUsers = pendingUsers;
    }

    public long getPendingDataManagers() {
        return pendingDataManagers;
    }

    public void setPendingDataManagers(long pendingDataManagers) {
        this.pendingDataManagers = pendingDataManagers;
    }

    public List<MonthlyCountDTO> getUserRegistrationsByMonth() {
        return userRegistrationsByMonth;
    }

    public void setUserRegistrationsByMonth(List<MonthlyCountDTO> userRegistrationsByMonth) {
        this.userRegistrationsByMonth = userRegistrationsByMonth;
    }

    public static class MonthlyCountDTO {
        private String month;
        private long count;

        public MonthlyCountDTO() {}

        public MonthlyCountDTO(String month, long count) {
            this.month = month;
            this.count = count;
        }

        public String getMonth() {
            return month;
        }

        public void setMonth(String month) {
            this.month = month;
        }

        public long getCount() {
            return count;
        }

        public void setCount(long count) {
            this.count = count;
        }
    }
}
