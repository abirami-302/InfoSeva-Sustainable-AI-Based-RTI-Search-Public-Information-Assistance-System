/**
 * adminService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Backend-ready API stubs for the Admin module.
 * Structured so that switching from fallback to real Spring Boot endpoints
 * requires ONLY changing the BASE_URL and removing the try/catch fallback blocks.
 *
 * Spring Boot base URL — set via .env:
 *   REACT_APP_API_URL=http://localhost:8080/api
 *
 * All functions follow the contract:
 *   { data, error, loading } — callers handle error/loading states.
 */

import axios from 'axios';

const AUTH_BASE = 'http://localhost:8081/api';
const INFOSEVA_BASE = 'http://localhost:8082/api';

function getAuthToken() {
  return localStorage.getItem('infoseva_access_token') || sessionStorage.getItem('jwt_token');
}

function getHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Helpers ────────────────────────────────────────────────────────────────
async function safeGet(url, fallback) {
  try {
    const res = await axios.get(`${INFOSEVA_BASE}${url}`, { headers: getHeaders() });
    return { data: res.data?.data || res.data, error: null };
  } catch {
    return { data: fallback, error: null, isFallback: true };
  }
}

async function safePut(url, payload) {
  try {
    const res = await axios.put(`${INFOSEVA_BASE}${url}`, payload, { headers: getHeaders() });
    return { data: res.data?.data || res.data, error: null };
  } catch (err) {
    return { data: null, error: err?.response?.data?.message || 'Request failed' };
  }
}

async function safePost(url, payload) {
  try {
    const res = await axios.post(`${INFOSEVA_BASE}${url}`, payload, { headers: getHeaders() });
    return { data: res.data?.data || res.data, error: null };
  } catch (err) {
    return { data: null, error: err?.response?.data?.message || 'Request failed' };
  }
}

// ─── Real Backend Integrations ──────────────────────────────────────────────

/**
 * Fetches all users by querying the auth service
 */
export async function fetchUsersByRole(roleName) {
  try {
    const res = await axios.get(`${AUTH_BASE}/users/role/${roleName}`, { headers: getHeaders() });
    return { data: res.data || [], error: null };
  } catch (err) {
    return { data: [], error: err?.response?.data?.message || 'Failed to fetch users' };
  }
}

export async function fetchAdminUsers(params = {}) {
  try {
    const res = await axios.get(`${AUTH_BASE}/users/admin/list`, {
      params,
      headers: getHeaders()
    });
    return { data: res.data?.data || null, error: null };
  } catch (err) {
    return { data: null, error: err?.response?.data?.message || 'Failed to fetch admin users' };
  }
}

export async function fetchUserStats() {
  try {
    const res = await axios.get(`${AUTH_BASE}/users/admin/stats`, { headers: getHeaders() });
    return { data: res.data?.data || null, error: null };
  } catch (err) {
    return { data: null, error: err?.response?.data?.message || 'Failed to fetch user stats' };
  }
}

export async function deleteAdminUser(userId) {
  try {
    const res = await axios.delete(`${AUTH_BASE}/users/admin/${userId}`, { headers: getHeaders() });
    return { data: res.data?.data || null, error: null };
  } catch (err) {
    return { data: null, error: err?.response?.data?.message || 'Failed to delete user' };
  }
}

export async function fetchAdminUserById(userId) {
  try {
    const res = await axios.get(`${AUTH_BASE}/users/admin/${userId}`, { headers: getHeaders() });
    return { data: res.data?.data || null, error: null };
  } catch (err) {
    return { data: null, error: err?.response?.data?.message || 'Failed to fetch user details' };
  }
}

export async function updateAdminUser(userId, payload) {
  try {
    const res = await axios.put(`${AUTH_BASE}/users/admin/${userId}`, payload, { headers: getHeaders() });
    return { data: res.data?.data || null, error: null };
  } catch (err) {
    return { data: null, error: err?.response?.data?.message || 'Failed to update user profile' };
  }
}

export async function toggleUserStatus(userId) {
  try {
    const res = await axios.patch(`${AUTH_BASE}/users/admin/${userId}/status`, {}, { headers: getHeaders() });
    return { data: res.data?.data || null, error: null };
  } catch (err) {
    try {
      const res = await axios.put(`${AUTH_BASE}/users/admin/${userId}/status`, {}, { headers: getHeaders() });
      return { data: res.data?.data || null, error: null };
    } catch (fallbackErr) {
      return { data: null, error: fallbackErr?.response?.data?.message || err?.response?.data?.message || 'Failed to update user status' };
    }
  }
}

export async function toggleDataManagerRole(userId) {
  try {
    const res = await axios.patch(`${AUTH_BASE}/users/admin/${userId}/toggle-data-manager`, {}, { headers: getHeaders() });
    return { data: res.data?.data || null, error: null };
  } catch (err) {
    try {
      const res = await axios.put(`${AUTH_BASE}/users/admin/${userId}/toggle-data-manager`, {}, { headers: getHeaders() });
      return { data: res.data?.data || null, error: null };
    } catch (fallbackErr) {
      return { data: null, error: fallbackErr?.response?.data?.message || err?.response?.data?.message || 'Failed to update user role' };
    }
  }
}

export async function fetchAllUsers() {
  try {
    const headers = getHeaders();
    // Fetch registered users and real platform audit/activity logs in parallel
    const [usersRes, activityRes] = await Promise.allSettled([
      fetchAdminUsers({ page: 0, size: 100 }),
      axios.get(`${AUTH_BASE}/users/admin/activity-logs`, { headers })
    ]);

    const users = (usersRes.status === 'fulfilled' && usersRes.value?.data?.content) ? usersRes.value.data.content : [];
    const activities = (activityRes.status === 'fulfilled' && activityRes.value?.data?.data) ? activityRes.value.data.data : [];

    // Aggregate real activity/searches per user email
    const actMap = {};
    const lastActiveMap = {};
    activities.forEach(a => {
      const em = (a.userEmail || '').toLowerCase();
      if (!em) return;
      actMap[em] = (actMap[em] || 0) + 1;
      const t = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      if (!lastActiveMap[em] || t > lastActiveMap[em]) {
        lastActiveMap[em] = t;
      }
    });

    // Attach real dynamic activity metrics
    const enrichedUsers = users.map(u => {
      const emailKey = (u.email || '').toLowerCase();
      const activityCount = actMap[emailKey] || 0;
      const lastActive = lastActiveMap[emailKey] || (u.joined ? new Date(u.joined).getTime() : 0);
      return {
        ...u,
        searches: activityCount,
        activityCount,
        lastActive
      };
    });

    // Sort: Users with real activity first, then by joined date descending
    enrichedUsers.sort((a, b) => {
      if ((b.activityCount || 0) !== (a.activityCount || 0)) {
        return (b.activityCount || 0) - (a.activityCount || 0);
      }
      return new Date(b.joined || 0) - new Date(a.joined || 0);
    });

    return { data: enrichedUsers, error: null };
  } catch (err) {
    return { data: [], error: 'Failed to fetch platform users' };
  }
}

// ─── Platform Config ─────────────────────────────────────────────────────────

export async function fetchPlatformConfig() {
  return {
    data: {
      platformName: 'InfoSeva',
      platformLogo: null,
      contactEmail: 'support@infoseva.gov.in',
      supportPhone: '1800-11-4567',
    },
    error: null,
  };
}

export async function updatePlatformConfig(config) {
  return { data: config, error: null };
}

// ─── Real Dashboard Stats ───────────────────────────────────────────────────

export async function fetchDashboardStats() {
  try {
    const headers = getHeaders();

    // Fetch real metrics from auth-service and infoseva-service
    const [authSummaryRes, adminUsersRes, userStatsRes, docsRes, reviewQueueRes, rtiRes, schemesRes, summaryRes] = await Promise.all([
      axios.get(`${AUTH_BASE}/users/admin/dashboard-summary`, { headers }).catch(() => ({ data: { data: null } })),
      axios.get(`${AUTH_BASE}/users/admin/list?page=0&size=500`, { headers }).catch(() => ({ data: { data: null } })),
      axios.get(`${AUTH_BASE}/users/admin/stats`, { headers }).catch(() => ({ data: { data: null } })),
      axios.get(`${INFOSEVA_BASE}/documents`, { headers }).catch(() => ({ data: { data: [] } })),
      axios.get(`${INFOSEVA_BASE}/documents/review-queue?page=0&size=100`, { headers }).catch(() => ({ data: { data: { content: [] } } })),
      axios.get(`${INFOSEVA_BASE}/rti`, { headers }).catch(() => ({ data: { data: [] } })),
      axios.get(`${INFOSEVA_BASE}/schemes`, { headers }).catch(() => ({ data: { data: [] } })),
      axios.get(`${INFOSEVA_BASE}/dashboard/summary`, { headers }).catch(() => ({ data: { data: {} } })),
    ]);

    const authStats = authSummaryRes.data?.data;
    const usersList = adminUsersRes.data?.data?.content || [];
    const statsObj = userStatsRes.data?.data;

    const docList = Array.isArray(docsRes.data?.data) ? docsRes.data.data : (Array.isArray(docsRes.data) ? docsRes.data : []);
    const rtiList = Array.isArray(rtiRes.data?.data) ? rtiRes.data.data : (Array.isArray(rtiRes.data) ? rtiRes.data : []);
    const schemeList = Array.isArray(schemesRes.data?.data) ? schemesRes.data.data : (Array.isArray(schemesRes.data) ? schemesRes.data : []);

    // Derive genuine counts from either dashboard-summary, stats, or direct users list
    let totalUsers = authStats?.totalUsers ?? statsObj?.totalUsers ?? usersList.length;
    let citizens = authStats?.citizens ?? usersList.filter(u => u.role === 'ROLE_CITIZEN' || u.role === 'Citizen').length;
    let dataManagers = authStats?.dataManagers ?? usersList.filter(u => u.role === 'ROLE_DATA_MANAGER' || u.role === 'Data Manager').length;
    let admins = authStats?.admins ?? usersList.filter(u => u.role === 'ROLE_ADMIN' || u.role === 'Admin').length;
    let activeUsers = authStats?.activeUsers ?? statsObj?.activeUsers ?? usersList.filter(u => u.status === 'Active').length;
    let suspendedUsers = authStats?.suspendedUsers ?? statsObj?.suspendedUsers ?? usersList.filter(u => u.status === 'Suspended').length;
    let pendingUsers = authStats?.pendingUsers ?? statsObj?.pendingUsers ?? usersList.filter(u => u.status === 'Pending').length;
    let pendingApproval = authStats?.pendingDataManagers ?? usersList.filter(u => (u.role === 'ROLE_DATA_MANAGER' || u.role === 'Data Manager') && u.status === 'Pending').length;

    // Monthly registrations derived from actual usersList
    let monthlyRegistrations = authStats?.userRegistrationsByMonth || [];
    if (!monthlyRegistrations.length && usersList.length) {
      const monthMap = {};
      usersList.forEach(u => {
        const d = u.joined ? new Date(u.joined) : new Date();
        const mKey = !isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Aug 2026';
        monthMap[mKey] = (monthMap[mKey] || 0) + 1;
      });
      monthlyRegistrations = Object.entries(monthMap).map(([month, count]) => ({ month, count }));
    }

    const reviewQueueItems = reviewQueueRes.data?.data?.content || [];
    const pendingReviewDocs = reviewQueueItems.length || docList.filter(d => d.reviewStatus === 'PENDING_REVIEW' || d.status === 'PENDING').length;

    return {
      data: {
        totalUsers,
        citizens,
        dataManagers,
        admins,
        activeUsers,
        suspendedUsers,
        pendingUsers,
        pendingApproval,
        rtisIndexed: rtiList.length,
        documentsUploaded: docList.length,
        apiRequestsToday: 0,
        activeSessions: 1,
        searchesToday: 0,
        weeklyGrowth: null,
        monthlyGrowth: null,
        pendingReview: pendingReviewDocs,
        rawDocs: docList,
        rawRti: rtiList,
        rawSchemes: schemeList,
        userRegistrationsByMonth: monthlyRegistrations,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: 'Failed to load real dashboard stats from backend',
    };
  }
}

export async function fetchGrowthData() {
  try {
    const { data } = await fetchDashboardStats();
    if (data?.userRegistrationsByMonth && data.userRegistrationsByMonth.length) {
      return {
        data: data.userRegistrationsByMonth.map(m => ({
          month: m.month,
          users: m.count,
          searches: 0
        })),
        error: null,
      };
    }
    return { data: [], error: null };
  } catch {
    return { data: [], error: null };
  }
}

export async function fetchFeatureUsage() {
  try {
    const headers = getHeaders();
    const [docsRes, rtiRes, schemesRes] = await Promise.all([
      axios.get(`${INFOSEVA_BASE}/documents`, { headers }).catch(() => ({ data: { data: [] } })),
      axios.get(`${INFOSEVA_BASE}/rti`, { headers }).catch(() => ({ data: { data: [] } })),
      axios.get(`${INFOSEVA_BASE}/schemes`, { headers }).catch(() => ({ data: { data: [] } })),
    ]);

    const docCount = (docsRes.data?.data || docsRes.data || []).length;
    const rtiCount = (rtiRes.data?.data || rtiRes.data || []).length;
    const schemeCount = (schemesRes.data?.data || schemesRes.data || []).length;

    return {
      data: [
        { name: 'Documents', count: docCount },
        { name: 'RTI', count: rtiCount },
        { name: 'Schemes', count: schemeCount },
        { name: 'Search', count: 0 },
      ],
      error: null,
    };
  } catch {
    return {
      data: [
        { name: 'Documents', count: 0 },
        { name: 'RTI', count: 0 },
        { name: 'Schemes', count: 0 },
        { name: 'Search', count: 0 },
      ],
      error: null,
    };
  }
}

// ─── System Monitoring ───────────────────────────────────────────────────────

/**
 * Fetches live health status for all services.
 * Backend: GET /api/admin/monitoring/health
 * Spring Boot: MonitoringController.getSystemHealth()
 *
 * Expected response structure:
 * {
 *   services: [{ name, status, uptime, latency, lastChecked, responseTime }],
 *   system: { cpuUsage, memoryUsage, storageUsage, uptime, jvmHeap }
 * }
 *
 * WebSocket alternative (when WS_ENABLED=true):
 *   ws://localhost:8080/ws/admin/monitoring
 *   Emit: PING, Receive: HEALTH_UPDATE event
 */
export async function fetchMonitoringHealth() {
  return safeGet('/admin/monitoring/health', {
    services: [
      { id: 's1', name: 'Spring Boot App Server',   status: 'Operational', uptime: 99.98, latency: 142,  lastChecked: new Date().toISOString(), category: 'application' },
      { id: 's2', name: 'RTI Gateway (External)',   status: 'Degraded',     uptime: 98.7,  latency: 4200, lastChecked: new Date().toISOString(), category: 'external' },
      { id: 's3', name: 'Spring Security / Auth',   status: 'Operational', uptime: 99.99, latency: 88,   lastChecked: new Date().toISOString(), category: 'application' },
      { id: 's4', name: 'OCR Engine',               status: 'Operational', uptime: 99.4,  latency: 310,  lastChecked: new Date().toISOString(), category: 'ai' },
      { id: 's5', name: 'AI / ChromaDB Vector Store', status: 'Operational', uptime: 99.1, latency: 260, lastChecked: new Date().toISOString(), category: 'ai' },
      { id: 's6', name: 'MySQL Database',            status: 'Operational', uptime: 99.99, latency: 12,   lastChecked: new Date().toISOString(), category: 'database' },
      { id: 's7', name: 'Redis Cache',               status: 'Operational', uptime: 99.6,  latency: 5,    lastChecked: new Date().toISOString(), category: 'infrastructure' },
      { id: 's8', name: 'Email Service (SMTP)',      status: 'Operational', uptime: 98.9,  latency: 820,  lastChecked: new Date().toISOString(), category: 'infrastructure' },
      { id: 's9', name: 'data.gov.in Sync',          status: 'Operational', uptime: 97.8,  latency: 900,  lastChecked: new Date().toISOString(), category: 'external' },
    ],
    system: {
      cpuUsage: 34,
      memoryUsage: 61,
      storageUsage: 37,
      uptimeSeconds: 1209600,
      jvmHeapUsedMB: 512,
      jvmHeapMaxMB: 1024,
    },
  });
}

// ─── Settings / Maintenance ──────────────────────────────────────────────────

/**
 * Fetches current platform settings.
 * Backend: GET /api/admin/settings
 */
export async function fetchPlatformSettings() {
  return safeGet('/admin/settings', {
    contactEmail: 'support@infoseva.gov.in',
    supportPhone: '1800-11-4567',
    twoFactorAuth: true,
    sessionTimeoutMins: 30,
    ipWhitelistEnabled: false,
    passwordMinLength: 12,
    autoSyncIntervalHrs: 6,
    ocrEngine: 'Tesseract v5',
    aiModelProvider: 'Claude Sonnet 5',
    storageLimitGB: 500,
    maintenance: {
      enabled: false,
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      reason: 'Scheduled Maintenance',
      message: 'The platform is currently undergoing scheduled maintenance. We will be back shortly.',
      affectedRoles: ['Citizen', 'Guest'],
      isEmergency: false,
    },
  });
}

/**
 * Saves all platform settings.
 * Backend: PUT /api/admin/settings
 */
export async function savePlatformSettings(settings) {
  return safePut('/admin/settings', settings);
}

/**
 * Creates a new Data Manager account.
 * Backend: POST /api/admin/data-managers
 * Spring Security: creates account with ROLE_DATA_MANAGER, sets forcePasswordChange=true
 */
export async function createDataManager(payload) {
  return safePost('/admin/data-managers', payload);
}

/**
 * Updates an existing Data Manager account.
 * Backend: PUT /api/admin/data-managers/{id}
 */
export async function updateDataManager(id, payload) {
  return safePut(`/admin/data-managers/${id}`, payload);
}
