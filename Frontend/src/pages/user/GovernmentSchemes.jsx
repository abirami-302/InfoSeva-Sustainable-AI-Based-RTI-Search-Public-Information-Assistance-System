import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Bookmark, ExternalLink, Users, Calendar, ChevronDown,
  CheckCircle2, FileText, Landmark, Layers, X, ShieldCheck,
  XCircle, RotateCcw, ArrowRight, ArrowLeft
} from 'lucide-react';
import { PageHeader, Pagination, BackNavigation } from '../../components/common';
import { usePagination } from '../../hooks/usePagination';
import { schemes } from '../../data/dummyData';
import { useDataManager } from '../../context/DataManagerContext';
import { toSchemeCards } from '../../utils/dataManagerAdapter';

const CATEGORIES = ['All', 'Agriculture', 'Health', 'Housing', 'Education', 'Finance', 'Energy'];

const CATEGORY_COLORS = {
  Agriculture: 'bg-green-50 text-green-700 border-green-200',
  Health: 'bg-red-50 text-red-700 border-red-200',
  Housing: 'bg-blue-50 text-blue-700 border-blue-200',
  Education: 'bg-purple-50 text-purple-700 border-purple-200',
  Finance: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  Energy: 'bg-orange-50 text-orange-700 border-orange-200',
};

const DEFAULT_DOCS = ['Aadhaar Card', 'Bank Passbook', 'Land Records / Proof', 'Income Certificate'];

// Ensures the apply link always opens correctly in a new tab, even if the
// source data is missing the protocol (e.g. "pmkisan.gov.in" instead of
// "https://pmkisan.gov.in").
function normalizeLink(url) {
  if (!url || typeof url !== 'string') return null;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

// Builds a yes/no eligibility question set for a scheme.
// If the scheme provides its own `eligibilityQuestions` array (recommended
// for schemes with well-defined criteria, like the CM Krishi Samuh Yojana
// example), that is used as-is. Otherwise a sensible generic set is
// generated from the scheme's `eligibility` summary string.
function buildEligibilityQuestions(scheme) {
  if (Array.isArray(scheme.eligibilityQuestions) && scheme.eligibilityQuestions.length > 0) {
    return scheme.eligibilityQuestions.map((q, i) => {
      if (typeof q === 'string') return { id: `q${i}`, text: q, expectedAnswer: 'Yes' };
      return { id: q.id || `q${i}`, text: q.text || q.question, expectedAnswer: q.expectedAnswer || 'Yes' };
    });
  }
  return [
    { id: 'resident', text: 'Are you a permanent resident of India?', expectedAnswer: 'Yes' },
    { id: 'criteria', text: `Do you meet this eligibility requirement: "${scheme.eligibility}"?`, expectedAnswer: 'Yes' },
    { id: 'docs', text: 'Can you provide the required documents (Aadhaar, Bank Passbook, Income Certificate, etc.) if asked?', expectedAnswer: 'Yes' },
    { id: 'accuracy', text: 'Do you agree to provide accurate information during the application process?', expectedAnswer: 'Yes' },
  ];
}

// ─── Eligibility Checker Modal ─────────────────────────────────────────────────

function EligibilityModal({ scheme, onClose }) {
  const questions = useMemo(() => buildEligibilityQuestions(scheme), [scheme]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const applyHref = normalizeLink(scheme.applyLink);
  const allAnswered = questions.every((q) => answers[q.id]);
  const failedQuestions = questions.filter((q) => answers[q.id] && answers[q.id] !== (q.expectedAnswer || 'Yes'));
  const isEligible = submitted && failedQuestions.length === 0;
  const isNotEligible = submitted && failedQuestions.length > 0;


  const setAnswer = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setSubmitted(false);
  };

  const handleSubmit = () => {
    if (!allAnswered) return;
    setSubmitted(true);
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-gov-blue" />
            <h3 className="font-bold text-gray-800 text-base">Check Eligibility</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          <p className="text-center font-bold text-gov-green text-lg mb-5">{scheme.name}</p>

          {!submitted && (
            <div className="space-y-5">
              {questions.map((q) => (
                <div key={q.id}>
                  <p className="text-sm text-gray-700 mb-2">{q.text}</p>
                  <div className="flex items-center gap-6">
                    {['Yes', 'No'].map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer select-none">
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            answers[q.id] === opt ? 'border-gov-green' : 'border-gray-300'
                          }`}
                        >
                          {answers[q.id] === opt && <span className="w-2 h-2 rounded-full bg-gov-green" />}
                        </span>
                        <input
                          type="radio"
                          name={q.id}
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={() => setAnswer(q.id, opt)}
                          className="sr-only"
                        />
                        <span className="text-sm text-gray-600">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Result */}
          <AnimatePresence>
            {isEligible && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-green-200 bg-green-50 p-4 mt-2"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <CheckCircle2 size={18} className="text-green-600" />
                  <p className="text-sm font-bold text-green-700">You appear to be eligible!</p>
                </div>
                <p className="text-xs text-green-700 leading-relaxed">
                  Based on your answers, you meet the eligibility criteria for <strong>{scheme.name}</strong>.
                  You can proceed to the official application portal below.
                </p>
              </motion.div>
            )}

            {isNotEligible && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-red-200 bg-red-50 p-4 mt-2"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <XCircle size={18} className="text-red-600" />
                  <p className="text-sm font-bold text-red-700">You may not be eligible</p>
                </div>
                <p className="text-xs text-red-600 mb-2 leading-relaxed">
                  Your answers to the following did not meet the criteria for this scheme:
                </p>
                <ul className="space-y-1">
                  {failedQuestions.map((q) => (
                    <li key={q.id} className="text-xs text-red-600 flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 flex-shrink-0" /> {q.text}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-red-500 mt-2">
                  You can still review the scheme details, or check other schemes that may suit you better.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          {!submitted ? (
            <>
              <button
                onClick={handleSubmit}
                disabled={!allAnswered}
                className="bg-gov-green text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Submit
              </button>
              <button
                onClick={handleReset}
                className="border border-gray-300 text-gray-600 text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw size={13} /> Reset
              </button>
            </>
          ) : (
            <>
              {isEligible && applyHref ? (
                <a
                  href={applyHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gov-blue text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-gov-blue-dark transition-colors flex items-center gap-2"
                >
                  Proceed to Apply <ArrowRight size={14} />
                </a>
              ) : isEligible && !applyHref ? (
                <span className="bg-gray-100 text-gray-400 text-sm font-semibold px-5 py-2.5 rounded-lg cursor-not-allowed">
                  Application link unavailable
                </span>
              ) : null}
              <button
                onClick={handleReset}
                className="border border-gray-300 text-gray-600 text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw size={13} /> Re-check
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Sidebar ────────────────────────────────────────────────────────────────────

function CategorySidebar({ category, setCategory, counts, total }) {
  return (
    <aside className="hidden lg:block w-56 flex-shrink-0">
      <div className="card p-4 sticky top-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Layers size={13} /> Categories
        </p>
        <nav className="space-y-1">
          {CATEGORIES.map((cat) => {
            const isActive = category === cat;
            const count = cat === 'All' ? total : counts[cat] || 0;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-gov-blue text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

// ─── Scheme Card ────────────────────────────────────────────────────────────────

function SchemeCard({ scheme, onCheckEligibility }) {
  const [expanded, setExpanded] = useState(false);
  
  // Real dynamic bookmark state connected to localStorage
  const [bookmarked, setBookmarked] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('userBookmarks') || '[]');
      return saved.some(b => String(b.id) === String(scheme.id) || String(b.realId) === String(scheme.realId));
    } catch {
      return false;
    }
  });

  const toggleBookmark = (e) => {
    e.stopPropagation();
    try {
      const saved = JSON.parse(localStorage.getItem('userBookmarks') || '[]');
      let updated;
      if (bookmarked) {
        updated = saved.filter(b => String(b.id) !== String(scheme.id) && String(b.realId) !== String(scheme.realId));
        setBookmarked(false);
      } else {
        const itemToSave = {
          id: scheme.id,
          realId: scheme.realId,
          title: scheme.name,
          type: scheme.documentType || 'Scheme',
          dept: scheme.ministry || scheme.department || 'Government of India',
          saved: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          route: `/user/schemes/${scheme.slug || scheme.id}`,
        };
        updated = [itemToSave, ...saved];
        setBookmarked(true);
      }
      localStorage.setItem('userBookmarks', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('toast', { detail: bookmarked ? 'Scheme removed from bookmarks' : 'Scheme added to bookmarks' }));
    } catch (err) {
      console.error('Failed to update bookmark', err);
    }
  };

  const catColor = CATEGORY_COLORS[scheme.category] || 'bg-gray-50 text-gray-600 border-gray-200';

  return (
    <motion.div layout className="card p-0 overflow-hidden border border-gray-100 hover:border-gov-blue/30 hover:shadow-md transition-all">
      <div className="p-5 flex flex-col sm:flex-row gap-5">

        {/* Icon block */}
        <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2 sm:w-28 flex-shrink-0">
          <div className="w-11 h-11 rounded-xl bg-gov-blue-50 flex items-center justify-center flex-shrink-0">
            <Landmark size={20} className="text-gov-blue" />
          </div>
          <div className="sm:mt-1">
            <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Benefit</p>
            <p className="text-base font-bold text-gov-blue leading-tight">{scheme.benefit}</p>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${catColor}`}>{scheme.category}</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> {scheme.status}
            </span>
          </div>

          <h3 className="font-bold text-gray-900 text-base leading-snug">{scheme.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{scheme.ministry}</p>

          {/* Eligibility summary — shown up front */}
          <div className="mt-3 flex items-start gap-2 bg-gray-50 rounded-lg p-2.5">
            <CheckCircle2 size={14} className="text-gov-green mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-600 leading-relaxed">{scheme.eligibility}</p>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Users size={13} className="text-gray-400" />
              <span className="font-medium text-gray-700">{scheme.beneficiaries}</span> beneficiaries
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar size={13} className="text-gray-400" />
              Launched <span className="font-medium text-gray-700">{scheme.launched}</span>
            </div>
          </div>

          {/* Expandable details */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <FileText size={12} /> Required Documents
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(scheme.documentsRequired && scheme.documentsRequired.length > 0 ? scheme.documentsRequired : DEFAULT_DOCS).map((doc) => (
                      <span key={doc} className="text-xs bg-gray-50 border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full">
                        {doc}
                      </span>
                    ))}
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gov-blue transition-colors"
            >
              {expanded ? 'Hide documents' : 'View documents'}
              <ChevronDown size={13} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>

            <button
              onClick={toggleBookmark}
              className={`flex items-center gap-1 text-xs font-semibold transition-colors ${bookmarked ? 'text-gov-saffron' : 'text-gray-400 hover:text-gov-saffron'}`}
            >
              <Bookmark size={13} fill={bookmarked ? 'currentColor' : 'none'} />
              {bookmarked ? 'Saved' : 'Save'}
            </button>

            <div className="flex-1" />

            <Link
              to={`/user/schemes/${scheme.slug || scheme.id}`}
              className="flex items-center gap-1.5 text-xs font-semibold text-gov-blue hover:underline"
            >
              View Details
            </Link>

            {/* Apply Now now opens the eligibility checker first */}
            <button
              onClick={() => onCheckEligibility(scheme)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-gov-blue text-white px-4 py-2 rounded-lg hover:bg-gov-blue-dark transition-colors"
            >
              Apply Now <ExternalLink size={12} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────────

export default function GovernmentSchemes() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [checkingScheme, setCheckingScheme] = useState(null);

  const { manualRecords, bulkRecords, apiRecords } = useDataManager();
  const allSchemes = useMemo(() => {
    return [...schemes, ...toSchemeCards({ manualRecords, bulkRecords, apiRecords })];
  }, [manualRecords, bulkRecords, apiRecords]);



  const counts = useMemo(() => {
    const c = {};
    allSchemes.forEach((s) => { c[s.category] = (c[s.category] || 0) + 1; });
    return c;
  }, [allSchemes]);

  const filtered = allSchemes.filter(
    (s) =>
      (category === 'All' || s.category === category) &&
      (s.name.toLowerCase().includes(search.toLowerCase()) || s.ministry.toLowerCase().includes(search.toLowerCase()))
  );

  const { page, setPage, pageItems } = usePagination(filtered, 6);

  // Reset to page 1 whenever category or search changes
  useEffect(() => {
    setPage(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, search]);

  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      {/* Dual Back Navigation */}
      <BackNavigation dashboardPath="/user" />

      <PageHeader title="Government Schemes" subtitle="Discover 1,247+ central and state government schemes. Check eligibility and apply directly." />

      {/* Search bar */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-gov-blue/30 focus-within:border-gov-blue">
            <Search size={17} className="ml-3 text-gray-400 flex-shrink-0" />
            <input
              className="flex-1 px-3 py-2.5 text-sm outline-none"
              placeholder="Search schemes by name, ministry, or benefit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="mr-3 text-gray-300 hover:text-gray-500">
                <X size={15} />
              </button>
            )}
          </div>

          {/* Mobile category select */}
          <div className="flex lg:hidden gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors ${
                  category === cat ? 'bg-gov-blue text-white border-gov-blue' : 'bg-white text-gray-500 border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content: sidebar + list */}
      <div className="flex gap-5 items-start">
        <CategorySidebar category={category} setCategory={setCategory} counts={counts} total={allSchemes.length} />

        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-800">{filtered.length}</span> scheme{filtered.length !== 1 ? 's' : ''}
              {category !== 'All' ? ` in ${category}` : ''}
            </p>
          </div>

          <motion.div layout className="space-y-4">
            {pageItems.map((scheme, i) => (
              <motion.div key={scheme.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} layout>
                <SchemeCard scheme={scheme} onCheckEligibility={setCheckingScheme} />
              </motion.div>
            ))}
          </motion.div>

          {filtered.length > 0 && (
            <Pagination page={page} totalItems={filtered.length} pageSize={6} onPageChange={setPage} />
          )}

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-400 text-sm">
                No schemes found for "<span className="font-medium text-gray-600">{search}</span>"
              </p>
              <button
                onClick={() => { setSearch(''); setCategory('All'); }}
                className="mt-3 text-gov-blue text-sm hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Eligibility Checker Modal */}
      <AnimatePresence>
        {checkingScheme && (
          <EligibilityModal scheme={checkingScheme} onClose={() => setCheckingScheme(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}