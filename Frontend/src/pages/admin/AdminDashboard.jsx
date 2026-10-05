import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users, Activity, Database, TrendingUp,
  UserCog, ScrollText, Settings as SettingsIcon, UserCircle, BarChart3,
  ArrowRight, RefreshCw, HardDrive, Wifi, Calendar, UserCheck, ShieldAlert,
  AlertTriangle, Clock,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { StatCard, Pagination } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { fetchAllUsers } from '../../services/adminService';

const quickLinks = [
  { label: 'User Management', desc: 'Manage citizen accounts', icon: Users, path: '/admin/users', color: 'text-gov-blue bg-gov-blue-50' },
  { label: 'Data Managers', desc: 'Oversee upload activity', icon: UserCog, path: '/admin/data-managers', color: 'text-purple-600 bg-purple-50' },
  { label: 'Platform Analytics', desc: 'Usage & growth trends', icon: BarChart3, path: '/admin/analytics', color: 'text-gov-saffron bg-orange-50' },
  { label: 'Activity Logs', desc: 'Platform event stream', icon: ScrollText, path: '/admin/logs', color: 'text-blue-600 bg-blue-50' },
  { label: 'Profile', desc: 'Your admin account', icon: UserCircle, path: '/admin/profile', color: 'text-red-600 bg-red-50' },
];

// ── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-3 bg-gray-200 rounded w-24 mb-3" />
          <div className="h-7 bg-gray-200 rounded w-16 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}

// ── Stat widget with loading / error / value states ──────────────────────────
function StatWidget({ label, value, trend, icon: Icon, color, loading, error, onRetry }) {
  if (loading) return <SkeletonCard />;
  if (error) {
    return (
      <div className="card p-5 border border-red-100">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{label}</p>
        <div className="flex items-center gap-2 text-red-500 text-xs">
          <ShieldAlert size={14} />
          <span>Failed to load</span>
        </div>
        {onRetry && (
          <button onClick={onRetry} className="mt-2 text-xs text-gov-blue hover:underline flex items-center gap-1">
            <RefreshCw size={11} /> Retry
          </button>
        )}
      </div>
    );
  }
  return <StatCard label={label} value={value ?? '—'} trend={trend} icon={Icon} color={color} />;
}

// ── Format helpers ────────────────────────────────────────────────────────────
function fmtNum(n) { return n == null ? '—' : Number(n).toLocaleString('en-IN'); }
function fmtTrend(n) { return n == null ? 'No historical data' : `+${n}% this month`; }

function formatJoinedDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const {
    dashboardStats, statsLoading, statsError, statsLastRefreshed,
    refreshDashboardStats, growthData,
  } = useAdmin();

  const [recentUsers, setRecentUsers] = useState([]);
  const [userPage, setUserPage] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);

  const doRefresh = useCallback(async () => {
    setRefreshing(true);
    setUsersLoading(true);
    await refreshDashboardStats();
    const { data } = await fetchAllUsers();
    if (data && data.length) {
      setRecentUsers(data);
    }
    setUsersLoading(false);
    setRefreshing(false);
  }, [refreshDashboardStats]);

  // Initial load
  useEffect(() => { doRefresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(doRefresh, 60000);
    return () => clearInterval(id);
  }, [autoRefresh, doRefresh]);

  const s = dashboardStats;
  const loading = statsLoading && !s;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gov-blue-dark font-display">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Platform overview — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {statsLastRefreshed && (
            <p className="text-xs text-gray-400">
              Updated {statsLastRefreshed.toLocaleTimeString()}
            </p>
          )}
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              autoRefresh
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-gray-100 border-gray-200 text-gray-500'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>
          {/* Manual refresh */}
          <button
            onClick={doRefresh}
            disabled={refreshing}
            className="btn-secondary text-sm flex items-center gap-1.5 disabled:opacity-60"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error banner */}
      {statsError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-red-700">
          <AlertTriangle size={16} />
          Failed to load live stats. Showing last known data.
          <button onClick={doRefresh} className="ml-auto text-xs font-semibold underline">Retry</button>
        </div>
      )}

      {/* Quick access */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Quick Access</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickLinks.map((q, i) => (
            <motion.button
              key={q.label}
              onClick={() => navigate(q.path)}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="card p-4 text-left hover:-translate-y-0.5 hover:shadow-md transition-all group"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${q.color}`}>
                <q.icon size={16} />
              </div>
              <p className="text-sm font-semibold text-gray-800 group-hover:text-gov-blue transition-colors">{q.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{q.desc}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Primary stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatWidget label="Total Users" value={fmtNum(s?.totalUsers)} trend={fmtTrend(s?.weeklyGrowth)} icon={Users} color="blue" loading={false} error={statsError} onRetry={doRefresh} />
            <StatWidget label="Active Sessions" value={fmtNum(s?.activeSessions)} trend="Current session" icon={Activity} color="green" loading={false} error={statsError} onRetry={doRefresh} />
            <StatWidget label="Documents Uploaded" value={fmtNum(s?.documentsUploaded)} trend={fmtTrend(null)} icon={Database} color="purple" loading={false} error={statsError} onRetry={doRefresh} />
          </>
        )}
      </div>

      {/* Extended stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Citizens', value: fmtNum(s?.citizens), icon: UserCheck, bg: 'bg-blue-50', text: 'text-blue-600' },
          { label: 'Data Managers', value: fmtNum(s?.dataManagers), icon: UserCog, bg: 'bg-purple-50', text: 'text-purple-600' },
          { label: 'Today\'s Searches', value: fmtNum(s?.searchesToday), icon: BarChart3, bg: 'bg-orange-50', text: 'text-gov-saffron' },
          { label: 'Pending Review', value: fmtNum(s?.pendingReview), icon: Clock, bg: 'bg-yellow-50', text: 'text-yellow-600', path: '/admin/review' },
        ].map(stat => (
          <div
            key={stat.label}
            onClick={stat.path ? () => navigate(stat.path) : undefined}
            className={`card p-4 flex items-center gap-3 ${stat.path ? 'cursor-pointer hover:shadow-md hover:border-yellow-300 transition-all group' : ''}`}
          >
            {loading
              ? <div className="w-full h-8 bg-gray-200 rounded animate-pulse" />
              : <>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${stat.bg} ${stat.text}`}>
                    <stat.icon size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-800 truncate group-hover:text-gov-blue transition-colors">{stat.value}</p>
                    <p className="text-[11px] text-gray-400 truncate">{stat.label}</p>
                  </div>
                  {stat.path && <ArrowRight size={14} className="text-gray-300 group-hover:text-gov-blue transition-colors" />}
                </>
            }
          </div>
        ))}
      </div>

      {/* Growth badge row */}
      {!loading && s && (
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm">
            <TrendingUp size={14} className="text-gray-500" />
            <span className="text-gray-700 font-medium">Weekly Growth: <strong>{s.weeklyGrowth != null ? `+${s.weeklyGrowth}%` : 'No historical data'}</strong></span>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm">
            <Calendar size={14} className="text-gray-500" />
            <span className="text-gray-700 font-medium">Monthly Growth: <strong>{s.monthlyGrowth != null ? `+${s.monthlyGrowth}%` : 'No historical data'}</strong></span>
          </div>
        </div>
      )}

      {/* Platform Growth Chart (Real User Registrations by Date) */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <TrendingUp size={16} className="text-gov-blue" /> Platform Growth (User Registrations by Date)
          </h3>
          <button onClick={() => navigate('/admin/analytics')} className="text-xs text-gov-blue font-medium hover:underline flex items-center gap-1">
            Full analytics <ArrowRight size={12} />
          </button>
        </div>
        {loading ? (
          <div className="h-[240px] bg-gray-100 rounded-xl animate-pulse" />
        ) : growthData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="grad-users" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#003087" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#003087" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="users" stroke="#003087" fill="url(#grad-users)" strokeWidth={2.5} name="Registered Users" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[240px] flex items-center justify-center text-xs text-gray-400">
            No historical registration data available
          </div>
        )}
      </div>

      {/* Recent Users table */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Recent Users</h3>
          <button onClick={() => navigate('/admin/users')} className="text-gov-blue text-sm font-medium hover:underline flex items-center gap-1">
            View All Users <ArrowRight size={13} />
          </button>
        </div>
        {usersLoading && !recentUsers.length ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['User', 'Email', 'Role', 'Location', 'Joined Date', 'Status', 'Searches'].map(h => (
                    <th key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wide py-2 text-left pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentUsers.slice((userPage - 1) * 5, userPage * 5).map(u => (
                  <tr key={u.id} onClick={() => navigate('/admin/users')} className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="py-3 pr-4 font-medium text-gray-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gov-blue/10 text-gov-blue font-bold text-xs flex items-center justify-center shrink-0">
                          {(u.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-900 truncate max-w-[130px]">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-500 text-xs">{u.email}</td>
                    <td className="py-3 pr-4">
                      <span className={`badge text-xs font-semibold ${
                        u.role && u.role.includes('ADMIN') ? 'bg-purple-100 text-purple-700' :
                        u.role && u.role.includes('MANAGER') ? 'bg-blue-100 text-blue-700' :
                        'bg-teal-100 text-teal-700'
                      }`}>
                        {u.role ? u.role.replace('ROLE_', '').replace('_', ' ') : 'CITIZEN'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-500 text-xs truncate max-w-[130px]">
                      {u.district ? `${u.district}, ${u.state || 'TN'}` : (u.state || u.city || 'Tamil Nadu')}
                    </td>
                    <td className="py-3 pr-4 text-gray-500 text-xs whitespace-nowrap">
                      {formatJoinedDate(u.joined)}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.status === 'Active' ? 'bg-green-100 text-green-700' :
                        u.status === 'Suspended' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          u.status === 'Active' ? 'bg-green-500' :
                          u.status === 'Suspended' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`} />
                        {u.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-3 text-gray-700 font-mono text-xs font-semibold">
                      {u.searches ?? u.activityCount ?? 0}
                    </td>
                  </tr>
                ))}
                {recentUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-xs text-gray-400">
                      No recent users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {recentUsers.length > 5 && (
              <div className="pt-3 border-t border-gray-100">
                <Pagination
                  page={userPage}
                  totalItems={recentUsers.length}
                  pageSize={5}
                  onPageChange={setUserPage}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}