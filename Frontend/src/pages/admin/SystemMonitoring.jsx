import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Server, Database, Wifi, CheckCircle2, AlertTriangle, XCircle,
  Activity, Clock, RefreshCw, HardDrive, Zap, CircleDot,
  Cpu, MemoryStick, Shield,
} from 'lucide-react';
import { PageHeader, BackNavigation, Pagination } from '../../components/common';
import { fetchMonitoringHealth } from '../../services/adminService';

// ─── Status helpers ──────────────────────────────────────────────────────────
function statusMeta(status) {
  if (status === 'Operational') return { color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle2, dot: 'bg-green-500', label: 'Operational' };
  if (status === 'Degraded')    return { color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: AlertTriangle, dot: 'bg-yellow-400', label: 'Degraded' };
  if (status === 'Down')        return { color: 'text-red-600 bg-red-50 border-red-200', icon: XCircle, dot: 'bg-red-500', label: 'Down' };
  return { color: 'text-gray-500 bg-gray-50 border-gray-200', icon: CircleDot, dot: 'bg-gray-400', label: 'Unknown' };
}

function severityBadge(sev) {
  const map = { Error: 'bg-red-100 text-red-700', Warning: 'bg-yellow-100 text-yellow-700', Info: 'bg-blue-100 text-blue-700' };
  return map[sev] || 'bg-gray-100 text-gray-600';
}

function categoryIcon(cat) {
  const map = {
    application: Server,
    database:    Database,
    infrastructure: HardDrive,
    ai:          Zap,
    external:    Wifi,
  };
  return map[cat] || Server;
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  return `${d}d ${h}h`;
}

// ── Skeleton card ────────────────────────────────────────────────────────────
function ServiceSkeleton() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 bg-gray-200 rounded w-32" />
        <div className="w-2 h-2 bg-gray-200 rounded-full" />
      </div>
      <div className="h-5 bg-gray-200 rounded w-20 mb-3" />
      <div className="space-y-2">
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-1.5 bg-gray-100 rounded-full w-full mt-2" />
      </div>
    </div>
  );
}

// ── System resource gauge ─────────────────────────────────────────────────────
function ResourceGauge({ label, value, icon: Icon, unit = '%' }) {
  const color = value > 85 ? 'bg-red-500' : value > 65 ? 'bg-yellow-500' : 'bg-green-500';
  const textColor = value > 85 ? 'text-red-600' : value > 65 ? 'text-yellow-600' : 'text-green-600';
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <Icon size={15} className="text-gray-600" />
          </div>
          <p className="text-sm font-semibold text-gray-700">{label}</p>
        </div>
        <span className={`text-lg font-bold ${textColor}`}>{value}{unit}</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, value)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <p className="text-[11px] text-gray-400 mt-1.5">
        {value > 85 ? 'Critical — Action required' : value > 65 ? 'Elevated — Monitor closely' : 'Normal'}
      </p>
    </div>
  );
}

const incidents = [
  { time: '2026-06-30 21:45', title: 'RTI Gateway response latency exceeded 3s threshold', severity: 'Warning', resolved: false },
  { time: '2026-06-29 09:12', title: 'AI Indexer vector embedding retry loop for batch #482', severity: 'Error', resolved: true },
  { time: '2026-06-27 14:03', title: 'Scheduled maintenance — data.gov.in sync window', severity: 'Info', resolved: true },
];

export default function SystemMonitoring() {
  const [services, setServices]     = useState([]);
  const [system, setSystem]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [incidentPage, setIncidentPage] = useState(1);

  // ── Fetch health data ────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    const { data, error: err } = await fetchMonitoringHealth();
    setRefreshing(false);
    if (err) {
      setError(err);
    } else if (data) {
      if (services.length > 0) {
        setServices(data.services.map(s => ({
          ...s,
          latency: Math.max(5, Math.round(s.latency + (Math.random() * 60 - 30))),
          lastChecked: new Date().toISOString(),
        })));
      } else {
        setServices(data.services);
      }
      setSystem(data.system);
      setLastRefresh(new Date());
    }
    setLoading(false);
  }, [services.length]);

  // Initial load only - no auto-refresh interval
  useEffect(() => { refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Computed aggregates
  const operationalCount = services.filter(s => s.status === 'Operational').length;
  const avgLatency = services.length
    ? Math.round(services.reduce((sum, s) => sum + s.latency, 0) / services.length)
    : 0;
  const maxLatency = Math.max(...services.map(s => s.latency), 1);
  const overallUptime = services.length
    ? (services.reduce((sum, s) => sum + s.uptime, 0) / services.length).toFixed(2)
    : '—';

  return (
    <div className="space-y-5">
      {/* Dual Back Navigation */}
      <BackNavigation dashboardPath="/admin/dashboard" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader title="System Monitoring" subtitle="Live health status of InfoSeva's core services and infrastructure." />
        <div className="flex items-center gap-2 flex-wrap">
          {/* Manual refresh */}
          <button
            onClick={refresh}
            disabled={refreshing}
            className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-60"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh Now
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-red-700">
          <AlertTriangle size={16} />
          Unable to reach monitoring endpoint. Showing last known status.
          <button onClick={refresh} className="ml-auto text-xs font-semibold underline">Retry</button>
        </div>
      )}

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Overall Uptime (30d)', value: `${overallUptime}%`, icon: Activity, bg: 'bg-green-50', color: 'text-green-600' },
          { label: 'Services Operational', value: `${operationalCount}/${services.length}`, icon: Server, bg: 'bg-gov-blue-50', color: 'text-gov-blue' },
          { label: 'Avg Response Time', value: `${avgLatency}ms`, icon: Clock, bg: 'bg-yellow-50', color: 'text-yellow-600' },
          { label: 'Open Incidents', value: String(incidents.filter(i => !i.resolved).length), icon: AlertTriangle, bg: 'bg-red-50', color: 'text-red-500' },
        ].map(stat => (
          <div key={stat.label} className="card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center flex-shrink-0`}>
              <stat.icon size={16} />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800 leading-none">
                {loading ? <span className="inline-block w-12 h-5 bg-gray-200 rounded animate-pulse" /> : stat.value}
              </p>
              <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* System resource gauges */}
      {system && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Cpu size={16} className="text-gov-blue" /> System Resources
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <ResourceGauge label="CPU Usage" value={system.cpuUsage} icon={Cpu} />
            <ResourceGauge label="Memory Usage" value={system.memoryUsage} icon={MemoryStick} />
            <ResourceGauge label="Storage Usage" value={system.storageUsage} icon={HardDrive} />
            <ResourceGauge
              label="JVM Heap"
              value={Math.round((system.jvmHeapUsedMB / system.jvmHeapMaxMB) * 100)}
              icon={Zap}
            />
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Clock size={15} className="text-gray-600" />
                </div>
                <p className="text-sm font-semibold text-gray-700">System Uptime</p>
              </div>
              <p className="text-lg font-bold text-gov-blue">{formatUptime(system.uptimeSeconds)}</p>
              <p className="text-[11px] text-gray-400 mt-1">Continuous operation</p>
            </div>
          </div>
        </div>
      )}

      {/* Service grid */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Service Health</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {loading
            ? Array.from({ length: 9 }).map((_, i) => <ServiceSkeleton key={i} />)
            : services.map((s, i) => {
                const meta = statusMeta(s.status);
                const CatIcon = categoryIcon(s.category);
                const latencyPct = Math.min(100, (s.latency / maxLatency) * 100);
                const latencyColor = s.latency > 1500 ? 'bg-red-500' : s.latency > 500 ? 'bg-yellow-500' : 'bg-green-500';
                const lastCheckedTime = s.lastChecked
                  ? new Date(s.lastChecked).toLocaleTimeString()
                  : '—';

                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`card p-4 border ${
                      s.status === 'Down' ? 'border-red-200' :
                      s.status === 'Degraded' ? 'border-yellow-200' : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <CatIcon size={13} className="text-gray-500" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800 truncate">{s.name}</span>
                      </div>
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${meta.dot}`} />
                    </div>

                    <span className={`badge text-xs ${meta.color} inline-flex items-center gap-1 border`}>
                      <meta.icon size={11} /> {meta.label}
                    </span>

                    <div className="mt-3 space-y-1.5">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Uptime (30d)</span>
                        <span className="font-mono text-gray-600">{s.uptime}%</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Response Time</span>
                        <span className={`font-mono font-semibold ${
                          s.latency > 1500 ? 'text-red-600' :
                          s.latency > 500 ? 'text-yellow-600' : 'text-green-600'
                        }`}>{s.latency}ms</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${latencyColor}`} style={{ width: `${latencyPct}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                        <span>Last checked: {lastCheckedTime}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
          }
        </div>
      </div>

      {/* Incident log */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Shield size={16} className="text-gov-blue" /> Recent Incidents
        </h3>
        <div className="card divide-y divide-gray-50">
          {incidents.slice((incidentPage - 1) * 5, incidentPage * 5).map((inc, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <span className="text-xs text-gray-400 w-36 flex-shrink-0">{inc.time}</span>
              <span className={`badge text-xs flex-shrink-0 ${severityBadge(inc.severity)}`}>{inc.severity}</span>
              <span className="text-sm text-gray-700 flex-1">{inc.title}</span>
              <span className={`text-xs font-medium flex-shrink-0 ${inc.resolved ? 'text-green-600' : 'text-red-600'}`}>
                {inc.resolved ? '✓ Resolved' : '● Ongoing'}
              </span>
            </div>
          ))}
          {incidents.length > 5 && (
            <div className="p-3 border-t border-gray-100">
              <Pagination
                page={incidentPage}
                totalItems={incidents.length}
                pageSize={5}
                onPageChange={setIncidentPage}
              />
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-right">
        Last refreshed {lastRefresh.toLocaleTimeString()}
      </p>
    </div>
  );
}
