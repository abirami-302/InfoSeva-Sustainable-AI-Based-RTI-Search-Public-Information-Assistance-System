import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SearchX, Upload, Sparkles, ArrowLeft, X, AlertTriangle,
  ChevronLeft, ChevronRight, Search, Filter, CheckCircle2, Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useDataManager } from '../../context/DataManagerContext';
import { BackNavigation } from '../../components/common';
import * as ui from '../../styles/datamanager/DataManagerUI';

// ─── Priority Band Thresholds ─────────────────────────────────────────────────
// Adjust these as real search volume grows — never use inline numbers elsewhere.
// 1   search  → Low
// 2–3 searches → Medium
// 4+  searches → High
const PRIORITY_HIGH_MIN   = 4;   // searchCount >= PRIORITY_HIGH_MIN  → High
const PRIORITY_MEDIUM_MIN = 2;   // searchCount >= PRIORITY_MEDIUM_MIN → Medium
                                  // searchCount <  PRIORITY_MEDIUM_MIN → Low

function getPriority(searchCount) {
  if (searchCount >= PRIORITY_HIGH_MIN)   return 'High';
  if (searchCount >= PRIORITY_MEDIUM_MIN) return 'Medium';
  return 'Low';
}

const PAGE_SIZE = 10;

function PriorityBadge({ priority }) {
  const map = {
    High:   'bg-red-50 text-red-700 border-red-200',
    Medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Low:    'bg-gray-50 text-gray-500 border-gray-200',
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${map[priority] || map.Low}`}>
      {priority}
    </span>
  );
}

function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-orange-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg">Dismiss</button>
        </div>
      </motion.div>
    </div>
  );
}

export function ContentGaps() {
  const { dashboardStats, deleteContentGap } = useDataManager();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [page, setPage] = useState(1);
  const [dismissTarget, setDismissTarget] = useState(null);

  // Real backend pagination state
  const [contentGaps, setContentGaps] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch paginated gaps from backend (unresolved only, sorted by searchCount DESC)
  const fetchGaps = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('infoseva_access_token');
      if (!token) return;
      const res = await fetch(
        `http://localhost:8082/api/analytics/content-gaps?page=${page - 1}&size=${PAGE_SIZE}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        const pageData = data.data;
        setTotalPages(pageData.totalPages);
        setTotalElements(pageData.totalElements);
        setContentGaps(pageData.content.map((q) => {
          const dateStr = q.lastSearchedAt
            ? new Date(q.lastSearchedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'Recently';
          return {
            id: q.queryId,
            query: q.keyword,
            searches: q.searchCount,
            results: 0,
            lastSearched: dateStr,
            // Derived from real thresholds — no hardcoded numbers here
            priority: getPriority(q.searchCount),
          };
        }));
      }
    } catch (e) {
      console.error('Failed to fetch content gaps', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchGaps();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const filtered = contentGaps.filter(g => {
    const matchSearch = g.query.toLowerCase().includes(search.toLowerCase());
    const matchPriority = filterPriority === 'All' || g.priority === filterPriority;
    return matchSearch && matchPriority;
  });

  // Navigate to DataIngestion with gap context; the upload page reads this state to pre-fill fields.
  const handleAddContent = (gap) => {
    navigate(`/datamanager/ingestion`, { state: { gapId: gap.id, gapQuery: gap.query } });
  };

  const handleDismiss = async () => {
    const gap = contentGaps.find(g => g.id === dismissTarget);
    const success = await deleteContentGap(dismissTarget);
    if (success) {
      toast.success(`Gap "${gap?.query}" dismissed.`);
      if (filtered.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchGaps();
      }
    } else {
      toast.error('Failed to delete gap. Please try again.');
    }
    setDismissTarget(null);
  };

  const totalSearches = dashboardStats?.contentGaps || 0;
  const highCount   = contentGaps.filter(g => g.priority === 'High').length;
  const mediumCount = contentGaps.filter(g => g.priority === 'Medium').length;

  return (
    <div className="space-y-5">
      <BackNavigation dashboardPath="/datamanager" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Content Gaps</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Searches that returned 0 results — prioritise adding this content first.
          </p>
        </div>
        <button onClick={() => navigate('/datamanager/ingestion')} className="btn-primary text-sm flex items-center gap-1.5">
          <Upload size={14} /> Upload Content
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'High Priority Gaps', value: highCount,   color: 'text-red-600',    onClick: () => setFilterPriority('High')   },
          { label: 'Medium Priority',    value: mediumCount, color: 'text-yellow-600', onClick: () => setFilterPriority('Medium') },
          { label: 'Total Failed Searches', value: totalSearches.toLocaleString(), color: 'text-gov-blue', onClick: () => {} },
        ].map(s => (
          <button key={s.label} onClick={s.onClick} className={`${ui.statBox} hover:shadow-md transition-all text-left`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Info banner — priority thresholds driven by named constants above */}
      <div className={ui.infoBanner}>
        <Sparkles size={15} className="text-gov-blue flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-600">
          <strong>Priority bands:</strong>{' '}
          High = {PRIORITY_HIGH_MIN}+ searches · Medium = {PRIORITY_MEDIUM_MIN}–{PRIORITY_HIGH_MIN - 1} searches · Low = 1 search.{' '}
          Items sorted by search volume. Click <strong>Quick Upload</strong> to add content — the form will pre-fill a suggested category.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className={`${ui.input} pl-8`}
            placeholder="Search gaps by keyword..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {['All', 'High', 'Medium', 'Low'].map(p => (
            <button key={p} onClick={() => { setFilterPriority(p); setPage(1); }} className={ui.filterChip(filterPriority === p)}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className={ui.cardOverflow}>
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-xs text-gray-500 font-medium">
            {totalElements} total gap{totalElements !== 1 ? 's' : ''}
            {search && ` matching "${search}"`}
            {loading && ' — loading…'}
          </p>
        </div>
        <div className="divide-y divide-gray-50">
          {!loading && filtered.length === 0 && (
            <div className="py-12 text-center">
              <CheckCircle2 size={36} className="text-green-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400 font-medium">No content gaps found!</p>
              <p className="text-xs text-gray-300 mt-0.5">
                {search || filterPriority !== 'All' ? 'Try adjusting your filters.' : 'All user queries have been resolved.'}
              </p>
            </div>
          )}
          {filtered.map((gap, i) => (
            <motion.div
              key={gap.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              {/* Icon */}
              <div className={`${ui.iconChip('red', 'w-9 h-9')} flex-shrink-0`}>
                <SearchX size={16} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <p className="text-sm font-bold text-gray-900">"{gap.query}"</p>
                  <PriorityBadge priority={gap.priority} />
                  {gap.results === 0 && (
                    <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                      Zero results
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  <strong className="text-gray-600">{gap.searches.toLocaleString()}</strong>{' '}
                  search{gap.searches !== 1 ? 'es' : ''} with no results · Last: {gap.lastSearched}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  💡 Upload a{gap.priority === 'High' ? ' detailed guide' : ' brief overview'} about "{gap.query}" to resolve this gap.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleAddContent(gap)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-gov-blue px-3 py-1.5 rounded-lg hover:bg-gov-blue-dark transition-colors"
                >
                  <Upload size={12} /> Quick Upload
                </button>
                <button
                  onClick={() => setDismissTarget(gap.id)}
                  className={`${ui.btn.view} flex items-center gap-1`}
                  title="Dismiss this gap"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination — visible only when backend returns more than one page */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gov-blue disabled:opacity-40">
              <ChevronLeft size={13} /> Prev
            </button>
            <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gov-blue disabled:opacity-40">
              Next <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Dismiss confirm */}
      <ConfirmModal
        open={!!dismissTarget}
        title="Dismiss Content Gap"
        message={`Dismiss "${contentGaps.find(g => g.id === dismissTarget)?.query}"? It won't appear in the list anymore.`}
        onConfirm={handleDismiss}
        onCancel={() => setDismissTarget(null)}
      />
    </div>
  );
}
