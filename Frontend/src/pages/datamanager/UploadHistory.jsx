import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History, Upload, FolderInput, Wifi, Eye, Trash2, Download,
  Search, X, ArrowLeft, ChevronLeft, ChevronRight, AlertTriangle,
  ExternalLink, FileText, CheckCircle2, Building2, Calendar,
  Layers, Tag, Edit3,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useDataManager } from '../../context/DataManagerContext';
import { BackNavigation } from '../../components/common';
import * as ui from '../../styles/datamanager/DataManagerUI';
import { CATEGORY_OPTIONS, DEPARTMENTS, MINISTRIES } from './shared';

const PAGE_SIZE = 10;

// ── In-Context Preview Modal (Strictly within Data Manager module) ─────────────
function HistoryPreviewModal({ item, onClose, onEdit }) {
  if (!item) return null;
  const token = localStorage.getItem('infoseva_access_token') || localStorage.getItem('token') || '';
  const fileUrl = item.fileName ? `http://localhost:8082/api/documents/download/${item.fileName}?token=${token}` : null;
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
            <div className={ui.iconChip(item.status === 'Published' ? 'green' : item.status === 'In Review' ? 'blue' : 'red', 'w-10 h-10')}>
              <FileText size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-sm max-w-md truncate">{item.title}</h3>
                <span className={ui.badge('blue')}>{docType}</span>
                <span className={ui.badge(
                  item.status === 'Published' ? 'green' :
                  item.status === 'In Review' ? 'yellow' : 'red'
                )}>
                  {item.status || 'Active'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                <span>{item.department || 'General Administration'}</span>
                <span>·</span>
                <span>Uploaded: {item.date || 'Recent'}</span>
                {item.batchName && (
                  <>
                    <span>·</span>
                    <span className="font-semibold text-gov-blue">Batch: {item.batchName}</span>
                  </>
                )}
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
                title="Download / Open Original PDF"
              >
                <Download size={13} /> Open PDF <ExternalLink size={11} />
              </a>
            )}
            <button
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gov-blue text-white hover:bg-gov-blue-dark transition-colors shadow-sm"
              title="Edit Document"
            >
              <Edit3 size={13} /> Edit
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Metadata Grid */}
          <div className="grid sm:grid-cols-3 gap-3 bg-gray-50/70 p-4 rounded-xl border border-gray-100 text-xs">
            <div>
              <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Ingestion Source</p>
              <p className="font-bold text-gray-800 mt-0.5">{item.sourceType}</p>
            </div>
            <div>
              <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Batch Association</p>
              <p className="font-bold text-gray-800 mt-0.5">{item.batchName || '— (Individual)'}</p>
            </div>
            <div>
              <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Department</p>
              <p className="font-bold text-gray-800 mt-0.5">{item.department || '—'}</p>
            </div>
            <div>
              <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Ministry</p>
              <p className="font-bold text-gray-800 mt-0.5">{item.ministry || '—'}</p>
            </div>
            <div>
              <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Category</p>
              <p className="font-bold text-gray-800 mt-0.5">{item.category}</p>
            </div>
            <div>
              <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Upload Date</p>
              <p className="font-bold text-gray-800 mt-0.5">{item.date || '—'}</p>
            </div>
            <div>
              <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Published / Approved By</p>
              <p className="font-bold text-gray-800 mt-0.5">{item.publishedBy || item.approvedBy || item.createdBy || 'Data Manager'}</p>
            </div>
            {item.createdBy && item.createdBy !== (item.publishedBy || item.approvedBy) && (
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Uploaded By</p>
                <p className="font-bold text-gray-800 mt-0.5">{item.createdBy}</p>
              </div>
            )}

            {item.circularNumber && (
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Circular Number</p>
                <p className="font-bold text-gray-800 mt-0.5">{item.circularNumber}</p>
              </div>
            )}
            {item.goNumber && (
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">GO Number</p>
                <p className="font-bold text-gray-800 mt-0.5">{item.goNumber}</p>
              </div>
            )}
            {item.notificationNumber && (
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Gazette / Notification No</p>
                <p className="font-bold text-gray-800 mt-0.5">{item.notificationNumber}</p>
              </div>
            )}
            {item.actNumber && (
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Act Number</p>
                <p className="font-bold text-gray-800 mt-0.5">{item.actNumber} ({item.actYear || '—'})</p>
              </div>
            )}
            {item.benefit && (
              <div className="sm:col-span-2">
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Benefits / Grant</p>
                <p className="font-bold text-gray-800 mt-0.5">{item.benefit}</p>
              </div>
            )}
            {item.educationLevel && (
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Education Level</p>
                <p className="font-bold text-gray-800 mt-0.5">{item.educationLevel}</p>
              </div>
            )}
          </div>

          {/* Description */}
          {item.description && (
            <div className="p-4 bg-white border border-gray-100 rounded-xl text-xs space-y-1">
              <h4 className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">Document Summary & Directives</h4>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{item.description}</p>
            </div>
          )}

          {/* Action & PDF Access Card */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-blue-200 shadow-sm flex-shrink-0">
                <FileText size={20} className="text-gov-blue" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-xs">Official Document File Attachment</p>
                <p className="text-[11px] text-gray-500 font-mono mt-0.5">{item.fileName || 'Database Stored Document'}</p>
              </div>
            </div>
            {item.fileName && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
              >
                <Download size={13} /> Open / Download PDF <ExternalLink size={11} />
              </a>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(item);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border border-gov-blue/30 text-gov-blue hover:bg-gov-blue-50 transition-colors"
          >
            <Edit3 size={13} /> Edit Document Details
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-primary text-xs px-5 py-2"
          >
            Close Preview
          </button>
        </div>

      </motion.div>
    </div>
  );
}

// ── Edit Document Modal ──────────────────────────────────────────────────────
function EditDocumentModal({ record, onClose, onSave }) {
  const docType = record?.documentType || record?.category || 'Circular';

  const [form, setForm] = useState({
    title: record?.title || '',
    documentType: docType,
    category: record?.category || docType,
    department: record?.department || record?.departmentName || '',
    ministry: record?.ministry || '',
    description: record?.description || '',
    benefit: record?.benefit || '',
    beneficiaries: record?.beneficiaries || '',
    eligibility: record?.eligibility || '',
    educationLevel: record?.educationLevel || 'Higher Education',
    applicationDeadline: record?.applicationDeadline || '',
    goNumber: record?.goNumber || '',
    circularNumber: record?.circularNumber || '',
    notificationNumber: record?.notificationNumber || '',
    actNumber: record?.actNumber || '',
    actYear: record?.actYear || '',
    issueDate: record?.issueDate || record?.date || '',
    targetAudience: record?.targetAudience || '',
    tags: record?.tags || '',
  });
  const [saving, setSaving] = useState(false);

  if (!record) return null;

  const handleChange = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Document title is required.');
      return;
    }
    if (!form.department.trim()) {
      toast.error('Please select a department.');
      return;
    }

    setSaving(true);
    try {
      await onSave(record.id, form);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update document.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gov-blue-50 flex items-center justify-center text-gov-blue">
              <Edit3 size={18} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Edit Document</h3>
              <p className="text-xs text-gray-500 mt-0.5">Update metadata, department, reference numbers and details</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div>
            <label className="font-semibold text-gray-700 mb-1 block">Document Title *</label>
            <input
              className={ui.input}
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
              required
              placeholder="Official title of the document"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-gray-700 mb-1 block">Ministry</label>
              <select className={ui.input} value={form.ministry} onChange={e => handleChange('ministry', e.target.value)}>
                <option value="">Select Ministry...</option>
                {MINISTRIES.map(min => <option key={min} value={min}>{min}</option>)}
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
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-gray-700 mb-1 block">Category</label>
              <select className={ui.input} value={form.category} onChange={e => handleChange('category', e.target.value)}>
                {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="font-semibold text-gray-700 mb-1 block">Document Type</label>
              <input
                className={ui.input}
                value={form.documentType}
                onChange={e => handleChange('documentType', e.target.value)}
                placeholder="e.g. Government Order, Circular, Act"
              />
            </div>
          </div>

          {/* Reference Numbers & Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-gray-700 mb-1 block">GO Number</label>
              <input
                className={ui.input}
                value={form.goNumber}
                onChange={e => handleChange('goNumber', e.target.value)}
                placeholder="e.g. G.O.Ms.No. 12/2026"
              />
            </div>
            <div>
              <label className="font-semibold text-gray-700 mb-1 block">Circular Number</label>
              <input
                className={ui.input}
                value={form.circularNumber}
                onChange={e => handleChange('circularNumber', e.target.value)}
                placeholder="e.g. CIR-2026/04"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-gray-700 mb-1 block">Gazette / Notification No</label>
              <input
                className={ui.input}
                value={form.notificationNumber}
                onChange={e => handleChange('notificationNumber', e.target.value)}
                placeholder="e.g. NOTIF-2026-99"
              />
            </div>
            <div>
              <label className="font-semibold text-gray-700 mb-1 block">Issue Date</label>
              <input
                type="date"
                className={ui.input}
                value={form.issueDate}
                onChange={e => handleChange('issueDate', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-gray-700 mb-1 block">Act Number & Year</label>
              <div className="flex gap-2">
                <input
                  className={`${ui.input} flex-1`}
                  value={form.actNumber}
                  onChange={e => handleChange('actNumber', e.target.value)}
                  placeholder="Act No"
                />
                <input
                  className={`${ui.input} w-24`}
                  value={form.actYear}
                  onChange={e => handleChange('actYear', e.target.value)}
                  placeholder="Year"
                />
              </div>
            </div>
            <div>
              <label className="font-semibold text-gray-700 mb-1 block">Benefits / Assistance</label>
              <input
                className={ui.input}
                value={form.benefit}
                onChange={e => handleChange('benefit', e.target.value)}
                placeholder="e.g. Financial grant, Subsidy"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-gray-700 mb-1 block">Description & Directives</label>
            <textarea
              rows={3}
              className={ui.input}
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Detailed summary or directives from the document..."
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-xs px-5 py-2 font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg">Delete</button>
        </div>
      </motion.div>
    </div>
  );
}

export default function UploadHistory() {
  const { manualRecords, bulkRecords, deleteManualRecord, updateDocumentRecord } = useDataManager();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All'); // 'All' | 'Manual Upload' | 'Bulk Upload'
  const [filterBatch, setFilterBatch] = useState('All');
  const [filterCat, setFilterCat] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('date-desc');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [editDoc, setEditDoc] = useState(null);

  // Merge all records with their source type
  const allRecords = useMemo(() => {
    const manual = manualRecords.map(r => ({
      ...r,
      sourceType: 'Single Upload',
      batchName: null
    }));
    const bulk = bulkRecords.map(r => ({
      ...r,
      sourceType: 'Bulk Upload',
      batchName: r.batchName || 'Bulk Upload Batch'
    }));
    return [...manual, ...bulk];
  }, [manualRecords, bulkRecords]);

  // Unique batches available for filtering
  const availableBatches = useMemo(() => {
    const set = new Set();
    allRecords.forEach(r => {
      if (r.batchName) set.add(r.batchName);
    });
    return Array.from(set);
  }, [allRecords]);

  const filtered = useMemo(() => {
    let list = allRecords.filter(r => {
      const matchSearch = r.title?.toLowerCase().includes(search.toLowerCase()) ||
        r.department?.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === 'All' || r.sourceType === filterType;
      const matchBatch = filterBatch === 'All' || r.batchName === filterBatch;
      const matchCat = filterCat === 'All' || r.category === filterCat;
      const matchStatus = filterStatus === 'All' || r.status === filterStatus;
      return matchSearch && matchType && matchBatch && matchCat && matchStatus;
    });

    list.sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date || 0) - new Date(a.date || 0);
      if (sortBy === 'date-asc') return new Date(a.date || 0) - new Date(b.date || 0);
      if (sortBy === 'title-asc') return (a.title || '').localeCompare(b.title || '');
      return 0;
    });

    return list;
  }, [allRecords, search, filterType, filterBatch, filterCat, filterStatus, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteManualRecord(deleteTarget.id);
    toast.success(`"${deleteTarget.title}" deleted.`);
    setDeleteTarget(null);
  };

  const handleSaveEdit = async (id, form) => {
    const ok = await updateDocumentRecord(id, form);
    if (ok) {
      toast.success('Document updated successfully.');
      if (previewDoc && previewDoc.id === id) {
        setPreviewDoc(prev => ({ ...prev, ...form }));
      }
    } else {
      toast.error('Failed to update document.');
    }
  };

  const handleDownload = (record) => {
    if (!record.fileName) {
      toast.error('No downloadable file attached to this record.');
      return;
    }
    const token = localStorage.getItem('infoseva_access_token') || localStorage.getItem('token') || '';
    const fileUrl = `http://localhost:8082/api/documents/download/${record.fileName}?token=${token}`;
    window.open(fileUrl, '_blank');
  };

  return (
    <div className="space-y-5">
      {/* Dual Back Navigation */}
      <BackNavigation dashboardPath="/datamanager" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Upload History & Records</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Audit trail of all document ingestions across Single Uploads and Bulk batches.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <button
          onClick={() => { setFilterType('All'); setFilterBatch('All'); setPage(1); }}
          className={`${ui.cardPad4} text-left hover:shadow-card-hover transition-all ${filterType === 'All' ? 'ring-2 ring-gov-blue' : ''}`}
        >
          <div className="flex items-center gap-2.5 mb-1">
            <div className={ui.iconChip('blue', 'w-8 h-8')}><Layers size={15} /></div>
            <p className="text-xs font-semibold text-gray-500">All Intake Records</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{allRecords.length}</p>
        </button>

        <button
          onClick={() => { setFilterType('Single Upload'); setFilterBatch('All'); setPage(1); }}
          className={`${ui.cardPad4} text-left hover:shadow-card-hover transition-all ${filterType === 'Single Upload' ? 'ring-2 ring-gov-blue' : ''}`}
        >
          <div className="flex items-center gap-2.5 mb-1">
            <div className={ui.iconChip('navy', 'w-8 h-8')}><Upload size={15} /></div>
            <p className="text-xs font-semibold text-gray-500">Single Uploads</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{manualRecords.length}</p>
        </button>

        <button
          onClick={() => { setFilterType('Bulk Upload'); setPage(1); }}
          className={`${ui.cardPad4} text-left hover:shadow-card-hover transition-all ${filterType === 'Bulk Upload' ? 'ring-2 ring-gov-blue' : ''}`}
        >
          <div className="flex items-center gap-2.5 mb-1">
            <div className={ui.iconChip('green', 'w-8 h-8')}><FolderInput size={15} /></div>
            <p className="text-xs font-semibold text-gray-500">Bulk Ingestion Records</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{bulkRecords.length}</p>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className={`${ui.input} pl-8`}
            placeholder="Search by title or department..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>

        <select className={`${ui.input} w-auto`} value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}>
          <option value="All">All Ingestion Channels</option>
          <option value="Single Upload">Single Upload</option>
          <option value="Bulk Upload">Bulk Upload</option>
        </select>

        {availableBatches.length > 0 && (
          <select className={`${ui.input} w-auto`} value={filterBatch} onChange={e => { setFilterBatch(e.target.value); setPage(1); }}>
            <option value="All">All Batches</option>
            {availableBatches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        )}

        <select className={`${ui.input} w-auto`} value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1); }}>
          <option value="All">All Categories</option>
          {CATEGORY_OPTIONS.map(c => <option key={c}>{c}</option>)}
        </select>

        <select className={`${ui.input} w-auto`} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="All">All Statuses</option>
          <option>Published</option>
          <option>In Review</option>
          <option>Draft</option>
          <option>Rejected</option>
        </select>

        <select className={`${ui.input} w-auto`} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="title-asc">Title A–Z</option>
        </select>
      </div>

      {/* Table */}
      <div className={ui.cardOverflow}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[750px]">
            <thead>
              <tr className={ui.tableHeadRow}>
                {['Document Title', 'Ingestion Source', 'Batch Name', 'Department', 'Category', 'Date', 'Published By', 'Status', 'Actions'].map(h => (
                  <th key={h} className={ui.tableTh}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-sm text-gray-400">
                    <History size={36} className="text-gray-200 mx-auto mb-2" />
                    {search ? 'No records match your search.' : 'No upload history records found.'}
                  </td>
                </tr>
              )}
              {paged.map((r, i) => {
                return (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className={`${ui.tableTd} max-w-56`}>
                      <span className="line-clamp-1 font-bold text-gray-900">{r.title}</span>
                      {r.documentType && <span className="block text-[10px] text-gray-400 mt-0.5">{r.documentType}</span>}
                    </td>

                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <div className={ui.iconChip(r.sourceType === 'Bulk Upload' ? 'blue' : 'navy', 'w-6 h-6')}>
                          {r.sourceType === 'Bulk Upload' ? <FolderInput size={11} /> : <Upload size={11} />}
                        </div>
                        <span className="text-xs text-gray-700 font-medium whitespace-nowrap">{r.sourceType}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-4 text-xs">
                      {r.batchName ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-gov-blue bg-blue-50 px-2 py-0.5 rounded-md text-[11px]">
                          <FolderInput size={11} /> {r.batchName}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>

                    <td className={ui.tableTdMuted}>{r.department || '—'}</td>
                    <td className="py-2.5 px-4">
                      <span className={ui.badge('blue')}>{r.category}</span>
                    </td>
                    <td className={ui.tableTdMono}>{r.date || '—'}</td>
                    <td className={ui.tableTdMuted}>
                      <span className="truncate max-w-[130px] block font-medium text-gray-700" title={r.publishedBy || r.approvedBy || r.createdBy || 'Data Manager'}>
                        {r.publishedBy || r.approvedBy || r.createdBy || 'Data Manager'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={ui.badge(
                        r.status === 'Published' ? 'green' :
                        r.status === 'In Review' ? 'yellow' :
                        r.status === 'Draft' ? 'blue' : 'red'
                      )}>{r.status}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setPreviewDoc(r)}
                          className={ui.btn.view}
                          title="Preview in Data Manager"
                        >
                          <Eye size={12} /> Preview
                        </button>
                        <button
                          onClick={() => setEditDoc(r)}
                          className={ui.btn.edit}
                          title="Edit Document Details"
                        >
                          <Edit3 size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDownload(r)}
                          className={ui.btn.view}
                          title="Download PDF"
                        >
                          <Download size={12} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: r.id, title: r.title, sourceType: r.sourceType })}
                          className={ui.btn.reject}
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gov-blue disabled:opacity-40">
              <ChevronLeft size={13} /> Prev
            </button>
            <span className="text-xs text-gray-400">
              Page {page} of {totalPages} · {filtered.length} records
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gov-blue disabled:opacity-40">
              Next <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>

      {/* In-Context Preview Modal */}
      <AnimatePresence>
        {previewDoc && (
          <HistoryPreviewModal
            item={previewDoc}
            onClose={() => setPreviewDoc(null)}
            onEdit={(doc) => setEditDoc(doc)}
          />
        )}
      </AnimatePresence>

      {/* Edit Document Modal */}
      <AnimatePresence>
        {editDoc && (
          <EditDocumentModal
            record={editDoc}
            onClose={() => setEditDoc(null)}
            onSave={handleSaveEdit}
          />
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Record"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

