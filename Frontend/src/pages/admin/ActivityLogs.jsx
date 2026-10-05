import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, ScrollText, Filter, Loader, Shield, User, Clock, CheckCircle, AlertTriangle, UserX, UserCheck, Edit3 } from 'lucide-react';
import { PageHeader, Pagination, BackNavigation } from '../../components/common';
import { usePagination } from '../../hooks/usePagination';

const actionBadgeStyle = {
  USER_LOGIN: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  FAILED_LOGIN: 'bg-red-100 text-red-800 border-red-200',
  USER_ACTIVATED: 'bg-blue-100 text-blue-800 border-blue-200',
  USER_SUSPENDED: 'bg-amber-100 text-amber-800 border-amber-200',
  USER_DELETED: 'bg-rose-100 text-rose-800 border-rose-200',
  USER_UPDATED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  DATA_MANAGER_UPDATED: 'bg-purple-100 text-purple-800 border-purple-200',
  DOCUMENT_UPLOADED: 'bg-teal-100 text-teal-800 border-teal-200',
  DOCUMENT_APPROVED: 'bg-green-100 text-green-800 border-green-200',
  DOCUMENT_REJECTED: 'bg-orange-100 text-orange-800 border-orange-200',
};

function formatActionName(action) {
  return action ? action.replace(/_/g, ' ') : 'EVENT';
}

function downloadCSV(rows) {
  const headers = ['Timestamp', 'Actor Email', 'Actor Role', 'Action', 'Target', 'Details'];
  const csvRows = rows.map(r => [
    r.timeFormatted,
    r.userEmail || '',
    r.actorRole || '',
    r.action || '',
    r.target || '',
    r.details || ''
  ]).map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');

  const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `infoseva-activity-audit-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [dateRangeFilter, setDateRangeFilter] = useState('All');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('infoseva_access_token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch auth-service user/admin audit logs and infoseva-service document/DM audit logs in parallel
        const [authRes, infosevaRes] = await Promise.allSettled([
          fetch('http://localhost:8081/api/users/admin/activity-logs', { headers }),
          fetch('http://localhost:8082/api/admin/logs', { headers }),
        ]);

        const combinedLogs = [];

        if (authRes.status === 'fulfilled' && authRes.value.ok) {
          const json = await authRes.value.json();
          const items = json.data || [];
          items.forEach(l => {
            const dateObj = l.createdAt ? new Date(l.createdAt) : new Date();
            combinedLogs.push({
              id: `auth-${l.id}`,
              rawDate: dateObj,
              timeFormatted: dateObj.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              }),
              userEmail: l.userEmail || 'System',
              actorRole: l.actorRole || 'System',
              action: l.action || 'ACTIVITY',
              target: l.target || '—',
              details: l.details || '—'
            });
          });
        }

        if (infosevaRes.status === 'fulfilled' && infosevaRes.value.ok) {
          const json = await infosevaRes.value.json();
          const items = json.data || [];
          items.forEach(l => {
            const dateObj = l.time ? new Date(l.time) : new Date();
            // Map actions like UPLOAD -> DOCUMENT_UPLOADED, APPROVE -> DOCUMENT_APPROVED, REJECT -> DOCUMENT_REJECTED
            let normAction = (l.msg || '').toUpperCase().includes('UPLOAD') ? 'DOCUMENT_UPLOADED'
              : (l.msg || '').toUpperCase().includes('APPROVE') ? 'DOCUMENT_APPROVED'
              : (l.msg || '').toUpperCase().includes('REJECT') ? 'DOCUMENT_REJECTED'
              : (l.msg || '').toUpperCase().includes('DRAFT') ? 'DOCUMENT_DRAFT'
              : 'DATA_MANAGER_ACTIVITY';

            // Extract performer if present
            const performerMatch = (l.msg || '').match(/\(by ([^)]+)\)/);
            const performer = performerMatch ? performerMatch[1] : 'Data Manager';

            combinedLogs.push({
              id: `info-${l.id}`,
              rawDate: dateObj,
              timeFormatted: dateObj.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              }),
              userEmail: performer,
              actorRole: 'Data Manager',
              action: normAction,
              target: l.service || 'Document',
              details: l.msg || 'Data Manager Activity'
            });
          });
        }

        // Sort descending by timestamp
        combinedLogs.sort((a, b) => b.rawDate - a.rawDate);
        setLogs(combinedLogs);
      } catch (err) {
        console.error('Failed to fetch activity audit logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const actionTypes = useMemo(() => {
    return ['All', ...new Set(logs.map(l => l.action).filter(Boolean))];
  }, [logs]);

  const filtered = useMemo(() => {
    const now = new Date();
    return logs.filter(l => {
      // Query filter across actor, action, target, details
      const q = query.toLowerCase();
      const matchQuery = !query || 
        `${l.userEmail} ${l.actorRole} ${l.action} ${l.target} ${l.details}`.toLowerCase().includes(q);

      // Action type filter
      const matchAction = actionFilter === 'All' || l.action === actionFilter;

      // Date range filter
      let matchDate = true;
      if (dateRangeFilter === 'Today') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        matchDate = l.rawDate >= startOfDay;
      } else if (dateRangeFilter === 'Last 7 Days') {
        const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        matchDate = l.rawDate >= sevenDaysAgo;
      } else if (dateRangeFilter === 'Last 30 Days') {
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        matchDate = l.rawDate >= thirtyDaysAgo;
      }

      return matchQuery && matchAction && matchDate;
    });
  }, [logs, query, actionFilter, dateRangeFilter]);

  const { page, setPage, pageItems: pagedLogs } = usePagination(filtered, 10);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader className="animate-spin text-gov-blue" size={30} /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Dual Back Navigation */}
      <BackNavigation dashboardPath="/admin/dashboard" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader title="Activity Logs" subtitle="Structured administrative audit trail and security events." />
        <button onClick={() => downloadCSV(filtered)} className="btn-secondary text-sm flex items-center gap-1.5">
          <Download size={15} /> Export Audit Log
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by actor, action, target, or details..."
            className="input-field text-sm pl-9"
          />
        </div>

        {/* Action / Event Type filter */}
        <select
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          className="input-field text-sm w-auto"
        >
          {actionTypes.map(act => (
            <option key={act} value={act}>
              {act === 'All' ? 'All Event Types' : formatActionName(act)}
            </option>
          ))}
        </select>

        {/* Date Range filter */}
        <select
          value={dateRangeFilter}
          onChange={e => { setDateRangeFilter(e.target.value); setPage(1); }}
          className="input-field text-sm w-auto"
        >
          <option value="All">All Time</option>
          <option value="Today">Today</option>
          <option value="Last 7 Days">Last 7 Days</option>
          <option value="Last 30 Days">Last 30 Days</option>
        </select>
      </div>

      {/* Clean Audit Trail Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80 text-gray-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Target</th>
                <th className="py-3.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                  {/* Timestamp */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-gray-500 font-medium font-mono text-[11px]">
                    {log.timeFormatted}
                  </td>

                  {/* Actor */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800">{log.userEmail}</span>
                      <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">{log.actorRole}</span>
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold border ${actionBadgeStyle[log.action] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                      {log.action}
                    </span>
                  </td>

                  {/* Target */}
                  <td className="py-3.5 px-4 text-gray-800 font-medium">
                    <span className="line-clamp-1">{log.target}</span>
                  </td>

                  {/* Details */}
                  <td className="py-3.5 px-4 text-gray-600">
                    <span className="line-clamp-2">{log.details}</span>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-sm text-gray-400">
                    <ScrollText size={32} className="text-gray-300 mx-auto mb-2" />
                    No audit records match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        {filtered.length > 0 && (
          <div className="p-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400 px-2">Showing {pagedLogs.length} of {filtered.length} audit logs</span>
            <Pagination page={page} totalItems={filtered.length} pageSize={10} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
