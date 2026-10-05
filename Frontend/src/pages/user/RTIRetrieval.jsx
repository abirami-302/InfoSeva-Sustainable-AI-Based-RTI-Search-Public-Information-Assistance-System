import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Loader,
  ChevronRight,
  FileText,
  Lightbulb,
  ShieldCheck,
  Users,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Pagination, BackNavigation } from '../../components/common';
import { usePagination } from '../../hooks/usePagination';

const STEPS = ['Search Question', 'Find Similar RTIs', 'View Response', 'AI Analysis'];

// Helper to format source_type badge
function SourceTypeBadge({ sourceType }) {
  const norm = String(sourceType || '').toUpperCase();
  if (norm === 'GOVERNMENT_VERIFIED') {
    return (
      <span className="badge bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 font-semibold text-xs py-0.5 px-2">
        <ShieldCheck size={12} className="text-emerald-700" />
        Government Verified
      </span>
    );
  }
  if (norm === 'COMMUNITY_SOURCED') {
    return (
      <span className="badge bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1 font-semibold text-xs py-0.5 px-2">
        <Users size={12} className="text-sky-700" />
        Community Sourced
      </span>
    );
  }
  return (
    <span className="badge bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-1 font-medium text-xs py-0.5 px-2">
      <HelpCircle size={12} className="text-gray-500" />
      Official Record
    </span>
  );
}

export default function RTIRetrieval() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [results, setResults] = useState([]);
  const [selectedRTI, setSelectedRTI] = useState(null);
  const { page, setPage, pageItems } = usePagination(results, 4);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setSearchError(null);

    try {
      const response = await fetch('http://localhost:8000/api/v1/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: trimmed,
          topK: 10,
        }),
      });

      if (!response.ok) {
        throw new Error(`Search service responded with status ${response.status}`);
      }

      const data = await response.json();
      const rawResults = Array.isArray(data.results) ? data.results : [];

      const mappedResults = rawResults.map((item, index) => {
        const docId = item.documentId || `doc-${index}`;
        const cleanDate = item.date && item.date !== 'N/A' ? item.date : new Date().toISOString().slice(0, 10);
        return {
          id: docId,
          documentId: docId,
          question: item.title || 'Official Government Record / RTI Disclosure',
          department: item.department || 'Government of India',
          dateFiled: cleanDate,
          dateReceived: cleanDate,
          status: 'Available',
          summary: item.snippet || 'No excerpt available for this document chunk.',
          rtiNumber: `INFOSEVA/REC/${docId.replace(/^doc_/, '').slice(0, 8).toUpperCase()}`,
          score: typeof item.score === 'number' ? item.score : 0.6,
          sourceType: item.sourceType || 'UNCLASSIFIED',
        };
      });

      setResults(mappedResults);
      setStep(1);
    } catch (err) {
      console.error('RTI search error:', err);
      setSearchError('Unable to connect to the knowledge retrieval service. Please try again.');
      setResults([]);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRTI = (rti) => {
    setSelectedRTI(rti);
    setStep(2);
    setTimeout(() => setStep(3), 600);
  };

  const reset = () => {
    setQuery('');
    setStep(0);
    setResults([]);
    setSelectedRTI(null);
    setSearchError(null);
  };

  return (
    <div className="space-y-5">
      {/* Dual Back Navigation */}
      <BackNavigation dashboardPath="/user" />

      <PageHeader
        title="RTI Retrieval & Analysis"
        subtitle="Search previous RTI responses and official disclosures before filing a new application — reduce duplicates, save time."
      />

      {/* Stepper */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                  ${
                    step > i
                      ? 'bg-gov-green text-white'
                      : step === i
                      ? 'bg-gov-blue text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {step > i ? <CheckCircle size={15} /> : i + 1}
                </div>
                <span
                  className={`text-xs font-medium hidden md:block transition-colors ${
                    step >= i ? 'text-gray-800' : 'text-gray-400'
                  }`}
                >
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-colors ${
                    step > i ? 'bg-gov-green' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step 0: Search */}
      {step === 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-1">What information are you looking for?</h3>
          <p className="text-sm text-gray-500 mb-4">
            Describe your question in simple language. We'll search published RTI responses, proactive disclosures, and government decisions.
          </p>
          <textarea
            className="input-field mb-4 resize-none"
            rows={4}
            placeholder="e.g., What are the PM Kisan scheme guidelines? What are citizen service centre operating rules or scholarship guidelines?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="btn-primary flex items-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader size={15} className="animate-spin" /> : <Search size={15} />}
              Search RTI Database
            </button>
            <button
              onClick={() => navigate('/user/rti-draft')}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <FileText size={15} /> Draft New RTI Instead
            </button>
          </div>
          <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
            <Lightbulb size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-700 mb-1">Did you know?</p>
              <p className="text-xs text-amber-600">
                Thousands of government orders and RTI disclosures are indexed. Searching first can save you 30 days of waiting for a reply.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-400 mb-2 font-medium">Try these example queries:</p>
            <div className="flex gap-2 flex-wrap">
              {[
                'PM Kisan Guidelines',
                'Citizen Service Centre Guidelines',
                'Official Gazette Notification',
                'Community RTI Filing Guidelines',
              ].map((ex) => (
                <button
                  key={ex}
                  onClick={() => setQuery(ex)}
                  className="text-xs bg-gov-blue-50 text-gov-blue px-3 py-1.5 rounded-full font-medium hover:bg-gov-blue hover:text-white transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card p-8 flex flex-col items-center gap-4">
          <div className="w-14 h-14 bg-gov-blue-50 rounded-full flex items-center justify-center">
            <Loader size={28} className="text-gov-blue animate-spin" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-800">Searching Knowledge Base...</p>
            <p className="text-sm text-gray-400 mt-1">
              Performing semantic vector matching across verified government documents and community archives
            </p>
          </div>
        </div>
      )}

      {/* Step 1: Results */}
      {step === 1 && !loading && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Found <span className="font-bold text-gray-800">{results.length}</span> matching record{results.length === 1 ? '' : 's'} for{' '}
              <span className="font-semibold text-gov-blue">"{query}"</span>
            </p>
            <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600 underline">
              New Search
            </button>
          </div>

          {searchError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {results.length === 0 ? (
            <div className="card p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-gov-blue-50 rounded-full flex items-center justify-center mx-auto text-gov-blue">
                <Search size={24} />
              </div>
              <h4 className="font-semibold text-gray-800 text-base">No previous RTI responses or disclosures found</h4>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                We couldn't find any existing documents directly answering your query. You can proceed directly to file a fresh RTI application.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => navigate('/user/rti-draft')}
                  className="btn-saffron text-sm flex items-center gap-1.5"
                >
                  Generate RTI Draft Now <ArrowRight size={14} />
                </button>
                <button onClick={reset} className="btn-secondary text-sm">
                  Try Another Query
                </button>
              </div>
            </div>
          ) : (
            <>
              {pageItems.map((rti, i) => (
                <motion.div
                  key={rti.id || i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="card p-5 group cursor-pointer hover:-translate-y-0.5 transition-transform"
                  onClick={() => handleSelectRTI(rti)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="badge bg-green-100 text-green-700 font-semibold text-xs">
                          {Math.round((rti.score || 0.6) * 100)}% Match
                        </span>
                        <SourceTypeBadge sourceType={rti.sourceType} />
                        <span className="text-xs text-gray-400 font-mono">{rti.rtiNumber}</span>
                      </div>
                      <h3 className="font-semibold text-gray-800 group-hover:text-gov-blue transition-colors text-sm mb-1">
                        {rti.question}
                      </h3>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                        {rti.summary}
                      </p>
                      <p className="text-xs text-gray-400">
                        {rti.department} · Indexed: {new Date(rti.dateFiled).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-gov-blue transition-colors mt-1 flex-shrink-0" />
                  </div>
                </motion.div>
              ))}

              <Pagination page={page} totalItems={results.length} pageSize={4} onPageChange={setPage} />

              <div className="card p-4 border-dashed flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Need specific information not covered above?</p>
                  <p className="text-xs text-gray-400">File a new RTI application with our AI-powered draft generator</p>
                </div>
                <button onClick={() => navigate('/user/rti-draft')} className="btn-saffron text-sm flex items-center gap-1.5">
                  Generate RTI Draft <ArrowRight size={14} />
                </button>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Step 2/3: RTI Detail & Analysis */}
      {(step === 2 || step === 3) && selectedRTI && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setStep(1)} className="text-sm text-gov-blue hover:underline flex items-center gap-1">
              ← Back to results
            </button>
            <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600 underline">
              New Search
            </button>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="badge bg-green-100 text-green-700 font-semibold text-xs">
                {Math.round((selectedRTI.score || 0.6) * 100)}% Match
              </span>
              <SourceTypeBadge sourceType={selectedRTI.sourceType} />
              <span className="text-xs text-gray-400 font-mono">{selectedRTI.rtiNumber}</span>
            </div>
            <h2 className="font-bold text-gray-900 mb-3">{selectedRTI.question}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Department / Authority', value: selectedRTI.department },
                {
                  label: 'Record Date',
                  value: new Date(selectedRTI.dateFiled).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }),
                },
                {
                  label: 'Source Classification',
                  value:
                    selectedRTI.sourceType === 'GOVERNMENT_VERIFIED'
                      ? 'Government Verified'
                      : selectedRTI.sourceType === 'COMMUNITY_SOURCED'
                      ? 'Community Sourced'
                      : 'Official Record',
                },
              ].map((d) => (
                <div key={d.label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{d.label}</p>
                  <p className="text-xs font-semibold text-gray-800">{d.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Matching Content / Proactive Disclosure
              </p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{selectedRTI.summary}</p>
            </div>
          </div>

          {/* AI Analysis */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-5 border-l-4 border-gov-blue"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-gov-blue rounded-lg flex items-center justify-center">
                  <Sparkles size={16} className="text-white" />
                </div>
                <span className="font-semibold text-gov-blue text-sm">InfoSeva AI Analysis</span>
              </div>
              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  {selectedRTI.score >= 0.65 ? (
                    <>
                      This document <strong>strongly matches</strong> your query regarding <em>"{query}"</em>.
                    </>
                  ) : (
                    <>
                      This document contains <strong>relevant contextual information</strong> related to <em>"{query}"</em>.
                    </>
                  )}
                </p>

                {selectedRTI.sourceType === 'GOVERNMENT_VERIFIED' ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex gap-2">
                    <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-green-700">
                      <strong>Government Verified Record:</strong> This information is sourced directly from authenticated public orders and official disclosures. You may already have the information you need without filing an RTI.
                    </p>
                  </div>
                ) : selectedRTI.sourceType === 'COMMUNITY_SOURCED' ? (
                  <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 flex gap-2">
                    <Users size={16} className="text-sky-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-sky-700">
                      <strong>Community Sourced Record:</strong> This answer is based on community RTI queries. If you require legally binding government confirmation, consider filing a formal application below.
                    </p>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
                    <CheckCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700">
                      Public information is available in this official document. Review the excerpt above before filing a duplicate application.
                    </p>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                  <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    If your specific questions remain unanswered or you require up-to-date data for this financial year, you can proceed to draft a formal RTI application.
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/user/rti-draft')}
                className="mt-4 btn-saffron text-sm flex items-center gap-2"
              >
                <FileText size={14} /> Generate Fresh RTI Draft
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
