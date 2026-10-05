import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, X, FileText, Check, Loader, AlertCircle, ArrowLeft,
  Info, ChevronDown, Sparkles, Plus, Trash2, HelpCircle, Layers, CheckCircle2
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useDataManager } from '../../context/DataManagerContext';
import { BackNavigation } from '../../components/common';
import * as ui from '../../styles/datamanager/DataManagerUI';
import { uploadDocument } from '../../api/documentApi';
import {
  MINISTRIES, DEPARTMENTS, STATES, LANGUAGES, PRIORITIES
} from './shared';

const ACCEPTED = '.pdf';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
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

const INITIAL_FORM = {
  title: '',
  sourceType: '',
  ministry: '',
  department: '',
  category: 'Agriculture',
  description: '',
  summary: '',
  benefit: '',
  beneficiaries: '',
  launchedYear: '2025',
  eligibility: '',
  documentsRequired: ['Aadhaar Card', 'Bank Passbook', 'Income Certificate'],
  howToApply: ['Access the official online application portal.', 'Fill in personal and bank details with verification.', 'Submit application and save reference acknowledgment.'],
  faqs: [{ q: 'Who is eligible to apply?', a: 'Any resident citizen meeting the prescribed criteria.' }],
  eligibilityQuestions: [
    { id: 'q1', text: 'Are you a permanent resident citizen of India?', expectedAnswer: 'Yes' },
    { id: 'q2', text: 'Do you meet the income/target beneficiary criteria for this program?', expectedAnswer: 'Yes' },
    { id: 'q3', text: 'Can you provide the required verification documents upon request?', expectedAnswer: 'Yes' }
  ],
  applyLink: '',
  educationLevel: 'Higher Education',
  applicationDeadline: '',
  goNumber: '',
  notificationNumber: '',
  circularNumber: '',
  actYear: '2025',
  actNumber: '',
  issueDate: new Date().toISOString().slice(0, 10),
  effectiveDate: '',
  jurisdiction: 'All India',
  targetAudience: 'All Citizens',
  directives: '',
  actionRequired: '',
};

function Err({ errors, k }) {
  return errors[k] ? (
    <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors[k]}</p>
  ) : null;
}

function Field({ label, k, required, errors, aiExtracted, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-semibold text-gray-700 block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {aiExtracted && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
            <Sparkles size={10} className="text-amber-500" /> AI-Extracted
          </span>
        )}
      </div>
      {children}
      <Err errors={errors} k={k} />
    </div>
  );
}

export function DataIngestion() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileRef = useRef(null);
  const { addManualUpload, refreshDashboardData } = useDataManager();

  const [selectedType, setSelectedType] = useState('');
  const [form, setForm] = useState(INITIAL_FORM);
  const [aiFields, setAiFields] = useState({});
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({});

  // Gap pre-fill state — set when navigated from ContentGaps Quick Upload
  const [gapQuery, setGapQuery] = useState(null);
  const [gapSuggesting, setGapSuggesting] = useState(false);
  const [gapSuggestion, setGapSuggestion] = useState(null); // { category, ministry, confidence }

  // Dynamic builder inputs
  const [newDocTag, setNewDocTag] = useState('');
  const [selectedStandardDoc, setSelectedStandardDoc] = useState('');
  const [newStep, setNewStep] = useState('');
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');
  const [newQText, setNewQText] = useState('');
  const [newQExpected, setNewQExpected] = useState('Yes');

  // ── Gap Pre-fill from ContentGaps Quick Upload ────────────────────────────
  // On mount: if location.state contains a gapQuery, call the ai-service
  // /suggest-category endpoint to pre-fill category and department dropdowns.
  // The Data Manager can always override the suggestion manually.
  React.useEffect(() => {
    const { gapQuery: incomingQuery } = location.state || {};
    if (!incomingQuery) return;

    setGapQuery(incomingQuery);

    const fetchSuggestion = async () => {
      setGapSuggesting(true);
      try {
        const res = await fetch('http://localhost:8000/api/v1/suggest-category', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: incomingQuery }),
        });
        if (res.ok) {
          const json = await res.json();
          if (!json.fallback && json.suggested_category) {
            setGapSuggestion({
              category: json.suggested_category,
              ministry: json.suggested_ministry,
              confidence: json.confidence,
            });
            // Pre-fill category
            setForm(prev => ({
              ...prev,
              category: json.suggested_category || prev.category,
              ministry: json.suggested_ministry || prev.ministry,
              title: prev.title || `Content for: ${incomingQuery}`,
            }));
            setAiFields(prev => ({
              ...prev,
              category: true,
              ministry: !!json.suggested_ministry,
            }));
          }
        }
      } catch (e) {
        console.warn('[ContentGap] Category suggestion unavailable:', e);
      } finally {
        setGapSuggesting(false);
      }
    };

    fetchSuggestion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const COMMON_GOV_DOCS = [
    'Aadhaar Card', 'Bank Passbook', 'Income Certificate', 'Caste / Community Certificate',
    'Ration Card / Food Security Card', 'Land Ownership / Patta Document', 'Domicile / Residence Certificate',
    'Birth Certificate', '10th / 12th Standard Marksheet', 'Degree / Diploma Certificate',
    'Disability Certificate', 'Passport / Voter ID', 'Electricity / Utility Bill'
  ];

  const up = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: '' }));
  };

  // File selection without automatic forced extraction
  const handleFileSelect = (uploadedFile) => {
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setErrors(p => ({ ...p, file: '' }));
  };

  // Explicit AI Extraction Handler
  const runAiExtraction = async (targetFile = file) => {
    const fileToExtract = targetFile || file;
    if (!fileToExtract) {
      toast.error('Please select a PDF document first.');
      return;
    }
    if (!selectedType) {
      toast.error('Please select a Document Type first.');
      return;
    }

    setExtracting(true);
    const extractToast = toast.loading(`Extracting metadata using AI for ${fileToExtract.name}...`);

    try {
      const formData = new FormData();
      formData.append('file', fileToExtract);
      formData.append('documentType', selectedType);

      const res = await fetch('http://localhost:8000/api/v1/extract-metadata', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          const newAiFields = {};

          setForm(prev => {
            const updated = { ...prev };
            Object.keys(d).forEach(k => {
              if (d[k] !== undefined && d[k] !== null && d[k] !== '') {
                updated[k] = d[k];
                newAiFields[k] = true;
              }
            });
            return updated;
          });

          setAiFields(newAiFields);
          toast.success('AI successfully extracted structured metadata!', { id: extractToast });
        } else {
          toast.error(json.error || 'AI extraction failed. Please enter details manually.', { id: extractToast });
        }
      } else {
        toast.error('AI extraction service returned an error.', { id: extractToast });
      }
    } catch (err) {
      console.warn('AI extraction service error:', err);
      toast.error('AI service unreachable. Please ensure ai-service is running on port 8000.', { id: extractToast });
    } finally {
      setExtracting(false);
    }
  };


  const validateForm = () => {
    const errs = {};
    if (!selectedType) errs.selectedType = 'Document type is required.';
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (!form.sourceType || !form.sourceType.trim()) {
      errs.sourceType = 'Please select a source type before uploading.';
    }
    if (!form.department.trim()) errs.department = 'Department is required.';
    if (!file) errs.file = 'PDF document is required.';
    return errs;
  };

  const handleAction = async (actionType) => {
    // actionType can be: 'UPLOAD' | 'SAVE_DRAFT' | 'REVIEW_QUEUE'
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      if (errs.sourceType) {
        toast.error(errs.sourceType);
      } else {
        toast.error('Please resolve the highlighted form errors.');
      }
      return;
    }

    setSubmitting(true);

    try {
      const isDraft = actionType === 'SAVE_DRAFT';
      const isReviewQueue = actionType === 'REVIEW_QUEUE';
      const isDirectUpload = actionType === 'UPLOAD';

      let docCategory = form.category;
      if (selectedType === 'Scheme') {
        docCategory = form.category || 'Agriculture';
      } else if (selectedType === 'Scholarship') {
        docCategory = 'Education';
      } else if (selectedType === 'RTI' || selectedType === 'RTI Disclosure') {
        docCategory = 'RTI';
      } else if (selectedType === 'Government Order (GO)' || selectedType === 'GO') {
        docCategory = 'GO';
      } else if (selectedType === 'Circular') {
        docCategory = 'Circular';
      } else if (selectedType === 'Notification') {
        docCategory = 'Notification';
      } else if (selectedType === 'Act / Rule') {
        docCategory = 'Act / Rule';
      }

      const payload = {
        file: file,
        title: form.title,
        sourceType: form.sourceType,
        documentType: selectedType,
        category: docCategory,
        ministry: form.ministry,
        departmentName: form.department,
        description: form.description || form.summary || form.title,
        summary: form.summary || form.description,

        benefit: form.benefit,
        beneficiaries: form.beneficiaries,
        launchedYear: form.launchedYear,
        eligibility: form.eligibility,
        eligibilityQuestions: form.eligibilityQuestions,
        documentsRequired: form.documentsRequired,
        howToApply: form.howToApply,
        faqs: form.faqs,
        applyLink: form.applyLink,
        educationLevel: form.educationLevel,
        applicationDeadline: form.applicationDeadline,
        goNumber: form.goNumber,
        notificationNumber: form.notificationNumber,
        circularNumber: form.circularNumber,
        actYear: form.actYear,
        actNumber: form.actNumber,
        issueDate: form.issueDate,
        effectiveDate: form.effectiveDate,
        jurisdiction: form.jurisdiction,
        directives: form.directives,
        actionRequired: form.actionRequired,
        active: true,
        status: isDraft ? 'DRAFT' : (isReviewQueue ? 'PENDING' : 'ACTIVE'),
        reviewStatus: isDraft ? 'DRAFT' : (isReviewQueue ? 'PENDING_REVIEW' : 'APPROVED'),
        approvalRequired: isReviewQueue,
      };

      const result = await uploadDocument(payload);

      // Persist to Context state using addManualUpload (safe fallback if method name differs)
      if (typeof addManualUpload === 'function') {
        addManualUpload({
          id: result?.id || Date.now(),
          ...payload,
          status: isDraft ? 'Draft' : (isReviewQueue ? 'In Review' : 'Published'),
          documentDate: form.issueDate,
        });
      }

      if (isDirectUpload) {
        setSuccessMessage('Document uploaded and published successfully! It is now live in the appropriate citizen section.');
        toast.success('Document Uploaded & Published!');
      } else if (isReviewQueue) {
        setSuccessMessage('Document sent to Review Queue successfully! Authorized Data Managers can review and approve it.');
        toast.success('Submitted to Review Queue!');
      } else {
        setSuccessMessage('Document saved as Draft successfully. It is private to your account.');
        toast.success('Draft Saved Successfully!');
      }

      if (refreshDashboardData) {
        refreshDashboardData();
      }
    } catch (err) {
      toast.error(`Upload error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="space-y-5">
      {/* Dual Back Navigation */}
      <BackNavigation dashboardPath="/datamanager" />

      {/* Header */}
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900">Dynamic Document Ingestion</h2>
        <p className="text-sm text-gray-500 mt-0.5">Select a document type to reveal its exact schema, then drop a PDF for automated AI extraction.</p>
      </div>

      {/* ── Gap Context Banner ─────────────────────────────────────────────────
          Shown only when navigated from ContentGaps via Quick Upload.
          Displays the failed search query and the AI-suggested category.
          The Data Manager can always override any pre-filled field manually. */}
      {gapQuery && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3.5 flex items-start gap-3">
          <Sparkles size={16} className="text-gov-blue flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gov-blue">
              Resolving content gap: "{gapQuery}"
            </p>
            {gapSuggesting && (
              <p className="text-[11px] text-blue-500 mt-0.5 flex items-center gap-1">
                <Loader size={10} className="animate-spin" /> Fetching AI category suggestion…
              </p>
            )}
            {!gapSuggesting && gapSuggestion && (
              <p className="text-[11px] text-gray-600 mt-0.5">
                Suggested category pre-filled:{' '}
                <span className="font-semibold text-gov-blue">{gapSuggestion.category}</span>
                {gapSuggestion.ministry && (
                  <span> · Ministry: <span className="font-semibold">{gapSuggestion.ministry}</span></span>
                )}
                <span className="ml-1 text-gray-400">
                  (confidence: {gapSuggestion.confidence} — you can override below)
                </span>
              </p>
            )}
            {!gapSuggesting && !gapSuggestion && (
              <p className="text-[11px] text-gray-500 mt-0.5">
                AI suggestion unavailable — please select category manually below.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Success Notification */}
      <AnimatePresence>
        {successMessage && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 flex items-start gap-3">
            <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-green-800">Operation Successful</p>
              <p className="text-xs text-green-600 mt-0.5">{successMessage}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate('/datamanager/review')} className="text-xs font-semibold text-green-700 underline">
                Review Queue
              </button>
              <button onClick={() => { setSuccessMessage(''); setFile(null); setForm(INITIAL_FORM); }} className="text-xs font-semibold text-green-700 underline">
                Upload Another
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 1: Document Type Selection */}
      <div className={`${ui.cardPad} space-y-3`}>
        <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
          <Layers size={16} className="text-gov-blue" /> Step 1: Select Document Type
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {SUPPORTED_DOC_TYPES.map(type => {
            const isSelected = selectedType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  setSelectedType(type.id);
                  setErrors(p => ({ ...p, selectedType: '' }));
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-gov-blue bg-gov-blue/5 ring-2 ring-gov-blue/20 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-2xl mb-1">{type.icon}</div>
                <h4 className={`text-xs font-bold ${isSelected ? 'text-gov-blue' : 'text-gray-800'}`}>{type.label}</h4>
                <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{type.desc}</p>
              </button>
            );
          })}
        </div>
        <Err errors={errors} k="selectedType" />
      </div>

      {/* Step 2: Dynamic Form & File Drop */}
      {selectedType && (
        <div className="grid lg:grid-cols-5 gap-5">
          {/* Main Dynamic Form */}
          <div className="lg:col-span-3 space-y-5">
            <div className={`${ui.cardPad} space-y-4`}>
              <h3 className="font-semibold text-gray-800 text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText size={16} className="text-gov-blue" />
                  {selectedType} Information & Metadata
                </span>
                {extracting && (
                  <span className="flex items-center gap-1.5 text-xs text-amber-600 animate-pulse">
                    <Loader size={12} className="animate-spin" /> AI Extracting Fields...
                  </span>
                )}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="sm:col-span-2">
                  <Field errors={errors} label={`${selectedType} Title / Subject`} k="title" required aiExtracted={aiFields.title}>
                    <input className={ui.input} placeholder={`e.g. ${selectedType === 'Scheme' ? 'Pradhan Mantri Krishi Sinchayee Yojana' : 'Annual Education Grant Order 2025'}`}
                      value={form.title} onChange={e => up('title', e.target.value)} />
                  </Field>
                </div>

                {/* Source Type / Trust Provenance */}
                <div className="sm:col-span-2">
                  <Field errors={errors} label="Source Type / Trust Classification" k="sourceType" required>
                    <select
                      className={ui.input}
                      value={form.sourceType}
                      onChange={e => up('sourceType', e.target.value)}
                    >
                      <option value="">Select source type...</option>
                      <option value="GOVERNMENT_VERIFIED">🏛️ Government Verified (Official Gazettes, Orders, Circulars, CIC Decisions)</option>
                      <option value="COMMUNITY_SOURCED">👥 Community Sourced (Citizen RTI Questions, Community Archives)</option>
                    </select>
                  </Field>
                </div>

                {/* Ministry */}
                <Field errors={errors} label="Ministry" k="ministry" aiExtracted={aiFields.ministry}>
                  <select className={ui.input} value={form.ministry} onChange={e => up('ministry', e.target.value)}>
                    <option value="">Select ministry...</option>
                    {MINISTRIES.map(m => <option key={m}>{m}</option>)}
                  </select>
                </Field>

                {/* Department */}
                <Field errors={errors} label="Department" k="department" required aiExtracted={aiFields.department}>
                  <select className={ui.input} value={form.department} onChange={e => up('department', e.target.value)}>
                    <option value="">Select department...</option>
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </Field>

                {/* SCHEME SPECIFIC FIELDS */}
                {selectedType === 'Scheme' && (
                  <>
                    <Field errors={errors} label="Sector Category" k="category" required aiExtracted={aiFields.category}>
                      <select className={ui.input} value={form.category} onChange={e => up('category', e.target.value)}>
                        {SCHEME_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </Field>

                    <Field errors={errors} label="Launch Year" k="launchedYear" aiExtracted={aiFields.launchedYear}>
                      <input className={ui.input} placeholder="e.g. 2024" value={form.launchedYear} onChange={e => up('launchedYear', e.target.value)} />
                    </Field>

                    <Field errors={errors} label="Quantifiable Benefit" k="benefit" aiExtracted={aiFields.benefit}>
                      <input className={ui.input} placeholder="e.g. ₹6,000 per year direct credit" value={form.benefit} onChange={e => up('benefit', e.target.value)} />
                    </Field>

                    <Field errors={errors} label="Target Beneficiaries" k="beneficiaries" aiExtracted={aiFields.beneficiaries}>
                      <input className={ui.input} placeholder="e.g. Small and marginal farmer families" value={form.beneficiaries} onChange={e => up('beneficiaries', e.target.value)} />
                    </Field>

                    <div className="sm:col-span-2">
                      <Field errors={errors} label="Application Portal URL" k="applyLink" aiExtracted={aiFields.applyLink}>
                        <input className={ui.input} placeholder="https://pmkisan.gov.in" value={form.applyLink} onChange={e => up('applyLink', e.target.value)} />
                      </Field>
                    </div>

                    <div className="sm:col-span-2">
                      <Field errors={errors} label="Eligibility Summary" k="eligibility" aiExtracted={aiFields.eligibility}>
                        <textarea rows={2} className={ui.textarea} placeholder="Summary of who can apply and criteria..." value={form.eligibility} onChange={e => up('eligibility', e.target.value)} />
                      </Field>
                    </div>
                  </>
                )}

                {/* SCHOLARSHIP SPECIFIC FIELDS */}
                {selectedType === 'Scholarship' && (
                  <>
                    <Field errors={errors} label="Education Level" k="educationLevel" required aiExtracted={aiFields.educationLevel}>
                      <select className={ui.input} value={form.educationLevel} onChange={e => up('educationLevel', e.target.value)}>
                        {EDUCATION_LEVELS.map(l => <option key={l}>{l}</option>)}
                      </select>
                    </Field>

                    <Field errors={errors} label="Application Deadline" k="applicationDeadline" aiExtracted={aiFields.applicationDeadline}>
                      <input type="date" className={ui.input} value={form.applicationDeadline} onChange={e => up('applicationDeadline', e.target.value)} />
                    </Field>

                    <Field errors={errors} label="Stipend / Grant Amount" k="benefit" aiExtracted={aiFields.benefit}>
                      <input className={ui.input} placeholder="e.g. ₹50,000/year + Tuition waiver" value={form.benefit} onChange={e => up('benefit', e.target.value)} />
                    </Field>

                    <Field errors={errors} label="Eligible Communities / Quota" k="beneficiaries" aiExtracted={aiFields.beneficiaries}>
                      <input className={ui.input} placeholder="e.g. Meritorious students with family income < 2.5L" value={form.beneficiaries} onChange={e => up('beneficiaries', e.target.value)} />
                    </Field>

                    <div className="sm:col-span-2">
                      <Field errors={errors} label="National / State Scholarship Portal Link" k="applyLink" aiExtracted={aiFields.applyLink}>
                        <input className={ui.input} placeholder="https://scholarships.gov.in" value={form.applyLink} onChange={e => up('applyLink', e.target.value)} />
                      </Field>
                    </div>
                  </>
                )}

                {/* RTI DISCLOSURE SPECIFIC FIELDS */}
                {(selectedType === 'RTI' || selectedType === 'RTI Disclosure') && (
                  <>
                    <Field errors={errors} label="RTI Reference / File No." k="goNumber" aiExtracted={aiFields.goNumber}>
                      <input className={ui.input} placeholder="e.g. CIC/AT/A/2025/000142 or MoHFW/RTI/2025/89" value={form.goNumber} onChange={e => up('goNumber', e.target.value)} />
                    </Field>

                    <Field errors={errors} label="Date of Reply / Disclosure" k="issueDate" required aiExtracted={aiFields.issueDate}>
                      <input type="date" className={ui.input} value={form.issueDate} onChange={e => up('issueDate', e.target.value)} />
                    </Field>

                    <Field errors={errors} label="Jurisdiction / Authority" k="jurisdiction" aiExtracted={aiFields.jurisdiction}>
                      <input className={ui.input} placeholder="e.g. Central Information Commission or State PIO" value={form.jurisdiction} onChange={e => up('jurisdiction', e.target.value)} />
                    </Field>

                    <Field errors={errors} label="Subject / RTI Domain" k="category" aiExtracted={aiFields.category}>
                      <input className={ui.input} placeholder="e.g. Public Information, Land Records, Recruitment" value={form.category} onChange={e => up('category', e.target.value)} />
                    </Field>

                    <div className="sm:col-span-2">
                      <Field errors={errors} label="Query / Information Requested & Reply Summary" k="summary" required aiExtracted={aiFields.summary}>
                        <textarea rows={3} className={ui.textarea} placeholder="Summary of question asked under RTI and the official reply provided..." value={form.summary} onChange={e => up('summary', e.target.value)} />
                      </Field>
                    </div>
                  </>
                )}

                {/* GOVERNMENT ORDER (GO) SPECIFIC FIELDS */}
                {selectedType === 'GO' && (
                  <>
                    <Field errors={errors} label="G.O. / Order Reference No." k="goNumber" required aiExtracted={aiFields.goNumber}>
                      <input className={ui.input} placeholder="e.g. G.O.Ms.No. 142/2025" value={form.goNumber} onChange={e => up('goNumber', e.target.value)} />
                    </Field>

                    <Field errors={errors} label="Issue Date" k="issueDate" required aiExtracted={aiFields.issueDate}>
                      <input type="date" className={ui.input} value={form.issueDate} onChange={e => up('issueDate', e.target.value)} />
                    </Field>

                    <Field errors={errors} label="Effective Date" k="effectiveDate" aiExtracted={aiFields.effectiveDate}>
                      <input type="date" className={ui.input} value={form.effectiveDate} onChange={e => up('effectiveDate', e.target.value)} />
                    </Field>

                    <div className="sm:col-span-2">
                      <Field errors={errors} label="Executive Summary & Directives" k="summary" aiExtracted={aiFields.summary}>
                        <textarea rows={3} className={ui.textarea} placeholder="Key policy directives and administrative orders..." value={form.summary} onChange={e => up('summary', e.target.value)} />
                      </Field>
                    </div>
                  </>
                )}

                {/* NOTIFICATION SPECIFIC FIELDS */}
                {selectedType === 'Notification' && (
                  <>
                    <Field errors={errors} label="Gazette / Notification Reference" k="notificationNumber" required aiExtracted={aiFields.notificationNumber}>
                      <input className={ui.input} placeholder="e.g. GSR 412(E) / 2025" value={form.notificationNumber} onChange={e => up('notificationNumber', e.target.value)} />
                    </Field>

                    <Field errors={errors} label="Territory Jurisdiction" k="jurisdiction" aiExtracted={aiFields.jurisdiction}>
                      <input className={ui.input} placeholder="e.g. All India or Tamil Nadu" value={form.jurisdiction} onChange={e => up('jurisdiction', e.target.value)} />
                    </Field>

                    <Field errors={errors} label="Notification Date" k="issueDate" required aiExtracted={aiFields.issueDate}>
                      <input type="date" className={ui.input} value={form.issueDate} onChange={e => up('issueDate', e.target.value)} />
                    </Field>

                    <div className="sm:col-span-2">
                      <Field errors={errors} label="Notification Summary" k="summary" aiExtracted={aiFields.summary}>
                        <textarea rows={3} className={ui.textarea} placeholder="Statutory notice summary..." value={form.summary} onChange={e => up('summary', e.target.value)} />
                      </Field>
                    </div>
                  </>
                )}

                {/* CIRCULAR SPECIFIC FIELDS */}
                {selectedType === 'Circular' && (
                  <>
                    <Field errors={errors} label="Circular Number" k="circularNumber" required aiExtracted={aiFields.circularNumber}>
                      <input className={ui.input} placeholder="e.g. CIR/2025/11" value={form.circularNumber} onChange={e => up('circularNumber', e.target.value)} />
                    </Field>

                    <Field errors={errors} label="Target Audience" k="targetAudience" aiExtracted={aiFields.targetAudience}>
                      <input className={ui.input} placeholder="e.g. All District Officers" value={form.targetAudience} onChange={e => up('targetAudience', e.target.value)} />
                    </Field>

                    <Field errors={errors} label="Issue Date" k="issueDate" required aiExtracted={aiFields.issueDate}>
                      <input type="date" className={ui.input} value={form.issueDate} onChange={e => up('issueDate', e.target.value)} />
                    </Field>

                    <div className="sm:col-span-2">
                      <Field errors={errors} label="Circular Summary & Action Required" k="summary" aiExtracted={aiFields.summary}>
                        <textarea rows={3} className={ui.textarea} placeholder="Compliance instructions and deadlines..." value={form.summary} onChange={e => up('summary', e.target.value)} />
                      </Field>
                    </div>
                  </>
                )}

                {/* ACT / RULE SPECIFIC FIELDS */}
                {selectedType === 'Act / Rule' && (
                  <>
                    <Field errors={errors} label="Act Enactment Year" k="actYear" required aiExtracted={aiFields.actYear}>
                      <input className={ui.input} placeholder="e.g. 2005" value={form.actYear} onChange={e => up('actYear', e.target.value)} />
                    </Field>

                    <Field errors={errors} label="Act Number / Reference" k="actNumber" aiExtracted={aiFields.actNumber}>
                      <input className={ui.input} placeholder="e.g. Act No. 22 of 2005" value={form.actNumber} onChange={e => up('actNumber', e.target.value)} />
                    </Field>

                    <div className="sm:col-span-2">
                      <Field errors={errors} label="Legislative Preamble & Scope" k="summary" aiExtracted={aiFields.summary}>
                        <textarea rows={3} className={ui.textarea} placeholder="Summary of chapters, rules and penalties..." value={form.summary} onChange={e => up('summary', e.target.value)} />
                      </Field>
                    </div>
                  </>
                )}

                {/* Full Description */}
                <div className="sm:col-span-2">
                  <Field errors={errors} label="Detailed Description / Text" k="description" aiExtracted={aiFields.description}>
                    <textarea rows={4} className={ui.textarea} placeholder="Full official details of the document..." value={form.description} onChange={e => up('description', e.target.value)} />
                  </Field>
                </div>
              </div>
            </div>

            {/* SCHEMES & SCHOLARSHIPS: ELIGIBILITY & INTERACTIVE BUILDERS */}
            {(selectedType === 'Scheme' || selectedType === 'Scholarship') && (
              <div className={`${ui.cardPad} space-y-6`}>
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                    <Sparkles size={16} className="text-gov-blue" />
                    Interactive Citizen Eligibility & Document Builder
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Configure the questions and document checklist evaluated dynamically in the Citizen UI.
                  </p>
                </div>

                {/* Custom Yes/No Questions Builder */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                    <span>1. Interactive Citizen Eligibility Questions (Yes/No)</span>
                    <span className="text-[10px] text-gray-400 font-normal">Configurable Expected Answer (Yes or No)</span>
                  </label>

                  <div className="space-y-2">
                    {form.eligibilityQuestions.map((q, idx) => (
                      <div key={q.id || idx} className="flex items-center justify-between gap-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100 text-xs">
                        <span className="text-gray-400 font-mono">Q{idx + 1}.</span>
                        <span className="flex-1 font-medium text-gray-800">{q.text}</span>
                        
                        {/* Toggle Expected Answer */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-500 font-medium">Expected:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newAns = (q.expectedAnswer || 'Yes') === 'Yes' ? 'No' : 'Yes';
                              setForm(p => ({
                                ...p,
                                eligibilityQuestions: p.eligibilityQuestions.map((item, i) => i === idx ? { ...item, expectedAnswer: newAns } : item)
                              }));
                            }}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                              (q.expectedAnswer || 'Yes') === 'Yes'
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                            title="Click to toggle between Expected: Yes / Expected: No"
                          >
                            {q.expectedAnswer || 'Yes'} ⟳
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setForm(p => ({ ...p, eligibilityQuestions: p.eligibilityQuestions.filter((_, i) => i !== idx) }))}
                          className="text-gray-400 hover:text-red-500 ml-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      className={`${ui.input} flex-1`}
                      placeholder="Add a new question for citizens (e.g. Is your annual family income above 5 Lakhs?)..."
                      value={newQText}
                      onChange={e => setNewQText(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <select
                        className="text-xs bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 font-semibold text-gray-700"
                        value={newQExpected}
                        onChange={e => setNewQExpected(e.target.value)}
                      >
                        <option value="Yes">Expect: Yes</option>
                        <option value="No">Expect: No</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          if (!newQText.trim()) return;
                          setForm(p => ({
                            ...p,
                            eligibilityQuestions: [...p.eligibilityQuestions, { id: `q${Date.now()}`, text: newQText.trim(), expectedAnswer: newQExpected }]
                          }));
                          setNewQText('');
                        }}
                        className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 whitespace-nowrap"
                      >
                        <Plus size={13} /> Add Question
                      </button>
                    </div>
                  </div>
                </div>

                {/* Required Documents Tag & Dropdown Builder */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-gray-700 block">2. Required Verification Documents Checklist</label>
                  
                  {/* Selected Tags */}
                  <div className="flex flex-wrap gap-2 min-h-[32px] p-2 bg-gray-50/70 border border-gray-200 rounded-lg">
                    {form.documentsRequired.length === 0 && (
                      <span className="text-xs text-gray-400 italic">No documents added yet. Select from dropdown below or type custom.</span>
                    )}
                    {form.documentsRequired.map((doc, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-medium">
                        {doc}
                        <button type="button" onClick={() => setForm(p => ({ ...p, documentsRequired: p.documentsRequired.filter((_, i) => i !== idx) }))} className="hover:text-red-500">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Dropdown Quick Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex gap-1.5">
                      <select
                        className="text-xs bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-gray-700 flex-1"
                        value={selectedStandardDoc}
                        onChange={e => {
                          const val = e.target.value;
                          setSelectedStandardDoc(val);
                          if (val && !form.documentsRequired.includes(val)) {
                            setForm(p => ({ ...p, documentsRequired: [...p.documentsRequired, val] }));
                            setSelectedStandardDoc('');
                          }
                        }}
                      >
                        <option value="">Choose standard document from list...</option>
                        {COMMON_GOV_DOCS.filter(d => !form.documentsRequired.includes(d)).map(d => (
                          <option key={d} value={d}>+ {d}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-1.5">
                      <input className={`${ui.input} text-xs`} placeholder="Or type custom document..." value={newDocTag} onChange={e => setNewDocTag(e.target.value)} />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newDocTag.trim()) return;
                          if (!form.documentsRequired.includes(newDocTag.trim())) {
                            setForm(p => ({ ...p, documentsRequired: [...p.documentsRequired, newDocTag.trim()] }));
                          }
                          setNewDocTag('');
                        }}
                        className="bg-gray-100 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200 flex items-center gap-1 whitespace-nowrap"
                      >
                        <Plus size={13} /> Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* How to Apply Steps */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 block">3. Numbered "How to Apply" Steps</label>
                  <div className="space-y-1.5">
                    {form.howToApply.map((step, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded border border-gray-100 text-xs">
                        <span className="font-bold text-gray-500">Step {idx + 1}:</span>
                        <span className="flex-1 text-gray-700">{step}</span>
                        <button type="button" onClick={() => setForm(p => ({ ...p, howToApply: p.howToApply.filter((_, i) => i !== idx) }))} className="text-gray-400 hover:text-red-500">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input className={ui.input} placeholder="Add next numbered application step..." value={newStep} onChange={e => setNewStep(e.target.value)} />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newStep.trim()) return;
                        setForm(p => ({ ...p, howToApply: [...p.howToApply, newStep.trim()] }));
                        setNewStep('');
                      }}
                      className="bg-gray-100 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200 flex items-center gap-1"
                    >
                      <Plus size={13} /> Add Step
                    </button>
                  </div>
                </div>

                {/* FAQs Builder */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 block">4. Accordion FAQs</label>
                  <div className="space-y-1.5">
                    {form.faqs.map((faq, idx) => (
                      <div key={idx} className="p-2 bg-gray-50 rounded border border-gray-100 text-xs space-y-1">
                        <div className="flex items-center justify-between font-semibold text-gray-800">
                          <span>Q: {faq.q}</span>
                          <button type="button" onClick={() => setForm(p => ({ ...p, faqs: p.faqs.filter((_, i) => i !== idx) }))} className="text-gray-400 hover:text-red-500">
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <p className="text-gray-600">A: {faq.a}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input className={ui.input} placeholder="Question..." value={newFaqQ} onChange={e => setNewFaqQ(e.target.value)} />
                    <input className={ui.input} placeholder="Answer..." value={newFaqA} onChange={e => setNewFaqA(e.target.value)} />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newFaqQ.trim() || !newFaqA.trim()) return;
                      setForm(p => ({ ...p, faqs: [...p.faqs, { q: newFaqQ.trim(), a: newFaqA.trim() }] }));
                      setNewFaqQ('');
                      setNewFaqA('');
                    }}
                    className="bg-gray-100 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200 flex items-center gap-1"
                  >
                    <Plus size={13} /> Add FAQ Item
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: File Drop & Actions */}
          <div className="lg:col-span-2 space-y-4">
            {/* Drop Zone */}
            <div

              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]); }}
              className={ui.dropzone(dragging)}
            >
              <input ref={fileRef} type="file" accept={ACCEPTED} className="hidden"
                onChange={e => { if (e.target.files[0]) handleFileSelect(e.target.files[0]); e.target.value = ''; }} />
              <div onClick={() => fileRef.current?.click()} className="cursor-pointer">
                <div className={ui.dropzoneIconWrap}><Upload size={26} className="text-gov-blue" /></div>
                <h3 className="font-semibold text-gray-700 mb-1 text-sm">Drop official PDF document here</h3>
                <p className="text-xs text-gray-400">PDF documents only for structured text extraction</p>
                <div className="mt-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-gray-300 text-gov-blue px-3 py-1.5 rounded-lg shadow-sm hover:bg-gov-blue-50">
                    <Upload size={13} /> Browse & Select File
                  </span>
                </div>
              </div>
              {errors.file && <p className="text-xs text-red-500 mt-2 flex items-center gap-1 justify-center"><AlertCircle size={11} />{errors.file}</p>}
            </div>

            {/* Selected File Details & Explicit AI Extraction Button */}
            {file && (
              <div className={`${ui.cardPad} space-y-3`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-600">Attached File</p>
                  <button type="button" onClick={() => { setFile(null); setAiFields({}); }} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  <FileText size={18} className="text-gov-blue flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{file.name}</p>
                    <p className="text-[10px] text-gray-400">{formatBytes(file.size)}</p>
                  </div>
                </div>

                {/* Explicit AI Extract & Auto-Fill Action */}
                <button
                  type="button"
                  onClick={() => runAiExtraction(file)}
                  disabled={extracting}
                  className="w-full bg-gradient-to-r from-gov-blue to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-semibold py-2 px-3 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {extracting ? <Loader size={14} className="animate-spin" /> : <Sparkles size={14} className="text-amber-300" />}
                  {extracting ? 'AI Extracting Metadata...' : 'AI Extract & Auto-Fill'}
                </button>
                <p className="text-[10px] text-gray-400 text-center leading-tight">
                  Analyzes PDF content using Gemini and auto-populates relevant fields based on document type.
                </p>
              </div>
            )}

            {/* 3 Independent Workflow Actions */}
            <div className={`${ui.cardPad} space-y-3`}>
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Publishing Actions</h4>
              
              {/* Action 1: Upload (Direct Publish) */}
              <button
                type="button"
                onClick={() => handleAction('UPLOAD')}
                disabled={submitting || !file}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 text-xs py-2.5 font-semibold"
              >
                {submitting ? <Loader size={14} className="animate-spin" /> : <Upload size={14} />}
                Upload & Publish
              </button>

              {/* Action 2: Review Queue */}
              <button
                type="button"
                onClick={() => handleAction('REVIEW_QUEUE')}
                disabled={submitting || !file}
                className="w-full border border-gov-blue/40 bg-blue-50/50 hover:bg-blue-50 text-gov-blue font-semibold rounded-lg text-xs py-2 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Layers size={14} />
                Send to Review Queue
              </button>

              {/* Action 3: Save Draft */}
              <button
                type="button"
                onClick={() => handleAction('SAVE_DRAFT')}
                disabled={submitting || !file}
                className="w-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-semibold rounded-lg text-xs py-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Save as Draft
              </button>

              <div className="border-t border-gray-100 pt-2 space-y-1">
                <p className="text-[10px] text-gray-500 leading-tight">
                  • <strong>Upload & Publish:</strong> Direct live publication to citizen views.
                </p>
                <p className="text-[10px] text-gray-500 leading-tight">
                  • <strong>Review Queue:</strong> Queued as PENDING_REVIEW for Data Managers.
                </p>
                <p className="text-[10px] text-gray-500 leading-tight">
                  • <strong>Save Draft:</strong> Saved privately to your account only.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataIngestion;



