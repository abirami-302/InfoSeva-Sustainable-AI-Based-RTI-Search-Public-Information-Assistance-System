import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Eye, Trash2, Search, X,
  FolderInput, Wifi, ArrowLeft, AlertTriangle, CheckCircle2,
  ChevronLeft, ChevronRight, FileText, ExternalLink, Edit3, Download,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useDataManager } from '../../context/DataManagerContext';
import { BackNavigation } from '../../components/common';
import * as ui from '../../styles/datamanager/DataManagerUI';
import { CATEGORY_OPTIONS, DEPARTMENTS, MINISTRIES } from './shared';

const PAGE_SIZE = 8;

// ── Confirm dialog ─────────────────────────────────────────────────────────
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

// ── Document Details / Visit Modal (With Direct PDF Access) ─────────────────
function DocumentDetailsModal({ record, onClose, onEdit }) {
  if (!record) return null;
  const token = localStorage.getItem('infoseva_access_token') || localStorage.getItem('token') || '';
  const fileUrl = record.fileName ? `http://localhost:8082/api/documents/download/${record.fileName}?token=${token}` : null;
  const docType = record.documentType || record.category || 'Document';

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
            <div className={ui.iconChip(record.status === 'Published' ? 'green' : record.status === 'In Review' ? 'blue' : 'red', 'w-10 h-10')}>
              <FileText size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-sm max-w-md truncate">{record.title}</h3>
                <span className={ui.badge('blue')}>{docType}</span>
                <span className={ui.badge(
                  record.status === 'Published' ? 'green' :
                  record.status === 'In Review' ? 'yellow' : 'red'
                )}>
                  {record.status || 'Active'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                <span>{record.department || 'General Administration'}</span>
                <span>·</span>
                <span>Uploaded: {record.date || 'Recent'}</span>
                {record.batchName && (
                  <>
                    <span>·</span>
                    <span className="font-semibold text-gov-blue">Batch: {record.batchName}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {record.fileName && (
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
                onEdit(record);
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
              <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Ministry</p>
              <p className="font-bold text-gray-800 mt-0.5">{record.ministry || '—'}</p>
            </div>
            <div>
              <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Department</p>
              <p className="font-bold text-gray-800 mt-0.5">{record.department || '—'}</p>
            </div>
            <div>
              <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Category</p>
              <p className="font-bold text-gray-800 mt-0.5">{record.category || docType}</p>
            </div>
            <div>
              <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Document Type</p>
              <p className="font-bold text-gray-800 mt-0.5">{docType}</p>
            </div>
            <div>
              <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Date / Effective</p>
              <p className="font-bold text-gray-800 mt-0.5">{record.date || record.issueDate || '—'}</p>
            </div>
            <div>
              <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Source Classification</p>
              <p className="font-bold text-gray-800 mt-0.5">{record.sourceType || (record.batchName ? 'Bulk Upload' : 'Single Upload')}</p>
            </div>
            <div>
              <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Published / Approved By</p>
              <p className="font-bold text-gray-800 mt-0.5">{record.publishedBy || record.approvedBy || record.createdBy || 'Data Manager'}</p>
            </div>
            {record.createdBy && record.createdBy !== (record.publishedBy || record.approvedBy) && (
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Uploaded By</p>
                <p className="font-bold text-gray-800 mt-0.5">{record.createdBy}</p>
              </div>
            )}
            {record.circularNumber && (
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Circular Number</p>
                <p className="font-bold text-gray-800 mt-0.5">{record.circularNumber}</p>
              </div>
            )}
            {record.goNumber && (
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">GO Number</p>
                <p className="font-bold text-gray-800 mt-0.5">{record.goNumber}</p>
              </div>
            )}
            {record.notificationNumber && (
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Gazette / Notification No</p>
                <p className="font-bold text-gray-800 mt-0.5">{record.notificationNumber}</p>
              </div>
            )}
            {record.actNumber && (
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Act Number</p>
                <p className="font-bold text-gray-800 mt-0.5">{record.actNumber} ({record.actYear || '—'})</p>
              </div>
            )}
            {record.benefit && (
              <div className="sm:col-span-2">
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Benefits / Grant</p>
                <p className="font-bold text-gray-800 mt-0.5">{record.benefit}</p>
              </div>
            )}
            {record.educationLevel && (
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Education Level</p>
                <p className="font-bold text-gray-800 mt-0.5">{record.educationLevel}</p>
              </div>
            )}
            {record.targetAudience && (
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Target Audience</p>
                <p className="font-bold text-gray-800 mt-0.5">{record.targetAudience}</p>
              </div>
            )}
            {record.tags && (
              <div className="sm:col-span-3">
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Tags</p>
                <p className="font-medium text-gray-700 mt-0.5">{record.tags}</p>
              </div>
            )}
          </div>

          {/* Description */}
          {record.description && (
            <div className="p-4 bg-white border border-gray-100 rounded-xl text-xs space-y-1">
              <h4 className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">Document Summary & Directives</h4>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{record.description}</p>
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
                <p className="text-[11px] text-gray-500 font-mono mt-0.5">{record.fileName || 'Database Stored Document'}</p>
              </div>
            </div>
            {record.fileName && (
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
              onEdit(record);
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

function RecordsTable({ records, onView, onEdit, onDelete, onDeleteMultiple, sourceType }) {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  const filtered = useMemo(() => {
    return records.filter(r => {
      const q = search.trim().toLowerCase();
      const matchSearch = !q ||
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.department && r.department.toLowerCase().includes(q)) ||
        (r.ministry && r.ministry.toLowerCase().includes(q)) ||
        (r.category && r.category.toLowerCase().includes(q)) ||
        (r.documentType && r.documentType.toLowerCase().includes(q)) ||
        (r.fileName && r.fileName.toLowerCase().includes(q)) ||
        (r.goNumber && r.goNumber.toLowerCase().includes(q)) ||
        (r.circularNumber && r.circularNumber.toLowerCase().includes(q)) ||
        (r.notificationNumber && r.notificationNumber.toLowerCase().includes(q)) ||
        (r.actNumber && r.actNumber.toLowerCase().includes(q)) ||
        (r.benefit && r.benefit.toLowerCase().includes(q));
      const matchCat = filterCat === 'All' || r.category === filterCat;
      const matchStatus = filterStatus === 'All' || r.status === filterStatus;
      return matchSearch && matchCat && matchStatus;
    });
  }, [records, search, filterCat, filterStatus]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetPage = () => {
    setPage(1);
    setSelectedIds([]);
  };

  const isAllSelected = paged.length > 0 && paged.every(r => selectedIds.includes(r.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !paged.some(r => r.id === id)));
    } else {
      const pagedIds = paged.map(r => r.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...pagedIds])));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-3">
      {/* Filters & Bulk Action Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className={`${ui.input} pl-8`}
              placeholder={`Search ${sourceType} records...`}
              value={search}
              onChange={e => { setSearch(e.target.value); resetPage(); }}
            />
            {search && (
              <button onClick={() => { setSearch(''); resetPage(); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>
          <select className={`${ui.input} w-auto`} value={filterCat} onChange={e => { setFilterCat(e.target.value); resetPage(); }}>
            <option value="All">All Categories</option>
            {CATEGORY_OPTIONS.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className={`${ui.input} w-auto`} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); resetPage(); }}>
            <option value="All">All Statuses</option>
            <option>Published</option>
            <option>In Review</option>
            <option>Draft</option>
            <option>Rejected</option>
          </select>
        </div>

        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => onDeleteMultiple(selectedIds)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
          >
            <Trash2 size={13} /> Delete Selected ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Table */}
      <div className={ui.cardOverflow}>
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500 font-medium">
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
            {search && ` matching "${search}"`}
          </p>
          {selectedIds.length > 0 && (
            <span className="text-xs font-semibold text-gov-blue">
              {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[650px]">
            <thead>
              <tr className={ui.tableHeadRow}>
                <th className="py-2.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-gov-blue focus:ring-gov-blue cursor-pointer"
                    title="Select All on page"
                  />
                </th>
                {['Title', 'Department', 'Category', 'Date', 'Published By', 'Status', 'Actions'].map(h => (
                  <th key={h} className={ui.tableTh}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-gray-400">
                    {search ? 'No records match your search.' : 'No records in this source yet.'}
                  </td>
                </tr>
              )}
              {paged.map((r, i) => {
                const isChecked = selectedIds.includes(r.id);
                return (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={`hover:bg-gray-50 transition-colors ${isChecked ? 'bg-blue-50/40' : ''}`}
                  >
                    <td className="py-2.5 px-4">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectOne(r.id)}
                        className="w-4 h-4 rounded border-gray-300 text-gov-blue focus:ring-gov-blue cursor-pointer"
                      />
                    </td>
                    <td className={`${ui.tableTd} max-w-48`}>
                      <span className="line-clamp-1 font-semibold text-gray-800">{r.title}</span>
                      {r.documentType && <span className="block text-[10px] text-gray-400">{r.documentType}</span>}
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
                        r.status === 'Draft' ? 'purple' : 'red'
                      )}>{r.status}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => onView(r)} className={ui.btn.view} title="Visit & Preview Document">
                          <Eye size={12} /> Preview
                        </button>
                        <button onClick={() => onEdit(r)} className={ui.btn.edit} title="Edit Details">
                          <Edit3 size={12} /> Edit
                        </button>
                        <button
                          onClick={() => onDelete(r.id, r.title)}
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
            <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gov-blue disabled:opacity-40">
              Next <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


export function DataSources() {
  const { manualRecords, bulkRecords, deleteManualRecord, updateDocumentRecord } = useDataManager();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Manual');
  const [viewRecord, setViewRecord] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, title } or { ids: [] }

  const tabs = [
    { key: 'Manual', label: 'Manual Uploads', icon: Upload,      records: manualRecords, chip: 'navy',  count: manualRecords.length },
    { key: 'Bulk',   label: 'Bulk Uploads',   icon: FolderInput, records: bulkRecords,   chip: 'blue',  count: bulkRecords.length },
  ];
  const active = tabs.find(t => t.key === activeTab);

  const handleDelete = async () => {
    if (deleteTarget?.ids) {
      for (const id of deleteTarget.ids) {
        await deleteManualRecord(id);
      }
      toast.success(`${deleteTarget.ids.length} documents deleted.`);
    } else if (deleteTarget?.id) {
      await deleteManualRecord(deleteTarget.id);
      toast.success(`"${deleteTarget.title}" has been deleted.`);
    }
    setDeleteTarget(null);
  };

  const handleSaveEdit = async (id, form) => {
    const ok = await updateDocumentRecord(id, form);
    if (ok) {
      toast.success('Document updated successfully.');
      // If the currently viewed record was edited, update viewRecord state
      if (viewRecord && viewRecord.id === id) {
        setViewRecord(prev => ({ ...prev, ...form }));
      }
    } else {
      toast.error('Failed to update document.');
    }
  };

  const totalRecords = manualRecords.length + bulkRecords.length;

  return (
    <div className="space-y-5">
      {/* Dual Back Navigation */}
      <BackNavigation dashboardPath="/datamanager" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Data Sources</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalRecords.toLocaleString()} total records across all intake channels
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/datamanager/ingestion')} className="btn-primary text-sm flex items-center gap-1.5">
            <FileText size={14} /> Single Upload
          </button>
          <button onClick={() => navigate('/datamanager/bulk')} className="btn-secondary text-sm flex items-center gap-1.5">
            <FolderInput size={14} /> Bulk Upload
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`${ui.cardPad} text-left transition-all hover:shadow-card-hover ${
              activeTab === t.key ? 'ring-2 ring-gov-blue' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={ui.iconChip(t.chip, 'w-10 h-10')}>
                <t.icon size={18} />
              </div>
              <span className={ui.badge('green')}>Active</span>
            </div>
            <h3 className="font-semibold text-gray-800 text-sm">{t.label}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{t.count}</p>
            <p className="text-xs text-gray-400">records</p>
          </button>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 border-b border-gray-100 pb-0">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === t.key
                ? 'text-gov-blue border-gov-blue bg-gov-blue-50/30'
                : 'text-gray-500 border-transparent hover:text-gray-800'
            }`}
          >
            <t.icon size={14} />
            {t.label}
            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 rounded-full">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <RecordsTable
        records={active.records}
        sourceType={active.label}
        onView={setViewRecord}
        onEdit={setEditRecord}
        onDelete={(id, title) => {
          setDeleteTarget({ id, title });
        }}
        onDeleteMultiple={(ids) => {
          setDeleteTarget({ ids, title: `${ids.length} selected documents` });
        }}
      />

      {/* View & Visit modal */}
      <AnimatePresence>
        {viewRecord && (
          <DocumentDetailsModal
            record={viewRecord}
            onClose={() => setViewRecord(null)}
            onEdit={(doc) => setEditRecord(doc)}
          />
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {editRecord && (
          <EditDocumentModal
            record={editRecord}
            onClose={() => setEditRecord(null)}
            onSave={handleSaveEdit}
          />
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Document"
        message={`Are you sure you want to delete ${deleteTarget?.ids ? `${deleteTarget.ids.length} selected documents` : `"${deleteTarget?.title}"`}? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

