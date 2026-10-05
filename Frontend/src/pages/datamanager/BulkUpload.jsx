import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, X, FolderInput, Check, Loader, AlertCircle, ArrowLeft,
  FileText, ChevronLeft, ChevronRight, Layers,
  Sparkles, Plus, Trash2, Search,
  Edit3, FolderPlus, ExternalLink, FileEdit
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useDataManager } from '../../context/DataManagerContext';
import { BackNavigation, Pagination } from '../../components/common';
import * as ui from '../../styles/datamanager/DataManagerUI';
import { uploadDocument } from '../../api/documentApi';
import { MINISTRIES, DEPARTMENTS } from './shared';

const ACCEPTED = '.pdf';
const PAGE_SIZE = 6;

function formatBytes(b) {
  if (!b) return '0 B';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

const SUPPORTED_DOC_TYPES = [
  { id: 'Scheme', label: 'Scheme', icon: '🏛️', desc: 'Central / State welfare programs and financial assistance' },
  { id: 'Scholarship', label: 'Scholarship', icon: '🎓', desc: 'Student education grants and financial aid' },
  { id: 'RTI', label: 'RTI Disclosure', icon: '🔍', desc: 'Official proactive disclosures, section 4 notices & past replies' },
  { id: 'GO', label: 'Government Order (GO)', icon: '📜', desc: 'Official executive orders, notifications and directives' },
  { id: 'Notification', label: 'Notification', icon: '📢', desc: 'Statutory gazette notifications and regulations' },
  { id: 'Circular', label: 'Circular', icon: '📋', desc: 'Departmental circulars, memos and compliance guidelines' },
  { id: 'Act / Rule', label: 'Act / Rule', icon: '⚖️', desc: 'Parliamentary and legislative Acts & Rules' },
];

const SCHEME_CATEGORIES = ['Agriculture', 'Health', 'Housing', 'Education', 'Finance', 'Energy'];
const EDUCATION_LEVELS = ['Pre-Matric', 'Post-Matric', 'Higher Education', 'Overseas'];

// ── Edit Document Modal ───────────────────────────────────────────────────
function EditDocumentModal({ item, docType, onSave, onClose }) {
  const [form, setForm] = useState({ ...item.metadata });

  const handleChange = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title?.trim()) {
      toast.error('Document title is required.');
      return;
    }
    onSave(item.id, form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Edit3 size={18} className="text-gov-blue" />
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Edit Extracted Metadata</h3>
              <p className="text-[11px] text-gray-400 truncate max-w-md">{item.file?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 overflow-y-auto space-y-4 text-xs">
          <div>
            <label className="font-bold text-gray-700 block mb-1">Document Title *</label>
            <input className={ui.input} value={form.title || ''} onChange={e => handleChange('title', e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Ministry</label>
              <select className={ui.input} value={form.ministry || ''} onChange={e => handleChange('ministry', e.target.value)}>
                <option value="">Select Ministry...</option>
                {MINISTRIES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Department *</label>
              <select className={ui.input} value={form.department || ''} onChange={e => handleChange('department', e.target.value)}>
                <option value="">Select Department...</option>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {docType === 'Scheme' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Sector Category</label>
                <select className={ui.input} value={form.category || 'Agriculture'} onChange={e => handleChange('category', e.target.value)}>
                  {SCHEME_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Target Beneficiaries</label>
                <input className={ui.input} value={form.beneficiaries || ''} onChange={e => handleChange('beneficiaries', e.target.value)} placeholder="e.g. Small & Marginal Farmers" />
              </div>
              <div className="col-span-2">
                <label className="font-bold text-gray-700 block mb-1">Benefits / Financial Assistance</label>
                <input className={ui.input} value={form.benefit || ''} onChange={e => handleChange('benefit', e.target.value)} placeholder="e.g. Rs 6,000 per year in 3 installments" />
              </div>
              <div className="col-span-2">
                <label className="font-bold text-gray-700 block mb-1">Eligibility Criteria</label>
                <textarea rows={2} className={ui.input} value={form.eligibility || ''} onChange={e => handleChange('eligibility', e.target.value)} />
              </div>
            </div>
          )}

          {docType === 'Scholarship' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Education Level</label>
                <select className={ui.input} value={form.educationLevel || 'Higher Education'} onChange={e => handleChange('educationLevel', e.target.value)}>
                  {EDUCATION_LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Application Deadline</label>
                <input type="date" className={ui.input} value={form.applicationDeadline || ''} onChange={e => handleChange('applicationDeadline', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="font-bold text-gray-700 block mb-1">Scholarship Grant / Award Amount</label>
                <input className={ui.input} value={form.benefit || ''} onChange={e => handleChange('benefit', e.target.value)} placeholder="e.g. Full tuition fee + Rs 12,000 allowance" />
              </div>
            </div>
          )}

          {(docType === 'GO' || docType === 'Government Order (GO)') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">GO / Order Number</label>
                <input className={ui.input} value={form.goNumber || ''} onChange={e => handleChange('goNumber', e.target.value)} placeholder="e.g. G.O.Ms.No. 45/2026" />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Issue Date</label>
                <input type="date" className={ui.input} value={form.issueDate || ''} onChange={e => handleChange('issueDate', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="font-bold text-gray-700 block mb-1">Directives & Summary</label>
                <textarea rows={2} className={ui.input} value={form.directives || form.summary || ''} onChange={e => handleChange('directives', e.target.value)} />
              </div>
            </div>
          )}

          {docType === 'Notification' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Gazette / Notification Number</label>
                <input className={ui.input} value={form.notificationNumber || ''} onChange={e => handleChange('notificationNumber', e.target.value)} />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Notification Date</label>
                <input type="date" className={ui.input} value={form.issueDate || ''} onChange={e => handleChange('issueDate', e.target.value)} />
              </div>
            </div>
          )}

          {docType === 'Circular' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Circular / Memo Number</label>
                <input className={ui.input} value={form.circularNumber || ''} onChange={e => handleChange('circularNumber', e.target.value)} placeholder="e.g. CIR-2026/FIN-09" />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Issue Date</label>
                <input type="date" className={ui.input} value={form.issueDate || ''} onChange={e => handleChange('issueDate', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="font-bold text-gray-700 block mb-1">Target Audience / Applicability</label>
                <input className={ui.input} value={form.targetAudience || ''} onChange={e => handleChange('targetAudience', e.target.value)} placeholder="e.g. All District Collectors, Treasuries" />
              </div>
            </div>
          )}

          {docType === 'Act / Rule' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Act Number</label>
                <input className={ui.input} value={form.actNumber || ''} onChange={e => handleChange('actNumber', e.target.value)} placeholder="e.g. Act No. 22 of 2024" />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Year of Enactment</label>
                <input className={ui.input} value={form.actYear || ''} onChange={e => handleChange('actYear', e.target.value)} placeholder="e.g. 2024" />
              </div>
            </div>
          )}

          <div>
            <label className="font-bold text-gray-700 block mb-1">Detailed Description / Text</label>
            <textarea rows={3} className={ui.input} value={form.description || ''} onChange={e => handleChange('description', e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs px-4 py-2 font-semibold">
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Inspect AI Extraction Modal ───────────────────────────────────────────
function InspectAiModal({ item, docType, onClose, onEdit }) {

  if (!item) return null;
  const m = item.metadata || {};

  const fieldsToCheck = [
    { label: 'Document Title', value: m.title, required: true },
    { label: 'Department', value: m.department, required: true },
    { label: 'Ministry', value: m.ministry, required: false },
    ...(docType === 'Scheme' ? [
      { label: 'Sector Category', value: m.category, required: true },
      { label: 'Target Beneficiaries', value: m.beneficiaries, required: false },
      { label: 'Benefits / Financial Assistance', value: m.benefit, required: true },
      { label: 'Eligibility Criteria', value: m.eligibility, required: false },
    ] : []),
    ...(docType === 'Scholarship' ? [
      { label: 'Education Level', value: m.educationLevel, required: true },
      { label: 'Application Deadline', value: m.applicationDeadline, required: false },
      { label: 'Scholarship Amount', value: m.benefit, required: true },
    ] : []),
    ...(docType === 'Circular' ? [
      { label: 'Circular / Memo Number', value: m.circularNumber, required: true },
      { label: 'Issue Date', value: m.issueDate, required: true },
      { label: 'Target Audience', value: m.targetAudience, required: false },
    ] : []),
    ...(docType === 'GO' || docType === 'Government Order (GO)' ? [
      { label: 'GO Number', value: m.goNumber, required: true },
      { label: 'Issue Date', value: m.issueDate, required: true },
      { label: 'Directives / Summary', value: m.directives || m.summary, required: false },
    ] : []),
    ...(docType === 'Notification' ? [
      { label: 'Gazette / Notification Number', value: m.notificationNumber, required: true },
      { label: 'Notification Date', value: m.issueDate, required: true },
    ] : []),
    ...(docType === 'Act / Rule' ? [
      { label: 'Act Number', value: m.actNumber, required: true },
      { label: 'Year of Enactment', value: m.actYear, required: true },
    ] : []),
    { label: 'Description / Extracted Text', value: m.description, required: false }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-gov-blue" />
            <div>
              <h3 className="font-bold text-gray-900 text-sm">AI Extraction & Validation Results</h3>
              <p className="text-[11px] text-gray-400">{item.file?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="px-6 py-4 overflow-y-auto space-y-3 text-xs">
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between">
            <div>
              <span className="font-bold text-gov-blue block">Gemini AI Ingestion Status</span>
              <span className="text-[11px] text-gray-500">Document Type: <strong>{docType}</strong></span>
            </div>
            <span className={ui.badge(item.extractStatus === 'extracted' ? 'green' : item.extractStatus === 'failed' ? 'red' : 'yellow')}>
              {item.extractStatus === 'extracted' ? 'Auto-Extracted' : item.extractStatus === 'failed' ? 'Extraction Failed' : 'Pending AI'}
            </span>
          </div>

          <div className="space-y-2 pt-1">
            <h4 className="font-bold text-gray-700 text-xs uppercase tracking-wide">Extracted Field Analysis</h4>
            {fieldsToCheck.map((f, idx) => (
              <div key={idx} className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-bold text-gray-700">{f.label}</span>
                    {f.required && <span className="text-red-500 font-bold text-[10px]">*Required</span>}
                  </div>
                  {f.value ? (
                    <p className="text-gray-800 break-words line-clamp-3">{f.value}</p>
                  ) : (
                    <p className="text-gray-400 italic">Not found in PDF (Left Empty)</p>
                  )}
                </div>
                <div>
                  {f.value ? (
                    <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check size={10} /> Extracted
                    </span>
                  ) : f.required ? (
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertCircle size={10} /> Missing
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      Optional
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs font-semibold text-gray-600 border rounded-lg hover:bg-gray-100">
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(item);
            }}
            className="btn-primary text-xs px-4 py-1.5 font-semibold flex items-center gap-1"
          >
            <Edit3 size={12} /> Edit Extracted Fields
          </button>
        </div>
      </motion.div>
    </div>
  );
}


// ── Batch Details Modal ───────────────────────────────────────────────────
function BatchDetailModal({ batchDetail, onClose }) {
  if (!batchDetail) return null;
  const { batch, docs = [] } = batchDetail;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-2">
            <FolderInput size={18} className="text-gov-blue" />
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Batch Details: {batch.name}</h3>
              <p className="text-[11px] text-gray-500">Real-time metadata & status for {docs.length} submitted document(s)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {docs.length === 0 ? (
            <div className="text-center py-10">
              <FileText size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-500">No documents submitted in this batch yet.</p>
              <p className="text-xs text-gray-400 mt-0.5">Upload PDFs below and click "Send Batch to Review Queue".</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
              {docs.map(doc => (
                <div key={doc.id} className="p-3.5 hover:bg-gray-50/50 transition-colors flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-gray-900 truncate max-w-md">{doc.title}</p>
                      <span className={ui.badge('blue')}>{doc.documentType || doc.category}</span>
                      <span className={ui.badge(doc.status === 'Published' || doc.reviewStatus === 'APPROVED' ? 'green' : doc.status === 'Rejected' || doc.reviewStatus === 'REJECTED' ? 'red' : 'yellow')}>
                        {doc.status || doc.reviewStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      <strong>Department:</strong> {doc.department || '—'} · <strong>Uploaded:</strong> {doc.date || doc.uploadDate || 'Recent'}
                    </p>
                    {doc.circularNumber && <p className="text-[11px] text-gray-600"><strong>Circular No:</strong> {doc.circularNumber}</p>}
                    {doc.goNumber && <p className="text-[11px] text-gray-600"><strong>GO No:</strong> {doc.goNumber}</p>}
                    {doc.benefit && <p className="text-[11px] text-gray-600"><strong>Benefit:</strong> {doc.benefit}</p>}
                  </div>
                  {doc.fileName && (
                    <a
                      href={`http://localhost:8082/api/documents/download/${doc.fileName}?token=${localStorage.getItem('infoseva_access_token') || ''}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary text-[11px] px-2.5 py-1 flex items-center gap-1 flex-shrink-0"
                    >
                      <FileText size={11} /> PDF <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Bulk Upload Component ─────────────────────────────────────────────
export function BulkUpload() {
  const { fetchDashboardData, bulkRecords = [], manualRecords = [], reviewQueue = [] } = useDataManager();
  const navigate = useNavigate();
  const fileRef = useRef();

  const [selectedType, setSelectedType] = useState('Circular');
  const [sourceType, setSourceType] = useState('');
  const [batches, setBatches] = useState([
    { id: 'b1', name: 'Batch 01 — Departmental Documents', count: 0 }
  ]);
  const [selectedBatchId, setSelectedBatchId] = useState('b1');
  const [newBatchName, setNewBatchName] = useState('');
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedBatchDetail, setSelectedBatchDetail] = useState(null);
  const [items, setItems] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [inspectItem, setInspectItem] = useState(null);

  // Combine real live documents from database context for dynamic batch tracking
  const allDocs = useMemo(() => {
    return [...bulkRecords, ...manualRecords, ...reviewQueue];
  }, [bulkRecords, manualRecords, reviewQueue]);

  // Synchronize batches if existing live documents contain named batches
  React.useEffect(() => {
    const discoveredBatches = new Map();
    allDocs.forEach(d => {
      if (d.batchName) {
        const bid = d.batchId || `b-${d.batchName.toLowerCase().replace(/\s+/g, '-')}`;
        discoveredBatches.set(bid, d.batchName);
      }
    });

    if (discoveredBatches.size > 0) {
      setBatches(prev => {
        const existingIds = new Set(prev.map(b => b.id));
        const merged = [...prev];
        discoveredBatches.forEach((name, id) => {
          if (!existingIds.has(id)) {
            merged.push({ id, name, count: 0 });
          }
        });
        return merged;
      });
    }
  }, [allDocs]);


  const handleAddFiles = (fileList) => {
    const rawFiles = Array.from(fileList).filter(f => f.name.toLowerCase().endsWith('.pdf'));
    if (rawFiles.length === 0) {
      toast.error('Please upload PDF documents only.');
      return;
    }

    const newItems = rawFiles.map(f => {
      const baseTitle = f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      return {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        file: f,
        batchId: selectedBatchId,
        documentType: selectedType,
        extractStatus: 'pending',
        metadata: {
          title: baseTitle,
          ministry: '',
          department: '',
          category: selectedType === 'Scheme' ? 'Agriculture' : selectedType === 'Scholarship' ? 'Education' : selectedType,
          description: '',
          summary: '',
          benefit: '',
          beneficiaries: '',
          launchedYear: '2025',
          eligibility: '',
          documentsRequired: ['Aadhaar Card', 'Income Certificate'],
          howToApply: ['Submit through online portal'],
          faqs: [],
          applyLink: '',
          educationLevel: 'Higher Education',
          applicationDeadline: '',
          goNumber: '',
          notificationNumber: '',
          circularNumber: '',
          actYear: '',
          actNumber: '',
          issueDate: new Date().toISOString().slice(0, 10),
          effectiveDate: '',
          targetAudience: '',
          jurisdiction: 'State / Central',
          directives: ''
        }
      };
    });

    setItems(prev => [...prev, ...newItems]);
    toast.success(`Added ${newItems.length} document(s) to ${batches.find(b => b.id === selectedBatchId)?.name || 'current batch'}.`);
  };

  const extractSingleItem = async (item) => {
    try {
      const formData = new FormData();
      formData.append('file', item.file);
      formData.append('documentType', selectedType);

      const res = await fetch('http://localhost:8000/api/v1/extract-metadata', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          return {
            extractStatus: 'extracted',
            metadata: {
              ...item.metadata,
              title: d.title || item.metadata.title,
              ministry: d.ministry || item.metadata.ministry,
              department: d.department || item.metadata.department,
              category: d.category || item.metadata.category,
              description: d.description || item.metadata.description,
              summary: d.summary || item.metadata.summary,
              benefit: d.benefit || item.metadata.benefit,
              beneficiaries: d.beneficiaries || item.metadata.beneficiaries,
              eligibility: d.eligibility || item.metadata.eligibility,
              circularNumber: d.circularNumber || item.metadata.circularNumber,
              goNumber: d.goNumber || item.metadata.goNumber,
              notificationNumber: d.notificationNumber || item.metadata.notificationNumber,
              actNumber: d.actNumber || item.metadata.actNumber,
              actYear: d.actYear || item.metadata.actYear,
              issueDate: d.issueDate || item.metadata.issueDate,
              targetAudience: d.targetAudience || item.metadata.targetAudience,
              directives: d.directives || item.metadata.directives
            }
          };
        }
      }
    } catch (err) {
      console.warn('AI extraction failed for item:', item.file.name, err);
    }
    return { extractStatus: 'failed' };
  };

  const cancelExtractionRef = useRef(false);

  const handleCancelExtraction = () => {
    cancelExtractionRef.current = true;
    setExtracting(false);
    toast.error('AI extraction cancelled by Data Manager.');
  };

  const handleBulkAiExtract = async () => {
    const targetItems = items.filter(i => (selectedBatchId === 'all' || i.batchId === selectedBatchId));
    if (targetItems.length === 0) {
      toast.error('No documents to extract in this batch.');
      return;
    }

    cancelExtractionRef.current = false;
    setExtracting(true);
    const extractToast = toast.loading(`AI extracting metadata for ${targetItems.length} document(s)...`);
    let successCount = 0;

    for (const item of targetItems) {
      if (cancelExtractionRef.current) {
        break;
      }
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, extractStatus: 'extracting' } : i));
      const result = await extractSingleItem(item);
      if (cancelExtractionRef.current) {
        break;
      }
      if (result.extractStatus === 'extracted') {
        successCount++;
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...result } : i));
      } else {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, extractStatus: 'failed' } : i));
      }
    }

    setExtracting(false);
    if (!cancelExtractionRef.current) {
      toast.success(`AI processed ${targetItems.length} documents (${successCount} auto-filled).`, { id: extractToast });
    } else {
      toast.dismiss(extractToast);
    }
  };


  const handleCreateBatch = (e) => {
    e.preventDefault();
    if (!newBatchName.trim()) return;
    const newBatch = {
      id: `b-${Date.now()}`,
      name: newBatchName.trim(),
    };
    setBatches(prev => [...prev, newBatch]);
    setSelectedBatchId(newBatch.id);
    setNewBatchName('');
    setShowBatchModal(false);
    toast.success(`Batch "${newBatch.name}" created.`);
  };

  const handleSubmitBatch = async (batchIdToSubmit = selectedBatchId, asDraft = false) => {
    if (!sourceType || !sourceType.trim()) {
      toast.error('Please select a source type before uploading.');
      return;
    }

    const targetItems = items.filter(i => (batchIdToSubmit === 'all' || i.batchId === batchIdToSubmit));
    if (targetItems.length === 0) {
      toast.error(asDraft ? 'No documents in this batch to save as drafts.' : 'No documents in this batch to submit.');
      return;
    }

    setSubmitting(true);
    const actionLabel = asDraft ? 'Drafts' : 'Review Queue';
    const submitToast = toast.loading(`${asDraft ? 'Saving' : 'Submitting'} batch of ${targetItems.length} documents as ${actionLabel}...`);
    let successCount = 0;
    let failCount = 0;

    for (const item of targetItems) {
      try {
        const currentBatchId = batchIdToSubmit === 'all' ? (item.batchId || 'b1') : batchIdToSubmit;
        const currentBatchObj = batches.find(b => b.id === currentBatchId) || { name: 'Bulk Upload Batch' };
        const currentBatchName = currentBatchObj.name;

        const m = item.metadata;
        const batchTag = `[Batch:${currentBatchName}|BatchId:${currentBatchId}]`;
        const itemDesc = m.description || m.summary || m.directives || `Bulk uploaded ${selectedType} from ${currentBatchName}`;
        const finalDescription = itemDesc.includes('[Batch:') ? itemDesc : `${itemDesc} ${batchTag}`;

        const payload = {
          file: item.file,
          title: m.title || item.file.name,
          sourceType: sourceType,
          documentType: selectedType,
          category: selectedType === 'Scheme' ? (m.category || 'Agriculture') : (selectedType === 'Scholarship' ? 'Education' : (selectedType === 'RTI' ? 'RTI' : selectedType)),
          ministry: m.ministry,
          departmentName: m.department || 'General Administration',
          description: finalDescription,
          summary: m.summary || m.description,
          benefit: m.benefit,
          beneficiaries: m.beneficiaries,
          launchedYear: m.launchedYear,
          eligibility: m.eligibility,
          eligibilityQuestions: m.eligibilityQuestions,
          documentsRequired: m.documentsRequired,
          howToApply: m.howToApply,
          faqs: m.faqs,
          applyLink: m.applyLink,
          educationLevel: m.educationLevel,
          applicationDeadline: m.applicationDeadline,
          goNumber: m.goNumber,
          notificationNumber: m.notificationNumber,
          circularNumber: m.circularNumber,
          actYear: m.actYear,
          actNumber: m.actNumber,
          issueDate: m.issueDate,
          effectiveDate: m.effectiveDate,
          targetAudience: m.targetAudience,
          jurisdiction: m.jurisdiction,
          directives: m.directives,
          tags: `Bulk Upload, ${currentBatchName}${asDraft ? ', Draft' : ''}`,
          active: true,
          status: asDraft ? 'DRAFT' : 'PENDING',
          reviewStatus: asDraft ? 'DRAFT' : 'PENDING_REVIEW',
          approvalRequired: true
        };

        await uploadDocument(payload);
        successCount++;
        setItems(prev => prev.filter(i => i.id !== item.id));
      } catch (err) {
        console.error(`Failed to ${asDraft ? 'save draft for' : 'submit item to Review Queue:'}`, item.file.name, err);
        failCount++;
      }
    }

    setSubmitting(false);
    if (successCount > 0) {
      if (asDraft) {
        toast.success(`Batch successfully saved as drafts (${successCount} documents). Accessible in My Drafts.`, { id: submitToast });
      } else {
        toast.success(`Batch successfully sent to Review Queue (${successCount} documents).`, { id: submitToast });
      }
      if (fetchDashboardData) fetchDashboardData();
    } else {
      toast.error(`Batch operation encountered errors (${failCount} failed).`, { id: submitToast });
    }
  };

  const handleSaveSelectedAsDraft = async () => {
    if (!sourceType || !sourceType.trim()) {
      toast.error('Please select a source type before saving drafts.');
      return;
    }

    const targetItems = items.filter(i => selectedItemIds.includes(i.id));
    if (targetItems.length === 0) {
      toast.error('No selected documents to save as draft.');
      return;
    }

    setSubmitting(true);
    const submitToast = toast.loading(`Saving ${targetItems.length} selected document(s) as drafts...`);
    let successCount = 0;
    let failCount = 0;

    for (const item of targetItems) {
      try {
        const currentBatchId = item.batchId || selectedBatchId || 'b1';
        const currentBatchObj = batches.find(b => b.id === currentBatchId) || { name: 'Bulk Upload Batch' };
        const currentBatchName = currentBatchObj.name;

        const m = item.metadata;
        const batchTag = `[Batch:${currentBatchName}|BatchId:${currentBatchId}]`;
        const itemDesc = m.description || m.summary || m.directives || `Bulk uploaded ${selectedType} from ${currentBatchName}`;
        const finalDescription = itemDesc.includes('[Batch:') ? itemDesc : `${itemDesc} ${batchTag}`;

        const payload = {
          file: item.file,
          title: m.title || item.file.name,
          sourceType: sourceType,
          documentType: selectedType,
          category: selectedType === 'Scheme' ? (m.category || 'Agriculture') : (selectedType === 'Scholarship' ? 'Education' : (selectedType === 'RTI' ? 'RTI' : selectedType)),
          ministry: m.ministry,
          departmentName: m.department || 'General Administration',
          description: finalDescription,
          summary: m.summary || m.description,
          benefit: m.benefit,
          beneficiaries: m.beneficiaries,
          launchedYear: m.launchedYear,
          eligibility: m.eligibility,
          eligibilityQuestions: m.eligibilityQuestions,
          documentsRequired: m.documentsRequired,
          howToApply: m.howToApply,
          faqs: m.faqs,
          applyLink: m.applyLink,
          educationLevel: m.educationLevel,
          applicationDeadline: m.applicationDeadline,
          goNumber: m.goNumber,
          notificationNumber: m.notificationNumber,
          circularNumber: m.circularNumber,
          actYear: m.actYear,
          actNumber: m.actNumber,
          issueDate: m.issueDate,
          effectiveDate: m.effectiveDate,
          targetAudience: m.targetAudience,
          jurisdiction: m.jurisdiction,
          directives: m.directives,
          tags: `Bulk Upload, ${currentBatchName}, Draft`,
          active: true,
          status: 'DRAFT',
          reviewStatus: 'DRAFT',
          approvalRequired: true
        };

        await uploadDocument(payload);
        successCount++;
        setItems(prev => prev.filter(i => i.id !== item.id));
        setSelectedItemIds(prev => prev.filter(id => id !== item.id));
      } catch (err) {
        console.error('Failed to save selected draft:', item.file.name, err);
        failCount++;
      }
    }

    setSubmitting(false);
    if (successCount > 0) {
      toast.success(`Successfully saved ${successCount} document(s) to My Drafts.`, { id: submitToast });
      if (fetchDashboardData) fetchDashboardData();
    } else {
      toast.error(`Draft saving failed (${failCount} errors).`, { id: submitToast });
    }
  };


  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchBatch = selectedBatchId === 'all' || item.batchId === selectedBatchId;
      const matchSearch = item.file.name.toLowerCase().includes(search.toLowerCase()) ||
        item.metadata.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.metadata.department?.toLowerCase().includes(search.toLowerCase());
      return matchBatch && matchSearch;
    });
  }, [items, selectedBatchId, search]);

  const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE);
  const pagedItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const isAllSelected = pagedItems.length > 0 && pagedItems.every(i => selectedItemIds.includes(i.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItemIds(prev => prev.filter(id => !pagedItems.some(i => i.id === id)));
    } else {
      const pagedIds = pagedItems.map(i => i.id);
      setSelectedItemIds(prev => Array.from(new Set([...prev, ...pagedIds])));
    }
  };

  return (
    <div className="space-y-6">
      <BackNavigation dashboardPath="/datamanager" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Bulk Document Ingestion & AI Batch Pipeline</h2>
          <p className="text-sm text-gray-500 mt-0.5">Ingest hundreds of PDFs with automated Gemini AI extraction, batch-wise sorting, and direct Review Queue routing.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button onClick={() => navigate('/datamanager/drafts')} className="btn-secondary text-xs flex items-center gap-1.5">
            <FileEdit size={14} /> View My Drafts
          </button>
          <button onClick={() => navigate('/datamanager/review')} className="btn-secondary text-xs flex items-center gap-1.5">
            <Layers size={14} /> View Review Queue
          </button>
        </div>
      </div>

      <div className={ui.cardPad}>
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-gov-blue" />
            <h3 className="font-semibold text-gray-800 text-sm">Step 1: Select Document Type for Batch Intake</h3>
          </div>
          <span className="text-xs font-semibold bg-blue-50 text-gov-blue px-2.5 py-1 rounded-full border border-blue-100">
            Current: {selectedType}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {SUPPORTED_DOC_TYPES.map(t => {
            const isSel = selectedType === t.id;
            return (
              <button key={t.id} type="button" onClick={() => setSelectedType(t.id)}
                className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSel ? 'border-gov-blue bg-blue-50/50 shadow-sm ring-1 ring-gov-blue' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                }`}>
                <div>
                  <div className="text-xl mb-1.5">{t.icon}</div>
                  <h4 className={`text-xs font-bold ${isSel ? 'text-gov-blue' : 'text-gray-800'}`}>{t.label}</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2 leading-tight">{t.desc}</p>
                </div>
                {isSel && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-gov-blue"><Check size={11} /> Selected</div>
                )}
              </button>
            );
          })}
        </div>

        {/* Source Type / Provenance Selection */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <label className="text-xs font-bold text-gray-700 block mb-1.5">
            Step 2: Select Source Type / Trust Classification <span className="text-red-500">*</span>
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSourceType('GOVERNMENT_VERIFIED')}
              className={`p-3 rounded-xl border text-left transition-all ${
                sourceType === 'GOVERNMENT_VERIFIED'
                  ? 'border-gov-blue bg-blue-50/60 ring-2 ring-gov-blue/20 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🏛️</span>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Government Verified</h4>
                  <p className="text-[10px] text-gray-500">Official Gazettes, Orders, Circulars, CIC Decisions</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSourceType('COMMUNITY_SOURCED')}
              className={`p-3 rounded-xl border text-left transition-all ${
                sourceType === 'COMMUNITY_SOURCED'
                  ? 'border-gov-blue bg-blue-50/60 ring-2 ring-gov-blue/20 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">👥</span>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Community Sourced</h4>
                  <p className="text-[10px] text-gray-500">Citizen RTI Questions, Community Archives</p>
                </div>
              </div>
            </button>
          </div>
          {!sourceType && (
            <p className="text-[11px] text-amber-600 mt-1.5 flex items-center gap-1">
              <AlertCircle size={12} /> Please select a source type before submitting this batch.
            </p>
          )}
        </div>
      </div>



      <div className="grid lg:grid-cols-4 gap-4">
        <div className={`${ui.cardPad} space-y-4`}>
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <h3 className="font-bold text-gray-800 text-xs flex items-center gap-1.5 uppercase tracking-wider">
              <FolderInput size={14} className="text-gov-blue" /> Batches ({batches.length})
            </h3>
            <button onClick={() => setShowBatchModal(true)} className="text-xs text-gov-blue hover:text-blue-700 font-semibold flex items-center gap-1">
              <Plus size={13} /> New Batch
            </button>
          </div>

          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            <button onClick={() => setSelectedBatchId('all')}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                selectedBatchId === 'all' ? 'bg-gov-blue text-white shadow-sm' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
              }`}>
              <span>All Uploaded Batches</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${selectedBatchId === 'all' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>
                {items.length}
              </span>
            </button>
            {batches.map(b => {
              const bCount = items.filter(i => i.batchId === b.id).length;
              const isSel = selectedBatchId === b.id;
              return (
                <button key={b.id} onClick={() => setSelectedBatchId(b.id)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                    isSel ? 'bg-gov-blue text-white shadow-sm' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}>
                  <span className="truncate pr-2">{b.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] flex-shrink-0 ${isSel ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>
                    {bCount}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-gray-100 space-y-2">
            <button
              onClick={() => handleSubmitBatch(selectedBatchId, false)}
              disabled={submitting || items.filter(i => selectedBatchId === 'all' || i.batchId === selectedBatchId).length === 0}
              className="btn-primary w-full text-xs py-2.5 font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? <Loader size={14} className="animate-spin" /> : <Layers size={14} />}
              Send Batch to Review Queue
            </button>
            <button
              onClick={() => handleSubmitBatch(selectedBatchId, true)}
              disabled={submitting || items.filter(i => selectedBatchId === 'all' || i.batchId === selectedBatchId).length === 0}
              className="w-full text-xs py-2.5 font-semibold flex items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors disabled:opacity-50"
              title="Store this entire batch in My Drafts to finish editing and submit later"
            >
              {submitting ? <Loader size={14} className="animate-spin" /> : <FileEdit size={14} className="text-amber-700" />}
              Save Batch as Draft
            </button>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files) handleAddFiles(e.dataTransfer.files); }}
            className={ui.dropzone(dragging)}>
            <input ref={fileRef} type="file" multiple accept={ACCEPTED} className="hidden"
              onChange={e => { if (e.target.files) handleAddFiles(e.target.files); e.target.value = ''; }} />
            <div onClick={() => fileRef.current?.click()} className="cursor-pointer">
              <div className={ui.dropzoneIconWrap}><Upload size={28} className="text-gov-blue" /></div>
              <h3 className="font-bold text-gray-800 text-sm mb-1">Drop multiple {selectedType} PDF files here</h3>
              <p className="text-xs text-gray-400">Uploading to batch: <span className="font-semibold text-gov-blue">{batches.find(b => b.id === selectedBatchId)?.name || 'Default Batch'}</span></p>
              <div className="mt-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-gray-300 text-gov-blue px-3.5 py-1.5 rounded-lg shadow-sm hover:bg-gov-blue-50">
                  <FolderPlus size={14} /> Browse & Add PDF Files
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>


      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className={`${ui.input} pl-8 text-xs`} placeholder="Search staged documents..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="flex items-center gap-2">
            {extracting ? (
              <button
                type="button"
                onClick={handleCancelExtraction}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2 px-3.5 rounded-lg shadow-sm flex items-center gap-1.5 animate-pulse"
              >
                <X size={13} /> Cancel Extraction
              </button>
            ) : (
              <button
                type="button"
                onClick={handleBulkAiExtract}
                disabled={filteredItems.length === 0}
                className="bg-gradient-to-r from-gov-blue to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-semibold py-2 px-3.5 rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles size={13} /> AI Extract & Auto-Fill
              </button>
            )}
            {selectedItemIds.length > 0 && !extracting && (
              <>
                <button
                  type="button"
                  onClick={handleSaveSelectedAsDraft}
                  disabled={submitting}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  title="Store checked documents in My Drafts"
                >
                  <FileEdit size={13} className="text-amber-700" /> Save Selected as Draft ({selectedItemIds.length})
                </button>
                <button
                  type="button"
                  onClick={() => { setItems(prev => prev.filter(i => !selectedItemIds.includes(i.id))); setSelectedItemIds([]); }}
                  className="bg-red-50 text-red-600 border border-red-200 py-2 px-3 rounded-lg text-xs font-semibold"
                >
                  <Trash2 size={13} /> Remove ({selectedItemIds.length})
                </button>
              </>
            )}
          </div>

        </div>

        <div className={ui.cardOverflow}>
          <table className="w-full text-xs min-w-[750px]">
            <thead>
              <tr className={ui.tableHeadRow}>
                <th className="py-2.5 px-4 w-10"><input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300" /></th>
                <th className={ui.tableTh}>File Name</th>
                <th className={ui.tableTh}>Title</th>
                <th className={ui.tableTh}>Department</th>
                <th className={ui.tableTh}>Status</th>
                <th className={ui.tableTh}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pagedItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="py-2.5 px-4"><input type="checkbox" checked={selectedItemIds.includes(item.id)} onChange={() => setSelectedItemIds(p => p.includes(item.id) ? p.filter(x => x !== item.id) : [...p, item.id])} className="w-4 h-4 rounded border-gray-300" /></td>
                  <td className="py-2.5 px-4 truncate max-w-44">{item.file.name}</td>
                  <td className="py-2.5 px-4 truncate max-w-52">{item.metadata.title}</td>
                  <td className="py-2.5 px-4">{item.metadata.department || <span className="text-amber-500 font-semibold">Needs Dept</span>}</td>
                  <td className="py-2.5 px-4">
                    <span className={ui.badge(item.extractStatus === 'extracted' ? 'green' : item.extractStatus === 'failed' ? 'red' : 'yellow')}>
                      {item.extractStatus === 'extracted' ? 'Auto-Extracted' : item.extractStatus === 'failed' ? 'Failed' : 'Pending AI'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setInspectItem(item)}
                        className={`${ui.btn.view} flex items-center gap-1`}
                        title="Inspect AI Extraction Details"
                      >
                        <Sparkles size={12} className="text-amber-500" /> AI Result
                      </button>
                      <button type="button" onClick={() => setEditingItem(item)} className={ui.btn.edit} title="Edit metadata">
                        <Edit3 size={13} />
                      </button>
                      <button type="button" onClick={() => setItems(p => p.filter(i => i.id !== item.id))} className={ui.btn.reject} title="Remove">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredItems.length > PAGE_SIZE && (
          <div className="p-3 border-t border-gray-100">
            <Pagination
              page={page}
              totalItems={filteredItems.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedBatchDetail && (
          <BatchDetailModal
            batchDetail={selectedBatchDetail}
            onClose={() => setSelectedBatchDetail(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBatchModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowBatchModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <h3 className="font-bold text-sm mb-4">Create New Intake Batch</h3>
              <form onSubmit={handleCreateBatch} className="space-y-3">
                <input className={ui.input} value={newBatchName} onChange={e => setNewBatchName(e.target.value)} autoFocus required />
                <button type="submit" className="btn-primary w-full text-xs">Create Batch</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      <AnimatePresence>
        {inspectItem && (
          <InspectAiModal
            item={inspectItem}
            docType={selectedType}
            onClose={() => setInspectItem(null)}
            onEdit={(it) => setEditingItem(it)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingItem && (
          <EditDocumentModal item={editingItem} docType={selectedType} onClose={() => setEditingItem(null)} 
            onSave={(id, m) => { setItems(p => p.map(i => i.id === id ? { ...i, metadata: m } : i)); setEditingItem(null); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

