package com.auth.dto.response;

public class UserStatsDTO {

    private long totalUsers;
    private long activeUsers;
    private long suspendedUsers;
    private long pendingUsers;

    public UserStatsDTO() {
    }

    public UserStatsDTO(long totalUsers, long activeUsers, long suspendedUsers, long pendingUsers) {
        this.totalUsers = totalUsers;
        this.activeUsers = activeUsers;
        this.suspendedUsers = suspendedUsers;
        this.pendingUsers = pendingUsers;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
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
}
