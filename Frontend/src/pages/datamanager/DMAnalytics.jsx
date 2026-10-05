import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Database, User, SearchX,
  X, Loader, Plus, LogOut, FileWarning, Check, XCircle, Info,
  Eye, Edit3, Sparkles, FolderInput, MapPin, Globe, Shield, Bell, ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, BackNavigation } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useDataManager } from '../../context/DataManagerContext';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend, LineChart, Line
} from 'recharts';
import ChangePasswordSection from '../../components/common/ChangePasswordSection';
import * as ui from '../../styles/datamanager/DataManagerUI';
import { CATEGORY_OPTIONS } from './shared';


// ─── DM Analytics ────────────────────────────────────────────────────────
export function DMAnalytics() {
  const { manualRecords, bulkRecords, reviewQueue, activityLog, dataSources, contentGaps, dashboardStats } = useDataManager();

  // Live counts fetched directly from backend on mount — always accurate from DB
  const [liveCounts, setLiveCounts] = useState({
    total: null,
    pending: null,
    approved: null,
    gaps: null,
  });
  const [liveDocuments, setLiveDocuments] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('infoseva_access_token') || sessionStorage.getItem('jwt_token') || '';
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    // 1. Fetch live operational dashboard stats (totalDocuments, publishedDocs, pendingReviews, contentGaps)
    fetch('http://localhost:8082/api/dashboard/data-manager', { headers })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          const s = data.data;
          setLiveCounts(prev => ({
            ...prev,
            pending: s.pendingReviews ?? prev.pending,
            gaps: s.contentGaps ?? prev.gaps,
          }));
        }
      })
      .catch(() => {});

    // 2. Fetch all documents for real chart calculations & accurate breakdown
    fetch('http://localhost:8082/api/documents', { headers })
      .then(r => r.json())
      .then(data => {
        const docs = data.data || [];
        const total = docs.length;
        const approved = docs.filter(d => d.reviewStatus === 'APPROVED' || d.status === 'Published').length;
        const pending = docs.filter(d => d.reviewStatus === 'PENDING_REVIEW').length;
        setLiveCounts(prev => ({
          ...prev,
          total: total,
          approved: approved,
          pending: prev.pending ?? pending,
        }));
        setLiveDocuments(docs.map(d => {
          const desc = d.description || '';
          const tags = d.tags || '';
          const isBulk = d.isBulk || desc.includes('[Batch:') || tags.toLowerCase().includes('bulk') || (d.source || '').toLowerCase().includes('bulk');
          return {
            ...d,
            id: d.documentId,
            date: d.uploadDate || d.createdAt,
            category: d.category || d.documentType || 'General',
            isBulk,
            reviewStatus: d.reviewStatus,
            status: d.reviewStatus === 'APPROVED' ? 'Published' : (d.reviewStatus === 'REJECTED' ? 'Rejected' : 'In Review')
          };
        }));
      })
      .catch(() => {});

    // 3. Fetch review queue directly to verify live pending count
    fetch('http://localhost:8082/api/documents/review-queue?page=0&size=200', { headers })
      .then(r => r.json())
      .then(data => {
        const content = data.data?.content || [];
        const pending = data.data?.totalElements ?? content.length;
        setLiveCounts(prev => ({ ...prev, pending }));
      })
      .catch(() => {});

    // 4. Fetch content gaps live count from database
    fetch('http://localhost:8082/api/analytics/content-gaps?page=0&size=1', { headers })
      .then(r => r.json())
      .then(data => {
        const gaps = data.data?.totalElements ?? (data.data?.content?.length ?? 0);
        setLiveCounts(prev => ({ ...prev, gaps }));
      })
      .catch(() => {});
  }, []);

  // 1. Combine all real records (use liveDocuments if loaded, else context records)
  const allRecords = useMemo(() => {
    if (liveDocuments && liveDocuments.length > 0) {
      return liveDocuments;
    }
    return [...manualRecords, ...bulkRecords];
  }, [liveDocuments, manualRecords, bulkRecords]);

  // 2. Real Weekly Data (Mon - Sun based on real upload dates in the current week)
  const weeklyData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    
    const now = new Date();
    const currentDay = now.getDay();
    const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // Monday
    const startOfWeek = new Date(now.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    allRecords.forEach(r => {
      if (r.date) {
        const d = new Date(r.date);
        if (!isNaN(d.getTime())) {
          const dayName = days[d.getDay()];
          counts[dayName] = (counts[dayName] || 0) + 1;
        }
      }
    });

    return [
      { day: 'Mon', docs: counts.Mon },
      { day: 'Tue', docs: counts.Tue },
      { day: 'Wed', docs: counts.Wed },
      { day: 'Thu', docs: counts.Thu },
      { day: 'Fri', docs: counts.Fri },
      { day: 'Sat', docs: counts.Sat },
      { day: 'Sun', docs: counts.Sun },
    ];
  }, [allRecords]);

  // 3. Real Records by Source (Single vs Bulk Uploads)
  const sourceBreakdown = useMemo(() => {
    let singleCount = 0;
    let bulkCount = 0;
    allRecords.forEach(r => {
      if (r.isBulk) {
        bulkCount += 1;
      } else {
        singleCount += 1;
      }
    });
    return [
      { name: 'Bulk Upload', value: bulkCount },
      { name: 'Single Upload', value: singleCount },
    ];
  }, [allRecords]);

  // 4. Real Category Breakdown (Only categories with real records or top options)
  const categoryBreakdown = useMemo(() => {
    const catMap = {};
    allRecords.forEach(r => {
      const c = r.category || r.documentType || 'General';
      catMap[c] = (catMap[c] || 0) + 1;
    });

    // If there are recorded categories, map them; otherwise ensure defaults are 0
    const list = Object.keys(catMap).map(k => ({
      category: k,
      count: catMap[k],
    }));

    return list.length > 0 ? list : CATEGORY_OPTIONS.slice(0, 5).map(cat => ({ category: cat, count: 0 }));
  }, [allRecords]);

  // 5. Real 6-Month Upload Trend
  const monthTrend = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const pastMonths = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      pastMonths.push({
        month: months[d.getMonth()],
        year: d.getFullYear(),
        monthNum: d.getMonth(),
        docs: 0
      });
    }

    allRecords.forEach(r => {
      if (r.date) {
        const d = new Date(r.date);
        if (!isNaN(d.getTime())) {
          const match = pastMonths.find(m => m.monthNum === d.getMonth() && m.year === d.getFullYear());
          if (match) {
            match.docs += 1;
          }
        }
      }
    });

    return pastMonths.map(m => ({ month: m.month, docs: m.docs }));
  }, [allRecords]);

  // 6. Status Breakdown with real live counts
  const totalRecords = liveCounts.total ?? (allRecords.length > 0 ? allRecords.length : (dashboardStats?.totalDocuments ?? 0));
  const pendingDocs = liveCounts.pending ?? (reviewQueue.length > 0 ? reviewQueue.length : (dashboardStats?.pendingReviews ?? 0));
  const approvedDocs = liveCounts.approved ?? allRecords.filter(r => r.status === 'Published' || r.reviewStatus === 'APPROVED').length ?? (dashboardStats?.publishedDocs ?? 0);
  const activeGaps = liveCounts.gaps ?? (contentGaps?.length > 0 ? contentGaps.length : (dashboardStats?.contentGaps ?? 0));

  return (
    <div className="space-y-5">
      {/* Dual Back Navigation */}
      <BackNavigation dashboardPath="/datamanager" />

      <PageHeader title="Analytics" subtitle="Live data management activity, ingestion statistics, and contribution metrics." />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { l: 'Total Ingested Records', v: totalRecords, c: 'text-[#0B1739]' },
          { l: 'Items in Review Queue', v: pendingDocs, c: 'text-gov-blue' },
          { l: 'Approved & Published', v: approvedDocs, c: 'text-green-600' },
          { l: 'Active Content Gaps', v: activeGaps, c: 'text-amber-600' },
        ].map(s => (
          <div key={s.l} className={ui.statBoxLeft}>
            <div className={`text-2xl font-bold ${s.c}`}>
              {typeof s.v === 'number' ? s.v.toLocaleString() : (s.v ?? 0)}
            </div>
            <div className="text-xs text-gray-400 mt-1">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Weekly Volume */}
        <div className={ui.cardPad}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Weekly Document Ingestion (Live)</h3>
            <span className="text-[11px] font-semibold text-gray-400">Current Week</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="navyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ui.chartColors.primary} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={ui.chartColors.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="docs" stroke={ui.chartColors.primary} fill="url(#navyGrad)" strokeWidth={2} name="Documents" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Source Breakdown */}
        <div className={ui.cardPad}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Records by Intake Source</h3>
            <span className="text-[11px] font-semibold text-gray-400">{totalRecords} Total Docs</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={sourceBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {sourceBreakdown.map((_, i) => (
                  <Cell key={i} fill={ui.chartColors.pieColors[i % ui.chartColors.pieColors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className={`${ui.cardPad} lg:col-span-2`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Records by Document Category</h3>
            <span className="text-[11px] font-semibold text-gray-400">Active Library</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={categoryBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill={ui.chartColors.quaternary} radius={[4, 4, 0, 0]} name="Documents" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 6-Month Upload Trend */}
        <div className={`${ui.cardPad} lg:col-span-2`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Monthly Document Ingestion Trend (Live)</h3>
            <span className="text-[11px] font-semibold text-gray-400">Past 6 Months</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="docs" stroke={ui.chartColors.primary} strokeWidth={2.5} dot={{ r: 4 }} name="Documents" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
