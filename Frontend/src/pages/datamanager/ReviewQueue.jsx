import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, XCircle, Eye, Edit3, FileWarning,
  ArrowLeft, AlertTriangle, X, Search, ChevronLeft, ChevronRight,
  Download, CheckSquare, Square, CheckCircle2, ExternalLink,
  Folder, FolderOpen, ChevronDown, FileText
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useDataManager } from '../../context/DataManagerContext';
import { BackNavigation } from '../../components/common';
import * as ui from '../../styles/datamanager/DataManagerUI';
import { CATEGORY_OPTIONS, DEPARTMENTS, MINISTRIES } from './shared';

const PAGE_SIZE = 8;

const SCHEME_CATEGORIES = ['Agriculture', 'Health', 'Housing', 'Education', 'Finance', 'Energy'];
const EDUCATION_LEVELS = ['Pre-Matric', 'Post-Matric', 'Higher Education', 'Overseas'];

// ── Validation Helper for Dynamic Mandatory Fields ─────────────────────────
function getMissingMandatoryFields(item) {
  const missing = [];
  const m = item.metadata || item;
  const type = item.type || m.documentType || 'Circular';

  if (!item.title?.trim() && !m.title?.trim()) missing.push('Document Title');
  if (!item.department?.trim() && !m.department?.trim() && !m.departmentName?.trim()) missing.push('Department');

  if (type === 'Scheme') {
    if (!item.benefit?.trim() && !m.benefit?.trim()) missing.push('Benefits / Assistance');
    if (!item.category?.trim() && !m.category?.trim()) missing.push('Sector Category');
  } else if (type === 'Scholarship') {
    if (!item.benefit?.trim() && !m.benefit?.trim()) missing.push('Scholarship Amount');
    if (!m.educationLevel?.trim()) missing.push('Education Level');
  } else if (type === 'Circular') {
    if (!m.circularNumber?.trim()) missing.push('Circular / Memo Number');
    if (!m.issueDate?.trim() && !item.uploadDate) missing.push('Issue Date');
  } else if (type === 'GO' || type === 'Government Order (GO)') {
    if (!m.goNumber?.trim()) missing.push('GO Number');
    if (!m.issueDate?.trim() && !item.uploadDate) missing.push('Issue Date');
  } else if (type === 'Notification') {
    if (!m.notificationNumber?.trim()) missing.push('Gazette / Notification Number');
    if (!m.issueDate?.trim() && !item.uploadDate) missing.push('Notification Date');
  } else if (type === 'Act / Rule') {
    if (!m.actNumber?.trim()) missing.push('Act Number');
    if (!m.actYear) missing.push('Year of Enactment');
  }

  return missing;
}



// ── Confirm Modal ──────────────────────────────────────────────────────────
function ConfirmModal({ open, title, message, confirmLabel, onConfirm, onCancel, danger = true }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${danger ? 'bg-red-50' : 'bg-green-50'}`}>
            <AlertTriangle size={18} className={danger ? 'text-red-500' : 'text-green-600'} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}>
            {confirmLabel || 'Confirm'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Dynamic Preview & Document Inspection Modal ────────────────────────────
function PreviewModal({ item, onClose, onEdit }) {
  if (!item) return null;
  const m = item.metadata || item;
  const missing = getMissingMandatoryFields(item);
  const type = item.type || m.documentType || 'Circular';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <Eye size={18} className="text-gov-blue" />
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Document & Metadata Review</h3>
              <p className="text-[11px] text-gray-400 truncate max-w-md">{item.fileName || item.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto space-y-4 text-xs">
          {/* Missing Field Alert */}
          {missing.length > 0 ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-red-800">Cannot Approve — Missing {missing.length} Mandatory Field(s)</h4>
                <p className="text-red-700 text-[11px] mt-0.5">Please fill the following required details before approving:</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {missing.map(f => (
                    <span key={f} className="bg-red-100/80 text-red-800 border border-red-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-600" />
                <span className="font-bold text-green-800">All Mandatory Fields Complete</span>
              </div>
              <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Ready to Approve</span>
            </div>
          )}

          {/* Core Info */}
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={ui.badge('blue')}>{type}</span>
              <span className={ui.badge('gray')}>{item.source || 'Uploaded Document'}</span>
              <span className="text-[11px] text-gray-400 ml-auto">Uploaded: {item.uploadDate || 'Recent'}</span>
            </div>
            <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
            <p className="text-gray-600 leading-relaxed">{item.description || item.reason || 'No description provided.'}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-gray-400 font-medium">Department</p>
              <p className="font-bold text-gray-800 text-xs mt-0.5">
                {item.department || <span className="text-red-500 font-semibold">Missing</span>}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-gray-400 font-medium">Submitted By</p>
              <p className="font-bold text-gray-800 text-xs mt-0.5 truncate" title={item.createdBy || 'Data Manager'}>
                {item.createdBy || 'Data Manager'}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-gray-400 font-medium">Original Document File</p>
              {item.fileName ? (
                <a
                  href={`http://localhost:8082/api/documents/download/${item.fileName}?token=${localStorage.getItem('infoseva_access_token') || localStorage.getItem('token') || ''}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-gov-blue text-xs mt-0.5 inline-flex items-center gap-1 hover:underline truncate block"
                >
                  <Download size={12} /> {item.fileName} <ExternalLink size={11} />
                </a>
              ) : (
                <p className="font-medium text-gray-400 text-xs mt-0.5">PDF in storage</p>
              )}
            </div>
          </div>

          {/* Dynamic properties */}
          <div className="p-3 bg-gray-50 rounded-xl space-y-1.5">
            <h5 className="font-bold text-gray-700 text-xs">Field Properties ({type})</h5>
            {type === 'Circular' && (
              <div className="grid grid-cols-2 gap-2 text-gray-700">
                <p><strong>Circular No:</strong> {m.circularNumber || <span className="text-red-500 font-semibold">Missing</span>}</p>
                <p><strong>Target Audience:</strong> {m.targetAudience || '—'}</p>
              </div>
            )}
            {(type === 'GO' || type === 'Government Order (GO)') && (
              <div className="grid grid-cols-2 gap-2 text-gray-700">
                <p><strong>GO Number:</strong> {m.goNumber || <span className="text-red-500 font-semibold">Missing</span>}</p>
                <p><strong>Issue Date:</strong> {m.issueDate || item.uploadDate || '—'}</p>
              </div>
            )}
            {type === 'Notification' && (
              <div className="grid grid-cols-2 gap-2 text-gray-700">
                <p><strong>Gazette No:</strong> {m.notificationNumber || <span className="text-red-500 font-semibold">Missing</span>}</p>
                <p><strong>Date:</strong> {m.issueDate || item.uploadDate || '—'}</p>
              </div>
            )}
            {type === 'Act / Rule' && (
              <div className="grid grid-cols-2 gap-2 text-gray-700">
                <p><strong>Act Number:</strong> {m.actNumber || <span className="text-red-500 font-semibold">Missing</span>}</p>
                <p><strong>Year of Enactment:</strong> {m.actYear || <span className="text-red-500 font-semibold">Missing</span>}</p>
              </div>
            )}
            {(type === 'Scheme' || type === 'Scholarship') && (
              <div className="space-y-1 text-gray-700">
                <p><strong>Benefits / Grant:</strong> {item.benefit || m.benefit || <span className="text-red-500 font-semibold">Missing</span>}</p>
                {m.eligibility && <p><strong>Eligibility:</strong> {m.eligibility}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs font-semibold text-gray-600 border rounded-lg hover:bg-gray-100">
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(item.id);
            }}
            className="btn-primary text-xs px-4 py-1.5 font-semibold flex items-center gap-1"
          >
            <Edit3 size={12} /> Edit Document Details
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Dynamic Inline Edit Form Matching Document Type ────────────────────────
function EditInline({ item, onSave, onCancel }) {
  const m = item.metadata || item;
  const docType = item.type || m.documentType || 'Circular';

  const [form, setForm] = useState({
    title: item.title || m.title || '',
    type: docType,
    department: item.department || m.department || m.departmentName || '',
    ministry: m.ministry || '',
    description: item.description || m.description || '',
    category: item.category || m.category || (docType === 'Scheme' ? 'Agriculture' : docType === 'Scholarship' ? 'Education' : docType),
    benefit: item.benefit || m.benefit || '',
    beneficiaries: m.beneficiaries || '',
    eligibility: m.eligibility || '',
    educationLevel: m.educationLevel || 'Higher Education',
    applicationDeadline: m.applicationDeadline || '',
    goNumber: m.goNumber || '',
    circularNumber: m.circularNumber || '',
    notificationNumber: m.notificationNumber || '',
    actNumber: m.actNumber || '',
    actYear: m.actYear || '',
    issueDate: m.issueDate || item.uploadDate || '',
    targetAudience: m.targetAudience || ''
  });

  const handleChange = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required.');
      return;
    }
    if (!form.department.trim()) {
      toast.error('Please select a Department.');
      return;
    }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 py-3 bg-white p-4 rounded-xl border border-blue-100 shadow-sm text-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <h4 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
          <Edit3 size={14} className="text-gov-blue" /> Edit {docType} Fields & Complete Metadata
        </h4>
        <span className={ui.badge('blue')}>{docType}</span>
      </div>

      <div>
        <label className="font-semibold text-gray-700 mb-1 block">Document Title *</label>
        <input className={ui.input} value={form.title} onChange={e => handleChange('title', e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-semibold text-gray-700 mb-1 block">Ministry</label>
          <select className={ui.input} value={form.ministry} onChange={e => handleChange('ministry', e.target.value)}>
            <option value="">Select Ministry...</option>
            {MINISTRIES.map(min => <option key={min}>{min}</option>)}
          </select>
        </div>
        <div>
          <label className="font-semibold text-gray-700 mb-1 block">Department *</label>
          <select
            className={`${ui.input} ${!form.department ? 'border-red-400 bg-red-50/20' : ''}`}
            value={form.department}
            onChange={e => handleChange('department', e.target.value)}
            required
          >
            <option value="">Select Department...</option>
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {docType === 'Scheme' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-gray-700 mb-1 block">Sector Category *</label>
            <select className={ui.input} value={form.category} onChange={e => handleChange('category', e.target.value)}>
              {SCHEME_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="font-semibold text-gray-700 mb-1 block">Benefits / Assistance *</label>
            <input className={ui.input} value={form.benefit} onChange={e => handleChange('benefit', e.target.value)} required placeholder="e.g. Financial grant" />
          </div>
        </div>
      )}

      {docType === 'Scholarship' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-gray-700 mb-1 block">Education Level *</label>
            <select className={ui.input} value={form.educationLevel} onChange={e => handleChange('educationLevel', e.target.value)}>
              {EDUCATION_LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="font-semibold text-gray-700 mb-1 block">Scholarship Amount *</label>
            <input className={ui.input} value={form.benefit} onChange={e => handleChange('benefit', e.target.value)} required placeholder="e.g. Rs 20,000 / year" />
          </div>
        </div>
      )}

      {docType === 'Circular' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-gray-700 mb-1 block">Circular Number *</label>
            <input className={ui.input} value={form.circularNumber} onChange={e => handleChange('circularNumber', e.target.value)} required placeholder="e.g. CIR-2026/04" />
          </div>
          <div>
            <label className="font-semibold text-gray-700 mb-1 block">Target Audience</label>
            <input className={ui.input} value={form.targetAudience} onChange={e => handleChange('targetAudience', e.target.value)} placeholder="e.g. All District Officers" />
          </div>
        </div>
      )}

      {(docType === 'GO' || docType === 'Government Order (GO)') && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-gray-700 mb-1 block">GO Number *</label>
            <input className={ui.input} value={form.goNumber} onChange={e => handleChange('goNumber', e.target.value)} required placeholder="e.g. G.O.Ms.No. 12/2026" />
          </div>
          <div>
            <label className="font-semibold text-gray-700 mb-1 block">Issue Date *</label>
            <input type="date" className={ui.input} value={form.issueDate} onChange={e => handleChange('issueDate', e.target.value)} />
          </div>
        </div>
      )}

      {docType === 'Notification' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-gray-700 mb-1 block">Gazette / Notification Number *</label>
            <input className={ui.input} value={form.notificationNumber} onChange={e => handleChange('notificationNumber', e.target.value)} required />
          </div>
          <div>
            <label className="font-semibold text-gray-700 mb-1 block">Notification Date</label>
            <input type="date" className={ui.input} value={form.issueDate} onChange={e => handleChange('issueDate', e.target.value)} />
          </div>
        </div>
      )}

      {docType === 'Act / Rule' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-gray-700 mb-1 block">Act Number *</label>
            <input className={ui.input} value={form.actNumber} onChange={e => handleChange('actNumber', e.target.value)} required placeholder="e.g. Act 12 of 2024" />
          </div>
          <div>
            <label className="font-semibold text-gray-700 mb-1 block">Year of Enactment *</label>
            <input className={ui.input} value={form.actYear} onChange={e => handleChange('actYear', e.target.value)} required placeholder="e.g. 2024" />
          </div>
        </div>
      )}

      <div>
        <label className="font-semibold text-gray-700 mb-1 block">Description / Details</label>
        <textarea rows={2} className={ui.input} value={form.description} onChange={e => handleChange('description', e.target.value)} />
      </div>

      <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs font-semibold text-gray-600 border rounded-lg hover:bg-gray-50">Cancel</button>
        <button type="submit" className="btn-primary text-xs px-4 py-1.5 font-semibold">Save Changes</button>
      </div>
    </form>
  );
}

// ── Main Review Queue Page ──────────────────────────────────────────────────
export function ReviewQueue({ readOnly = false }) {
  const { approveReviewItem, rejectReviewItem, editReviewItem, bulkApproveItems, bulkRejectItems } = useDataManager();
  const navigate = useNavigate();

  // Fetch review queue directly from backend — bypasses context loading issues
  const [liveQueue, setLiveQueue] = useState([]);
  const [queueLoading, setQueueLoading] = useState(true);

  const fetchLiveQueue = useCallback(async () => {
    try {
      const token = localStorage.getItem('infoseva_access_token') || localStorage.getItem('token') || sessionStorage.getItem('jwt_token') || '';
      if (!token) return;
      const res = await fetch('http://localhost:8082/api/documents/review-queue?page=0&size=200', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      const content = data.data?.content || [];
      setLiveQueue(content.map(d => ({
        id: d.documentId,
        title: d.title,
        type: d.documentType || d.category || 'Circular',
        department: d.departmentName || '',
        fileName: d.fileName || '',
        description: d.description || '',
        source: 'Single Upload',
        confidence: 90,
        flagType: 'Review Required',
        uploadDate: d.uploadDate || '',
        reason: d.description || 'Awaiting human review',
        batchName: null,
        batchId: null,
        isBulk: false,
        benefit: d.benefit || '',
        category: d.category || '',
        createdBy: d.createdBy || 'Data Manager',
        approvedBy: d.approvedBy || null,
        publishedBy: d.approvedBy || d.createdBy || 'Data Manager',
        metadata: {
          ...d,
          title: d.title,
          department: d.departmentName,
          departmentName: d.departmentName,
          category: d.category,
          documentType: d.documentType || d.category,
          benefit: d.benefit,
          educationLevel: d.educationLevel,
          circularNumber: d.circularNumber,
          goNumber: d.goNumber,
          notificationNumber: d.notificationNumber,
          actNumber: d.actNumber,
          actYear: d.actYear,
          issueDate: d.issueDate,
          targetAudience: d.targetAudience,
        }
      })));
    } catch (e) {
      console.error('Failed to fetch review queue:', e);
    } finally {
      setQueueLoading(false);
    }
  }, []);

  useEffect(() => { fetchLiveQueue(); }, [fetchLiveQueue]);

  // Use liveQueue as the source of truth
  const reviewQueue = liveQueue;

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterConf, setFilterConf] = useState('All');
  const [filterDept, setFilterDept] = useState('All');
  const [sortBy, setSortBy] = useState('date-desc');
  const [page, setPage] = useState(1);

  const [previewItem, setPreviewItem] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [selected, setSelected] = useState(new Set());

  // Confirm modals
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [bulkAction, setBulkAction] = useState(null);
  const [selectedBatchTab, setSelectedBatchTab] = useState('All'); // 'All' | 'Individual' | 'Batches'
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('all');
  const [expandedBatches, setExpandedBatches] = useState(new Set(['all']));


  const toggleBatchExpand = (batchKey) => {
    setExpandedBatches(prev => {
      const next = new Set(prev);
      if (next.has(batchKey)) next.delete(batchKey);
      else next.add(batchKey);
      return next;
    });
  };

  // Group review queue items into Batches vs Individual items
  const { batchGroups, individualItems, batchSummaries } = useMemo(() => {
    const bMap = new Map();
    const ind = [];

    reviewQueue.forEach(item => {
      if (item.batchName) {
        const bKey = item.batchName;
        if (!bMap.has(bKey)) {
          bMap.set(bKey, {
            batchName: item.batchName,
            batchId: item.batchId,
            items: []
          });
        }
        bMap.get(bKey).items.push(item);
      } else {
        ind.push(item);
      }
    });

    const summaries = Array.from(bMap.values()).map(g => ({
      batchName: g.batchName,
      batchId: g.batchId,
      total: g.items.length,
      missingCount: g.items.filter(i => getMissingMandatoryFields(i).length > 0).length
    }));

    return {
      batchGroups: Array.from(bMap.values()),
      individualItems: ind,
      batchSummaries: summaries
    };
  }, [reviewQueue]);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = reviewQueue.filter(item => {
      const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.department?.toLowerCase().includes(search.toLowerCase()) ||
        (item.batchName && item.batchName.toLowerCase().includes(search.toLowerCase()));
      const matchType = filterType === 'All' || item.type === filterType;
      const matchConf =
        filterConf === 'All' ? true :
        filterConf === 'Low' ? item.confidence < 55 :
        filterConf === 'Medium' ? item.confidence >= 55 && item.confidence < 80 : true;
      const matchDept = filterDept === 'All' || item.department === filterDept;
      
      // Ingestion View filter (All vs Individual vs Batch)
      const matchIngestionTab =
        selectedBatchTab === 'All' ? true :
        selectedBatchTab === 'Individual' ? !item.batchName :
        selectedBatchTab === 'Batches' ? (selectedBatchFilter === 'all' ? !!item.batchName : item.batchName === selectedBatchFilter) : true;

      return matchSearch && matchType && matchConf && matchDept && matchIngestionTab;
    });

    if (sortBy === 'conf-asc') list = list.sort((a, b) => a.confidence - b.confidence);
    else if (sortBy === 'conf-desc') list = list.sort((a, b) => b.confidence - a.confidence);
    else if (sortBy === 'date-desc') list = list.sort((a, b) => (b.uploadDate || '').localeCompare(a.uploadDate || ''));
    else if (sortBy === 'title-asc') list = list.sort((a, b) => a.title.localeCompare(b.title));

    return list;
  }, [reviewQueue, search, filterType, filterConf, filterDept, sortBy, selectedBatchTab, selectedBatchFilter]);


  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pagedIds = new Set(paged.map(i => i.id));

  // Selection helpers
  const toggleSelect = (id) => {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };
  const toggleAll = () => {
    if ([...pagedIds].every(id => selected.has(id))) {
      setSelected(prev => { const s = new Set(prev); pagedIds.forEach(id => s.delete(id)); return s; });
    } else {
      setSelected(prev => { const s = new Set(prev); pagedIds.forEach(id => s.add(id)); return s; });
    }
  };
  const allPageSelected = paged.length > 0 && [...pagedIds].every(id => selected.has(id));

  // Approval Guard: Check mandatory fields before approving
  const handleApproveAttempt = (item) => {
    const missing = getMissingMandatoryFields(item);
    if (missing.length > 0) {
      toast.error(`Cannot approve document: Missing mandatory field(s): ${missing.join(', ')}. Please edit and complete them first.`);
      setEditingId(item.id);
      return;
    }
    setApproveTarget(item.id);
  };

  const handleApprove = async (id) => {
    const success = await approveReviewItem(id);
    if (success) { toast.success('Document approved and published!'); fetchLiveQueue(); }
    else toast.error('Failed to approve document.');
  };

  const handleReject = async (id) => {
    const success = await rejectReviewItem(id);
    if (success) { toast.success('Document rejected and removed from queue.'); fetchLiveQueue(); }
    else toast.error('Failed to reject document.');
  };

  const handleEdit = (id, form) => {
    editReviewItem(id, form);
    setEditingId(null);
    toast.success('Document metadata updated.');
  };

  const handleBulkApproveAttempt = () => {
    const selectedItems = reviewQueue.filter(i => selected.has(i.id));
    const invalidItems = selectedItems.filter(i => getMissingMandatoryFields(i).length > 0);

    if (invalidItems.length > 0) {
      toast.error(`Cannot bulk approve: ${invalidItems.length} document(s) have missing mandatory fields. Please inspect and edit them first.`);
      return;
    }
    setBulkAction('approve');
  };

  const handleBulkApprove = () => {
    bulkApproveItems([...selected]);
    toast.success(`${selected.size} document${selected.size > 1 ? 's' : ''} approved.`);
    setSelected(new Set());
    setBulkAction(null);
  };

  const handleBulkReject = () => {
    bulkRejectItems([...selected]);
    toast.error(`${selected.size} document${selected.size > 1 ? 's' : ''} rejected.`);
    setSelected(new Set());
    setBulkAction(null);
  };

  const uniqueTypes = ['All', ...new Set(reviewQueue.map(i => i.type))];
  const uniqueDepts = ['All', ...new Set(reviewQueue.map(i => i.department).filter(Boolean))];

  // Helper to render individual review queue item row
  const renderItemRow = (item) => {
    const missing = getMissingMandatoryFields(item);
    return (
      <motion.div key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
        className={`px-5 py-4 transition-colors ${selected.has(item.id) ? 'bg-gov-blue-50/30' : 'hover:bg-gray-50'}`}>
        {editingId === item.id ? (
          <EditInline item={item} onSave={(form) => handleEdit(item.id, form)} onCancel={() => setEditingId(null)} />
        ) : (
          <div className="flex items-start gap-4">
            {/* Checkbox */}
            <button onClick={() => toggleSelect(item.id)} className="mt-1 text-gray-400 hover:text-gov-blue flex-shrink-0">
              {selected.has(item.id) ? <CheckSquare size={16} className="text-gov-blue" /> : <Square size={16} />}
            </button>

            {/* Icon */}
            <div className={`${ui.iconChip(missing.length > 0 ? 'red' : item.confidence < 80 ? 'yellow' : 'green', 'w-9 h-9')} flex-shrink-0`}>
              <FileWarning size={16} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-gray-900">{item.title}</p>
                <span className="text-xs text-gray-400">·</span>
                <span className={ui.badge('blue')}>{item.type}</span>
                <span className={ui.badge(item.batchName ? 'purple' : 'gray')}>
                  {item.batchName ? `Batch: ${item.batchName}` : 'Single Upload'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                {item.department ? <span className="text-gray-600 font-semibold">{item.department} · </span> : <span className="text-red-500 font-bold">Needs Department · </span>}
                <span>{item.flagType} · {item.uploadDate}</span>
                <span className="font-medium text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded text-[11px]">
                  Submitted by: {item.createdBy || 'Data Manager'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">{item.reason}</p>

              {/* Missing Mandatory Fields notification badge if any */}
              {missing.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 font-semibold">
                  <AlertTriangle size={13} className="text-red-500" />
                  <span>Missing required fields: {missing.join(', ')}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
              <button onClick={() => setPreviewItem(item)} className={`${ui.btn.view} flex items-center gap-1`}>
                <Eye size={12} /> Inspect
              </button>
              {!readOnly && (
                <>
                  <button onClick={() => setEditingId(item.id)} className={`${ui.btn.edit} flex items-center gap-1`}>
                    <Edit3 size={12} /> Edit
                  </button>
                  <button
                    onClick={() => {
                      if (item.fileName) {
                        const token = localStorage.getItem('infoseva_access_token') || localStorage.getItem('token') || '';
                        const url = `http://localhost:8082/api/documents/download/${item.fileName}?token=${token}`;
                        window.open(url, '_blank');
                        toast.success(`Opening "${item.title}"`);
                      } else {
                        toast('Document file is accessible in database storage', { icon: 'ℹ️' });
                      }
                    }}
                    className={`${ui.btn.view} flex items-center gap-1`}
                    title="Access Original Uploaded PDF"
                  >
                    <Download size={12} />
                  </button>

                  <button onClick={() => handleApproveAttempt(item)} className={`${ui.btn.approve} flex items-center gap-1`}>
                    <Check size={12} /> Approve
                  </button>
                  <button onClick={() => setRejectTarget(item.id)} className={`${ui.btn.reject} flex items-center gap-1`}>
                    <XCircle size={12} /> Reject
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Dual Back Navigation */}
      <BackNavigation
        dashboardPath={readOnly ? '/admin/dashboard' : '/datamanager'}
        dashboardLabel={readOnly ? 'Back to Admin Dashboard' : 'Back to Dashboard'}
      />

      {/* Ingestion Source Tabs (All / Individual Single Upload / Bulk Batches) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => { setSelectedBatchTab('All'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedBatchTab === 'All'
                ? 'bg-white text-gov-blue shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            All Queue ({reviewQueue.length})
          </button>
          <button
            type="button"
            onClick={() => { setSelectedBatchTab('Individual'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedBatchTab === 'Individual'
                ? 'bg-white text-gov-blue shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Individual Single Uploads ({individualItems.length})
          </button>
          <button
            type="button"
            onClick={() => { setSelectedBatchTab('Batches'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedBatchTab === 'Batches'
                ? 'bg-white text-gov-blue shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Bulk Upload Batches ({batchGroups.reduce((acc, g) => acc + g.items.length, 0)})
          </button>
        </div>

        {selectedBatchTab === 'Batches' && batchSummaries.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Filter Batch:</span>
            <button
              type="button"
              onClick={() => setSelectedBatchFilter('all')}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedBatchFilter === 'all' ? 'bg-gov-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Batches ({batchSummaries.length})
            </button>
            {batchSummaries.map(s => (
              <button
                key={s.batchName}
                type="button"
                onClick={() => setSelectedBatchFilter(s.batchName)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedBatchFilter === s.batchName ? 'bg-gov-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s.batchName} ({s.total})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter toolbar */}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className={`${ui.input} pl-8 text-xs`} placeholder="Search by title or department..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className={`${ui.input} w-auto`} value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}>
          {uniqueTypes.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className={`${ui.input} w-auto`} value={filterConf} onChange={e => { setFilterConf(e.target.value); setPage(1); }}>
          <option value="All">All Quality Status</option>
          <option value="Low">Critical Review Needed</option>
          <option value="Medium">Needs Verification</option>
        </select>
        <select className={`${ui.input} w-auto`} value={filterDept} onChange={e => { setFilterDept(e.target.value); setPage(1); }}>
          {uniqueDepts.map(d => <option key={d}>{d}</option>)}
        </select>
        <select className={`${ui.input} w-auto`} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="date-desc">Newest First</option>
          <option value="conf-asc">Confidence ↑</option>
          <option value="conf-desc">Confidence ↓</option>
          <option value="title-asc">Title A–Z</option>
        </select>
      </div>

      {/* Bulk action bar */}
      {!readOnly && selected.size > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 bg-gov-blue-50 border border-gov-blue-100 rounded-xl">
          <span className="text-sm font-semibold text-gov-blue">{selected.size} selected</span>
          <div className="flex-1" />
          <button onClick={handleBulkApproveAttempt} className={ui.btn.approve}>
            <Check size={13} /> Approve All
          </button>
          <button onClick={() => setBulkAction('reject')} className={ui.btn.reject}>
            <XCircle size={13} /> Reject All
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-gray-500 hover:text-gray-700">
            <X size={14} />
          </button>
        </motion.div>
      )}

      {/* Table */}
      <div className={ui.cardOverflow}>
        <div className="flex items-center gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50">
          <button onClick={toggleAll} className="text-gray-400 hover:text-gov-blue">
            {allPageSelected ? <CheckSquare size={16} className="text-gov-blue" /> : <Square size={16} />}
          </button>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex-1">
            {filtered.length} item{filtered.length !== 1 ? 's' : ''}{search && ` matching "${search}"`}
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {queueLoading && paged.length === 0 && (
            <div className="py-14 text-center">
              <div className="w-8 h-8 border-2 border-gov-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-400">Loading review queue…</p>
            </div>
          )}
          {!queueLoading && paged.length === 0 && (
            <div className="py-14 text-center">
              <CheckCircle2 size={36} className="text-green-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-400">No items in queue!</p>
              <p className="text-xs text-gray-300 mt-0.5">
                {search || filterType !== 'All' || filterConf !== 'All'
                  ? 'Try adjusting your filters.'
                  : 'All content has been reviewed.'}
              </p>
            </div>
          )}

          {/* Grouped Display by Folder / Batch Structure */}
          {(() => {
            // Group paged items by Batch vs Individual
            const pagedBatches = new Map();
            const pagedIndividuals = [];

            paged.forEach(item => {
              if (item.batchName) {
                if (!pagedBatches.has(item.batchName)) {
                  pagedBatches.set(item.batchName, []);
                }
                pagedBatches.get(item.batchName).push(item);
              } else {
                pagedIndividuals.push(item);
              }
            });

            return (
              <div className="divide-y divide-gray-100">
                {/* 1. Folders for Bulk Batches */}
                {Array.from(pagedBatches.entries()).map(([bName, bItems]) => {
                  const isExpanded = expandedBatches.has(bName) || expandedBatches.has('all');
                  const batchSelected = bItems.every(i => selected.has(i.id));

                  return (
                    <div key={bName} className="bg-white">
                      {/* Folder Header Bar */}
                      <div className="px-5 py-3 bg-gradient-to-r from-blue-50/70 to-indigo-50/30 border-y border-blue-100/60 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (batchSelected) {
                                setSelected(prev => { const s = new Set(prev); bItems.forEach(i => s.delete(i.id)); return s; });
                              } else {
                                setSelected(prev => { const s = new Set(prev); bItems.forEach(i => s.add(i.id)); return s; });
                              }
                            }}
                            className="text-gray-400 hover:text-gov-blue"
                          >
                            {batchSelected ? <CheckSquare size={16} className="text-gov-blue" /> : <Square size={16} />}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => toggleBatchExpand(bName)}
                            className="flex items-center gap-2 text-left hover:text-gov-blue transition-colors"
                          >
                            {isExpanded ? <FolderOpen size={17} className="text-gov-blue" /> : <Folder size={17} className="text-gov-blue" />}
                            <span className="text-xs font-bold text-gray-900">{bName}</span>
                            <span className="text-[11px] font-semibold bg-white/80 text-gov-blue px-2 py-0.5 rounded-full border border-blue-100">
                              {bItems.length} document{bItems.length > 1 ? 's' : ''} in batch
                            </span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleBatchExpand(bName)}
                          className="text-xs font-semibold text-gray-500 hover:text-gov-blue flex items-center gap-1"
                        >
                          {isExpanded ? 'Collapse Folder' : 'Expand Folder'}
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      </div>

                      {/* Folder Contents (Documents) */}
                      {isExpanded && (
                        <div className="divide-y divide-gray-50 bg-gray-50/20 pl-4 border-l-2 border-l-gov-blue">
                          {bItems.map(item => renderItemRow(item))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 2. Folder for Individual Single Uploads */}
                {pagedIndividuals.length > 0 && (
                  <div className="bg-white">
                    {pagedBatches.size > 0 && (
                      <div className="px-5 py-3 bg-gray-50/80 border-y border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-gray-600" />
                          <span className="text-xs font-bold text-gray-800">Individual Direct Uploads</span>
                          <span className="text-[11px] font-semibold bg-white text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                            {pagedIndividuals.length} document{pagedIndividuals.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="divide-y divide-gray-50">
                      {pagedIndividuals.map(item => renderItemRow(item))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>


        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gov-blue disabled:opacity-40">
              <ChevronLeft size={13} /> Prev
            </button>
            <span className="text-xs text-gray-400">Page {page} of {totalPages} · {filtered.length} items</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gov-blue disabled:opacity-40">
              Next <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {previewItem && (
          <PreviewModal
            item={previewItem}
            onClose={() => setPreviewItem(null)}
            onEdit={(id) => {
              setPreviewItem(null);
              setEditingId(id);
            }}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        open={!!approveTarget}
        title="Approve Document"
        message={`Are you sure you want to approve "${reviewQueue.find(i => i.id === approveTarget)?.title}"? It will be published immediately to Citizen pages.`}
        confirmLabel="Approve & Publish"
        danger={false}
        onConfirm={() => { handleApprove(approveTarget); setApproveTarget(null); }}
        onCancel={() => setApproveTarget(null)}
      />
      <ConfirmModal
        open={!!rejectTarget}
        title="Reject Document"
        message={`Are you sure you want to reject "${reviewQueue.find(i => i.id === rejectTarget)?.title}"? It will be removed from the queue.`}
        confirmLabel="Reject"
        onConfirm={() => { handleReject(rejectTarget); setRejectTarget(null); }}
        onCancel={() => setRejectTarget(null)}
      />
      <ConfirmModal
        open={bulkAction === 'approve'}
        title="Bulk Approve"
        message={`Approve ${selected.size} selected document${selected.size > 1 ? 's' : ''}? They will be published immediately.`}
        confirmLabel="Approve All"
        danger={false}
        onConfirm={handleBulkApprove}
        onCancel={() => setBulkAction(null)}
      />
      <ConfirmModal
        open={bulkAction === 'reject'}
        title="Bulk Reject"
        message={`Reject ${selected.size} selected document${selected.size > 1 ? 's' : ''}? They will be permanently removed from the queue.`}
        confirmLabel="Reject All"
        onConfirm={handleBulkReject}
        onCancel={() => setBulkAction(null)}
      />
    </div>
  );
}
