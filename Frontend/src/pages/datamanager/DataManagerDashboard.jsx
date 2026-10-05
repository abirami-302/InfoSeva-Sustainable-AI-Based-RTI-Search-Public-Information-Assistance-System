import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Upload, Database, ClipboardCheck, Activity, ArrowRight,
  SearchX, CheckCircle2, XCircle, Wifi, Plus, TrendingUp, FileText,
  ChevronLeft, ChevronRight, FolderInput,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useDataManager } from '../../context/DataManagerContext';
import * as ui from '../../styles/datamanager/DataManagerUI';

const ACTIVITIES_PER_PAGE = 5;

export default function DataManagerDashboard() {
  const { user } = useAuth();
  const {
    dashboardStats, reviewQueue, contentGaps, activityLog, manualRecords, bulkRecords
  } = useDataManager();
  const navigate = useNavigate();
  const [actPage, setActPage] = useState(1);

  // Live counts fetched directly from backend on mount — always accurate from DB
  const [liveCounts, setLiveCounts] = useState({ total: null, pending: null, approved: null, gaps: null });
  const [liveQueue, setLiveQueue] = useState(null); // null = not loaded yet

  useEffect(() => {
    const token = localStorage.getItem('infoseva_access_token');
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    // Fetch all documents to compute total + approved counts
    fetch('http://localhost:8082/api/documents', { headers })
      .then(r => r.json())
      .then(data => {
        const docs = data.data || [];
        const total = docs.length;
        const approved = docs.filter(d => d.reviewStatus === 'APPROVED').length;
        setLiveCounts(prev => ({ ...prev, total, approved }));
      })
      .catch(() => {});

    // Fetch review queue to get live pending count + preview items
    fetch('http://localhost:8082/api/documents/review-queue?page=0&size=200', { headers })
      .then(r => r.json())
      .then(data => {
        const content = data.data?.content || [];
        const pending = data.data?.totalElements ?? content.length;
        setLiveCounts(prev => ({ ...prev, pending }));
        setLiveQueue(content.map(d => ({
          id: d.documentId,
          title: d.title,
          type: d.category || d.documentType,
          source: 'Upload',
          confidence: 90,
        })));
      })
      .catch(() => {});

    // Fetch content gaps live count
    fetch('http://localhost:8082/api/analytics/content-gaps?page=0&size=1', { headers })
      .then(r => r.json())
      .then(data => {
        const gaps = data.data?.totalElements ?? (data.data?.content?.length ?? 0);
        setLiveCounts(prev => ({ ...prev, gaps }));
      })
      .catch(() => {});
  }, []);

  // Combine real records from context (used for weekly chart)
  const allRecords = useMemo(() => {
    return [...manualRecords, ...bulkRecords];
  }, [manualRecords, bulkRecords]);

  // Compute live weekly upload metrics
  const weeklyUploads = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = {
      Mon: { docs: 0, approved: 0, rejected: 0 },
      Tue: { docs: 0, approved: 0, rejected: 0 },
      Wed: { docs: 0, approved: 0, rejected: 0 },
      Thu: { docs: 0, approved: 0, rejected: 0 },
      Fri: { docs: 0, approved: 0, rejected: 0 },
      Sat: { docs: 0, approved: 0, rejected: 0 },
      Sun: { docs: 0, approved: 0, rejected: 0 },
    };

    allRecords.forEach(r => {
      if (r.date) {
        const d = new Date(r.date);
        if (!isNaN(d.getTime())) {
          const dayName = days[d.getDay()];
          if (counts[dayName]) {
            counts[dayName].docs += 1;
            if (r.status === 'Published' || r.reviewStatus === 'APPROVED') {
              counts[dayName].approved += 1;
            } else if (r.status === 'Rejected' || r.reviewStatus === 'REJECTED') {
              counts[dayName].rejected += 1;
            }
          }
        }
      }
    });

    return [
      { day: 'Mon', ...counts.Mon },
      { day: 'Tue', ...counts.Tue },
      { day: 'Wed', ...counts.Wed },
      { day: 'Thu', ...counts.Thu },
      { day: 'Fri', ...counts.Fri },
      { day: 'Sat', ...counts.Sat },
      { day: 'Sun', ...counts.Sun },
    ];
  }, [allRecords]);

  // Use live counts from direct backend fetch — fall back to context while loading
  const totalUploaded = liveCounts.total   ?? allRecords.length ?? (dashboardStats?.totalDocuments || 0);
  const pendingReview = liveCounts.pending ?? reviewQueue.length ?? (dashboardStats?.pendingReviews || 0);
  const approvedDocs  = (liveCounts.approved ?? allRecords.filter(r => r.status === 'Published' || r.reviewStatus === 'APPROVED').length) || (dashboardStats?.publishedDocs || 0);

  const dmStats = [
    {
      label: 'Docs Uploaded', value: totalUploaded,
      icon: Upload, chip: 'blue', route: '/datamanager/history',
      trend: 'Total ingested system-wide',
    },
    {
      label: 'Pending Review', value: pendingReview,
      icon: ClipboardCheck, chip: 'orange', route: '/datamanager/review',
      trend: 'Awaiting human review',
    },
    {
      label: 'Content Gaps', value: liveCounts.gaps ?? (contentGaps || []).length ?? (dashboardStats?.contentGaps || 0),
      icon: SearchX, chip: 'red', route: '/datamanager/gaps',
      trend: 'Failed user searches',
    },
    {
      label: 'Published Docs', value: approvedDocs,
      icon: CheckCircle2, chip: 'navy', route: '/datamanager/history',
      trend: 'Live in knowledge base',
    },
  ];


  // Activity pagination
  const totalPages = Math.ceil(activityLog.length / ACTIVITIES_PER_PAGE);
  const pagedActivity = activityLog.slice(
    (actPage - 1) * ACTIVITIES_PER_PAGE,
    actPage * ACTIVITIES_PER_PAGE
  );

  const actionIcon = {
    'Bulk Upload':    FolderInput,
    'Single Upload':  Upload,
    'Review Approved': CheckCircle2,
    'Review Rejected': XCircle,
    'Content Gap Resolved': SearchX,
    'Document Deleted': XCircle,
  };
  const actionRoute = {
    'Bulk Upload':    '/datamanager/bulk',
    'Single Upload':  '/datamanager/ingestion',
    'Review Approved': '/datamanager/sources',
    'Review Rejected': '/datamanager/review',
    'Content Gap Resolved': '/datamanager/gaps',
    'Document Deleted': '/datamanager/sources',
  };
  const actionColor = {
    'Bulk Upload':    'blue',
    'Single Upload':  'navy',
    'Review Approved': 'green',
    'Review Rejected': 'red',
    'Content Gap Resolved': 'navy',
    'Document Deleted': 'red',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Data Operations Console</p>
          <h2 className="font-display text-2xl font-bold text-gray-900 mt-0.5">
            Welcome back, {user?.name?.split(' ')[0] || 'Data Manager'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            <span className="font-semibold text-orange-600">{pendingReview} items</span> pending review ·{' '}
            <span className="font-semibold text-red-500">{liveCounts.gaps ?? (contentGaps || []).length} content gaps</span> flagged from user searches
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => navigate('/datamanager/sources')} className="btn-primary text-sm flex items-center gap-1.5">
            <Upload size={14} /> Upload Document
          </button>
          <button onClick={() => navigate('/datamanager/review')} className="btn-secondary text-sm flex items-center gap-1.5">
            <ClipboardCheck size={14} /> Review Queue
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {dmStats.map((s, i) => (
          <motion.button
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => navigate(s.route)}
            className={`${ui.cardPad} text-left hover:shadow-card-hover transition-all hover:-translate-y-0.5 group`}
          >
            <div className={`w-9 h-9 rounded-xl ${ui.iconChip(s.chip)} flex items-center justify-center mb-3`}>
              <s.icon size={17} />
            </div>
            <div className="text-2xl font-bold text-gray-900 group-hover:text-gov-blue transition-colors">
              {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
            </div>
            <div className="text-xs text-gray-500 mt-0.5 leading-tight font-medium">{s.label}</div>
            <div className="text-[10px] text-gray-400 mt-1">{s.trend}</div>
          </motion.button>
        ))}
      </div>

      {/* Charts + Review Preview */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Upload trend chart */}
        <div className={`lg:col-span-2 ${ui.cardPad}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Activity size={16} className="text-purple-600" />
              Upload Activity This Week
            </h3>
            <button
              onClick={() => navigate('/datamanager/analytics')}
              className="text-xs text-gov-blue font-medium hover:underline flex items-center gap-1"
            >
              Full Analytics <TrendingUp size={11} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyUploads} barSize={18} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="docs"     fill="#003087" radius={[3,3,0,0]} name="Uploaded" />
              <Bar dataKey="approved" fill="#138808" radius={[3,3,0,0]} name="Approved" />
              <Bar dataKey="rejected" fill="#FF6B00" radius={[3,3,0,0]} name="Rejected" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Review Queue preview */}
        <div className={ui.cardOverflow}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <ClipboardCheck size={16} className="text-orange-500" />
              Review Queue
            </h3>
            <button
              onClick={() => navigate('/datamanager/review')}
              className="text-xs text-gov-blue font-medium hover:underline flex items-center gap-1"
            >
              View all <ArrowRight size={11} />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {(liveQueue ?? reviewQueue).length === 0 && (
              <div className="p-6 text-center text-xs text-gray-400">
                <CheckCircle2 size={24} className="text-green-400 mx-auto mb-2" />
                All items reviewed!
              </div>
            )}
            {(liveQueue ?? reviewQueue).slice(0, 5).map((item) => (
              <button
                key={item.id}
                onClick={() => navigate('/datamanager/review')}
                className="w-full text-left px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-1">
                    {item.title}
                  </p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap ${
                    item.confidence >= 80 ? 'bg-green-100 text-green-700' :
                    item.confidence >= 55 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {item.confidence}%
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">{item.type} · {item.source}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div>
        {/* Activity Log with pagination */}
        <div className={ui.cardOverflow}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Activity size={16} className="text-gov-blue" />
              Recent Activity
            </h3>
            <span className="text-xs text-gray-400">{activityLog.length} total</span>
          </div>
          <div className="divide-y divide-gray-50">
            {pagedActivity.map((log) => {
              const Icon = actionIcon[log.action] || FileText;
              const color = actionColor[log.action] || 'gray';
              const route = actionRoute[log.action];
              return (
                <button
                  key={log.id}
                  onClick={() => route && navigate(route)}
                  className="w-full text-left flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className={`${ui.iconChip(color, 'w-7 h-7')} flex-shrink-0 mt-0.5`}>
                    <Icon size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800">{log.action}</p>
                    <p className="text-[11px] text-gray-500 leading-snug line-clamp-1">{log.detail}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{log.time}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setActPage((p) => Math.max(1, p - 1))}
                disabled={actPage === 1}
                className="text-xs text-gray-500 hover:text-gov-blue disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft size={13} /> Prev
              </button>
              <span className="text-xs text-gray-400">{actPage} / {totalPages}</span>
              <button
                onClick={() => setActPage((p) => Math.min(totalPages, p + 1))}
                disabled={actPage === totalPages}
                className="text-xs text-gray-500 hover:text-gov-blue disabled:opacity-40 flex items-center gap-1"
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className={ui.cardPad}>
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-gov-blue" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Single Upload', icon: Upload, path: '/datamanager/ingestion', color: 'bg-gov-blue-50 text-gov-blue hover:bg-gov-blue hover:text-white' },
            { label: 'Bulk Upload',   icon: FolderInput, path: '/datamanager/bulk', color: 'bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white' },
            { label: 'Review Queue',  icon: ClipboardCheck, path: '/datamanager/review', color: 'bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white' },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => navigate(a.path)}
              className={`flex items-center gap-2.5 p-3.5 rounded-xl border border-transparent hover:border-current/10 text-sm font-semibold transition-all ${a.color}`}
            >
              <a.icon size={16} />
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}