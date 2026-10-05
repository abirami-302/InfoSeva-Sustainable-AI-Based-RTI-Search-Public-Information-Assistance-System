import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileEdit, Eye, Trash2, Send, Download, Search, X,
  ExternalLink, FileText, AlertTriangle,
  Calendar, Building2, Plus, RefreshCw, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as ui from '../../styles/datamanager/DataManagerUI';
import { BackNavigation } from '../../components/common';
import { CATEGORY_OPTIONS } from './shared';

const PAGE_SIZE = 10;
const BASE_URL = 'http://localhost:8082/api';

// ── Preview Modal ─────────────────────────────────────────────────────────────
function DraftPreviewModal({ item, onClose, onSubmit, onDelete }) {
  if (!item) return null;
  const token = localStorage.getItem('infoseva_access_token') || localStorage.getItem('token') || '';
  const fileUrl = item.fileName ? `${BASE_URL}/documents/download/${item.fileName}?token=${token}` : null;
  const docType = item.documentType || item.category || 'Document';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-3">
            <div className={ui.iconChip('blue', 'w-10 h-10')}>
              <FileEdit size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-sm max-w-md truncate">{item.title}</h3>
                <span className={ui.badge('blue')}>{docType}</span>
                <span className={ui.badge('yellow')}>Draft</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                <span>{item.departmentName || item.department || 'General Administration'}</span>
                <span>·</span>
                <span>Saved: {item.uploadDate || item.createdAt?.substring(0, 10) || 'Recent'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {item.fileName && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                title="Open PDF"
              >
                <Download size={13} /> Open PDF <ExternalLink size={11} />
              </a>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid sm:grid-cols-3 gap-3 bg-gray-50/70 p-4 rounded-xl border border-gray-100 text-xs">
            <div>
              <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Category</p>
              <p className="font-bold text-gray-800 mt-0.5">{item.category || 'General'}</p>
            </div>
            <div>
              <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Department</p>
              <p className="font-bold text-gray-800 mt-0.5">{item.departmentName || item.department || '—'}</p>
            </div>
            <div>
              <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Creator</p>
              <p className="font-bold text-gray-800 mt-0.5">{item.createdBy || 'You'}</p>
            </div>
          </div>

          {item.description && (
            <div>
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Description / Summary</h4>
              <p className="text-xs text-gray-600 leading-relaxed bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                {item.description}
              </p>
            </div>
          )}

          {item.fileName && (
            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-gov-blue flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">{item.fileName}</p>
                  <p className="text-[11px] text-gray-500">Click &quot;Open PDF&quot; at the top right to view in a new tab</p>
                </div>
              </div>
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 shrink-0"
              >
                <Download size={13} /> Open PDF <ExternalLink size={11} />
              </a>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={() => onDelete(item)}
            className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Trash2 size={14} /> Delete Draft
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="btn-secondary text-xs px-4 py-2">
              Close
            </button>
            <button
              onClick={() => onSubmit(item)}
              className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
            >
              <Send size={14} /> Submit to Review Queue
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────
export default function MyDrafts() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals state
  const [previewItem, setPreviewItem] = useState(null);
  const [confirmSubmitItem, setConfirmSubmitItem] = useState(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDrafts = async (pageIndex = 0) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('infoseva_access_token') || localStorage.getItem('token') || sessionStorage.getItem('jwt_token') || '';
      const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

      let draftsList = [];
      let totalP = 1;
      let totalI = 0;

      // 1. Try dedicated my-drafts endpoint
      try {
        const res = await fetch(`${BASE_URL}/documents/my-drafts?page=${pageIndex}&size=${PAGE_SIZE}`, {
          headers: authHeader
        });
        if (res.ok) {
          const data = await res.json();
          const pageData = data.data;
          if (pageData) {
            draftsList = pageData.content || (Array.isArray(pageData) ? pageData : []);
            totalP = pageData.totalPages || 1;
            totalI = pageData.totalElements || draftsList.length;
          }
        }
      } catch (err) {
        console.warn('my-drafts endpoint fetch failed, falling back:', err);
      }

      // 2. If empty or failed, fallback to main /documents repository filtered by DRAFT status
      if (draftsList.length === 0) {
        try {
          const resAll = await fetch(`${BASE_URL}/documents?size=100`, { headers: authHeader });
          if (resAll.ok) {
            const dataAll = await resAll.json();
            const allItems = dataAll.data?.content || (Array.isArray(dataAll.data) ? dataAll.data : []) || [];
            let currentUserEmail = '';
            try {
              const u = JSON.parse(localStorage.getItem('infoseva_user') || '{}');
              currentUserEmail = u.email || '';
            } catch (e) {}

            const filtered = allItems.filter(d => {
              const isDraft = d.reviewStatus === 'DRAFT' || d.status === 'DRAFT';
              if (!isDraft) return false;
              if (currentUserEmail && d.createdBy) {
                return d.createdBy.toLowerCase() === currentUserEmail.toLowerCase();
              }
              return true;
            });

            if (filtered.length > 0) {
              draftsList = filtered;
              totalP = Math.ceil(filtered.length / PAGE_SIZE) || 1;
              totalI = filtered.length;
            }
          }
        } catch (fallbackErr) {
          console.warn('Fallback draft fetch failed:', fallbackErr);
        }
      }

      setDrafts(draftsList);
      setTotalPages(totalP);
      setTotalItems(totalI);
      setPage(pageIndex);
    } catch (err) {
      console.error('Error in fetchDrafts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts(0);
  }, []);

  const filteredDrafts = useMemo(() => {
    return drafts.filter(d => {
      const matchesSearch = !search.trim() ||
        (d.title && d.title.toLowerCase().includes(search.toLowerCase())) ||
        (d.description && d.description.toLowerCase().includes(search.toLowerCase())) ||
        (d.fileName && d.fileName.toLowerCase().includes(search.toLowerCase()));
      const matchesCat = categoryFilter === 'All' || d.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [drafts, search, categoryFilter]);

  // Handle Submit Draft
  const handleConfirmSubmit = async () => {
    if (!confirmSubmitItem) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('infoseva_access_token') || localStorage.getItem('token') || '';
      const res = await fetch(`${BASE_URL}/documents/${confirmSubmitItem.documentId}/submit-draft`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to submit draft');
      }
      toast.success(`"${confirmSubmitItem.title}" submitted to Review Queue!`);
      setConfirmSubmitItem(null);
      if (previewItem?.documentId === confirmSubmitItem.documentId) {
        setPreviewItem(null);
      }
      fetchDrafts(page);
    } catch (err) {
      toast.error(err.message || 'Error submitting draft');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Draft
  const handleConfirmDelete = async () => {
    if (!confirmDeleteItem) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('infoseva_access_token') || localStorage.getItem('token') || '';
      const res = await fetch(`${BASE_URL}/documents/${confirmDeleteItem.documentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete draft');
      toast.success('Draft deleted successfully');
      setConfirmDeleteItem(null);
      if (previewItem?.documentId === confirmDeleteItem.documentId) {
        setPreviewItem(null);
      }
      fetchDrafts(page);
    } catch (err) {
      toast.error(err.message || 'Error deleting draft');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dual Back Navigation */}
      <BackNavigation dashboardPath="/datamanager" />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2.5">
            <div className={ui.iconChip('blue', 'w-10 h-10')}>
              <FileEdit size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">My Drafts</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Private documents saved to your account. Edit, preview, submit for peer review, or delete.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchDrafts(page)}
            className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5"
            title="Refresh Drafts"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/datamanager/ingestion')}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={15} />
            New Document
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`${ui.cardPad4} flex items-center gap-3`}>
          <div className={ui.iconChip('blue')}>
            <FileEdit size={18} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Drafts</p>
            <p className="text-xl font-black text-gray-900">{totalItems}</p>
          </div>
        </div>
        <div className={`${ui.cardPad4} flex items-center gap-3`}>
          <div className={ui.iconChip('purple')}>
            <Building2 size={18} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Draft Categories</p>
            <p className="text-xl font-black text-gray-900">
              {new Set(drafts.map(d => d.category)).size}
            </p>
          </div>
        </div>
        <div className={`${ui.cardPad4} flex items-center gap-3`}>
          <div className={ui.iconChip('blue')}>
            <AlertTriangle size={18} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Access Scope</p>
            <p className="text-xs font-bold text-amber-700 mt-1">Creator-Only (Private)</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className={ui.cardPad4}>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search drafts by title, description, or filename..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10 text-xs w-full py-2"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="w-full sm:w-56">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="input-field text-xs py-2 w-full"
            >
              <option value="All">All Categories</option>
              {CATEGORY_OPTIONS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Drafts Table */}
      <div className={ui.cardOverflow}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Saved Date</th>
                <th className="py-3 px-4">Drafted By</th>
                <th className="py-3 px-4">File</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <RefreshCw className="animate-spin mx-auto mb-2" size={20} />
                    Loading drafts...
                  </td>
                </tr>
              ) : filteredDrafts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-14">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-gov-blue flex items-center justify-center mx-auto mb-3">
                      <FileEdit size={22} />
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm">No Draft Documents Found</h3>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                      {search || categoryFilter !== 'All'
                        ? 'No drafts match your current search or category filter.'
                        : 'Drafts you save during ingestion will appear here privately until you submit them for review.'}
                    </p>
                    {!search && categoryFilter === 'All' && (
                      <button
                        onClick={() => navigate('/datamanager/ingestion')}
                        className="btn-primary text-xs px-4 py-2 mt-4 inline-flex items-center gap-1.5"
                      >
                        <Plus size={14} /> Create Your First Draft
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredDrafts.map((d) => (
                  <tr
                    key={d.documentId}
                    className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                    onClick={() => setPreviewItem(d)}
                  >
                    <td className="py-3.5 px-4 font-bold text-gray-900 max-w-xs truncate">
                      {d.title}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={ui.badge('blue')}>{d.category || 'General'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 truncate max-w-[180px]">
                      {d.departmentName || d.department || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-gray-400" />
                        {d.uploadDate || d.createdAt?.substring(0, 10) || 'Recent'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap">
                      <span className="flex items-center gap-1 font-medium text-xs">
                        <User size={12} className="text-gray-400" />
                        <span className="truncate max-w-[130px]">{d.createdBy || 'Data Manager'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 truncate max-w-[140px]">
                      <span className="flex items-center gap-1">
                        <FileText size={12} className="text-gray-400 shrink-0" />
                        <span className="truncate">{d.fileName || 'No file'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={ui.badge('yellow')}>Draft</span>
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewItem(d)}
                          className="p-1.5 text-gray-500 hover:text-gov-blue hover:bg-blue-50 rounded-lg transition-colors"
                          title="Preview Draft"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => setConfirmSubmitItem(d)}
                          className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Submit for Review"
                        >
                          <Send size={15} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteItem(d)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Draft"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-xs text-gray-500 bg-gray-50/50">
            <span>
              Showing Page {page + 1} of {totalPages} ({totalItems} total drafts)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchDrafts(Math.max(0, page - 1))}
                disabled={page === 0}
                className="btn-secondary text-xs px-2.5 py-1 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => fetchDrafts(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="btn-secondary text-xs px-2.5 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewItem && (
          <DraftPreviewModal
            item={previewItem}
            onClose={() => setPreviewItem(null)}
            onSubmit={item => { setConfirmSubmitItem(item); }}
            onDelete={item => { setConfirmDeleteItem(item); }}
          />
        )}
      </AnimatePresence>

      {/* Confirm Submit Modal */}
      <AnimatePresence>
        {confirmSubmitItem && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden p-6 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 text-gov-blue flex items-center justify-center mx-auto">
                <Send size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Submit Draft for Review?</h3>
                <p className="text-xs text-gray-500 mt-1">
                  "{confirmSubmitItem.title}" will be submitted to the shared Review Queue.
                  Other Data Managers will be able to verify and approve it for public release.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setConfirmSubmitItem(null)}
                  disabled={actionLoading}
                  className="btn-secondary text-xs px-4 py-2 flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  disabled={actionLoading}
                  className="btn-primary text-xs px-4 py-2 flex-1 flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  Confirm Submit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {confirmDeleteItem && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden p-6 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Delete Draft Document?</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Are you sure you want to delete "{confirmDeleteItem.title}"? This draft will be removed from your account.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setConfirmDeleteItem(null)}
                  disabled={actionLoading}
                  className="btn-secondary text-xs px-4 py-2 flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={actionLoading}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 py-2 rounded-xl flex-1 flex items-center justify-center gap-1.5 transition-colors"
                >
                  {actionLoading ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
