/**
 * AdminContext.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Global admin state provider.
 *
 * PLATFORM NAME SOURCE OF TRUTH:
 *   The platform name is fetched from the backend at application initialization
 *   via GET /api/admin/config/platform. It is stored in this context for the
 *   current session ONLY. When the backend is connected, it becomes the sole
 *   source of truth. A temporary fallback ('InfoSeva') is used only when the
 *   backend is unreachable (isFallback: true).
 *
 * MAINTENANCE MODE:
 *   Config is fetched from backend. When enabled, `maintenanceConfig.enabled`
 *   is true — consumers (UserLayout) show the full-screen maintenance page.
 *   Admins bypass maintenance mode via their role (user.role === 'admin').
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  fetchPlatformConfig,
  fetchDashboardStats,
  fetchGrowthData,
  fetchFeatureUsage,
  fetchPlatformSettings,
  updatePlatformConfig,
  savePlatformSettings,
} from '../services/adminService';

const AdminContext = createContext(null);
export const useAdmin = () => useContext(AdminContext);

// ─── Default maintenance config shape ────────────────────────────────────────
const defaultMaintenance = {
  enabled: false,
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  reason: 'Scheduled Maintenance',
  message: 'The platform is currently undergoing scheduled maintenance. We will be back shortly.',
  affectedRoles: ['Citizen', 'Guest'],
  isEmergency: false,
};

export function AdminProvider({ children }) {
  // ── Platform Config ──────────────────────────────────────────────────────
  const [platformName, setPlatformName] = useState('InfoSeva');
  const [platformConfig, setPlatformConfig] = useState(null);
  const [platformConfigLoading, setPlatformConfigLoading] = useState(true);

  // ── Maintenance ──────────────────────────────────────────────────────────
  const [maintenanceConfig, setMaintenanceConfig] = useState(defaultMaintenance);

  // ── Dashboard Stats ──────────────────────────────────────────────────────
  const [dashboardStats, setDashboardStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);
  const [statsLastRefreshed, setStatsLastRefreshed] = useState(null);

  // ── Chart Data ───────────────────────────────────────────────────────────
  const [growthData, setGrowthData] = useState([]);
  const [featureUsageData, setFeatureUsageData] = useState([]);

  // ── Platform Settings ────────────────────────────────────────────────────
  const [platformSettings, setPlatformSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // INIT: Fetch platform config once when provider mounts.
  // This is the only call that sets platformName — no localStorage involved.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setPlatformConfigLoading(true);
    fetchPlatformConfig().then(({ data }) => {
      if (cancelled) return;
      if (data) {
        setPlatformName(data.platformName || 'InfoSeva');
        setPlatformConfig(data);
      }
      setPlatformConfigLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Dashboard Stats refresh
  // ─────────────────────────────────────────────────────────────────────────
  const refreshDashboardStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    const [statsRes, growthRes, featureRes] = await Promise.all([
      fetchDashboardStats(),
      fetchGrowthData(),
      fetchFeatureUsage(),
    ]);
    setStatsLoading(false);

    if (statsRes.error) {
      setStatsError(statsRes.error);
    } else {
      setDashboardStats(statsRes.data);
      setStatsLastRefreshed(new Date());
    }
    if (!growthRes.error) setGrowthData(growthRes.data);
    if (!featureRes.error) setFeatureUsageData(featureRes.data);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Platform Settings fetch
  // ─────────────────────────────────────────────────────────────────────────
  const loadPlatformSettings = useCallback(async () => {
    setSettingsLoading(true);
    const { data } = await fetchPlatformSettings();
    setSettingsLoading(false);
    if (data) {
      setPlatformSettings(data);
      if (data.maintenance) setMaintenanceConfig(data.maintenance);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Save Platform Name — backend is the source of truth
  // ─────────────────────────────────────────────────────────────────────────
  const savePlatformName = useCallback(async (newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return { error: 'Platform name cannot be empty' };
    const { data, error } = await updatePlatformConfig({ ...platformConfig, platformName: trimmed });
    if (!error) {
      setPlatformName(trimmed);
      setPlatformConfig(prev => ({ ...prev, platformName: trimmed }));
    }
    return { data, error };
  }, [platformConfig]);

  // ─────────────────────────────────────────────────────────────────────────
  // Save full settings (including maintenance)
  // ─────────────────────────────────────────────────────────────────────────
  const saveSettings = useCallback(async (settings) => {
    const { data, error } = await savePlatformSettings(settings);
    if (!error) {
      setPlatformSettings(settings);
      if (settings.maintenance) setMaintenanceConfig(settings.maintenance);
    }
    return { data, error };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Update browser <title> whenever platformName changes
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    document.title = platformName + ' — Admin Portal';
  }, [platformName]);

  const value = {
    // Platform
    platformName,
    platformConfig,
    platformConfigLoading,
    savePlatformName,

    // Maintenance
    maintenanceConfig,
    setMaintenanceConfig,

    // Dashboard
    dashboardStats,
    statsLoading,
    statsError,
    statsLastRefreshed,
    refreshDashboardStats,
    growthData,
    featureUsageData,

    // Settings
    platformSettings,
    settingsLoading,
    loadPlatformSettings,
    saveSettings,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}
