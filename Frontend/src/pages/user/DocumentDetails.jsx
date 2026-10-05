import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, FileText, CheckCircle2, Building2, Bookmark, Download, BookOpen,
} from 'lucide-react';
import { PageHeader, LoadingSkeleton, EmptyState, BackNavigation } from '../../components/common';
import { getDocumentById, recordDocumentView } from '../../api/documentApi';
import { getSchemeById } from '../../api/schemesApi';

export default function DocumentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [relatedScheme, setRelatedScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getDocumentById(id)
      .then((data) => {
        if (cancelled) return;
        setDoc(data);
        recordDocumentView(id);
        if (data.relatedSchemeId) {
          getSchemeById(data.relatedSchemeId).then((s) => !cancelled && setRelatedScheme(s)).catch(() => {});
        }
      })
      .catch(() => !cancelled && setError('This document could not be found.'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Loading document..." />
        <div className="card p-6"><LoadingSkeleton lines={6} /></div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <EmptyState
        icon={FileText}
        title="Document not found"
        description="The document you're looking for doesn't exist or may have been removed."
        action={<button onClick={() => navigate('/user/search')} className="btn-primary px-5 py-2">Back to Search</button>}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Dual Back Navigation */}
      <BackNavigation dashboardPath="/user" />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-5 gap-5">
        {/* Left: details */}
        <div className="lg:col-span-3 card p-6">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-gov-blue-50 text-gov-blue">
              {doc.documentType || doc.category}
            </span>
            {doc.reviewStatus && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                {doc.reviewStatus === 'APPROVED' ? 'Approved & Published' : doc.reviewStatus}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">{doc.title}</h1>
          <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
            <Building2 size={14} /> {doc.departmentName || doc.department || 'General Administration'}
          </p>

          {/* Document-Type Specific Structured Metadata Block */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50/80 border border-gray-100 rounded-xl p-4 mt-5">
            {doc.goNumber && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">GO Number</p>
                <p className="text-xs font-semibold text-gray-800 mt-0.5">{doc.goNumber}</p>
              </div>
            )}
            {doc.notificationNumber && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Notification No.</p>
                <p className="text-xs font-semibold text-gray-800 mt-0.5">{doc.notificationNumber}</p>
              </div>
            )}
            {doc.circularNumber && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Circular Number</p>
                <p className="text-xs font-semibold text-gray-800 mt-0.5">{doc.circularNumber}</p>
              </div>
            )}
            {doc.actNumber && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Act Number</p>
                <p className="text-xs font-semibold text-gray-800 mt-0.5">{doc.actNumber}</p>
              </div>
            )}
            {doc.actYear && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Act Year</p>
                <p className="text-xs font-semibold text-gray-800 mt-0.5">{doc.actYear}</p>
              </div>
            )}
            {doc.issueDate && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Issue Date</p>
                <p className="text-xs font-semibold text-gray-800 mt-0.5">{doc.issueDate}</p>
              </div>
            )}
            {doc.targetAudience && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Target Audience</p>
                <p className="text-xs font-semibold text-gray-800 mt-0.5">{doc.targetAudience}</p>
              </div>
            )}
            {doc.uploadDate && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Date Published</p>
                <p className="text-xs font-semibold text-gray-800 mt-0.5">{String(doc.uploadDate)}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Published By</p>
              <p className="text-xs font-semibold text-gray-800 mt-0.5">{doc.approvedBy || doc.createdBy || 'InfoSeva Data Manager'}</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed mt-5">{doc.description}</p>

          {/* Directives / Subject content if present */}
          {doc.directives && (
            <div className="mt-5 bg-blue-50/50 border border-blue-100 rounded-xl p-4">
              <h3 className="text-xs font-bold text-gov-blue uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <FileText size={14} /> Official Directives & Guidelines
              </h3>
              <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{doc.directives}</p>
            </div>
          )}

          {doc.documentsRequired && doc.documentsRequired.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <FileText size={15} className="text-gov-blue" /> Documents Required
              </h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {doc.documentsRequired.map((d) => (
                  <div key={d} className="flex items-center gap-2 text-sm text-gray-600 bg-gov-blue-50/50 rounded-lg px-3 py-2">
                    <CheckCircle2 size={14} className="text-gov-blue flex-shrink-0" /> {d}
                  </div>
                ))}
              </div>
            </div>
          )}

          {doc.howToApply && doc.howToApply.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-gray-800 mb-3">How to Proceed / Apply</h3>
              <ol className="space-y-2.5">
                {doc.howToApply.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-600">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gov-blue text-white text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {relatedScheme && (
            <div className="mt-6 border-t border-gray-100 pt-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Related Scheme</p>
              <Link
                to={`/user/schemes/${relatedScheme.slug || relatedScheme.id}`}
                className="flex items-start gap-3 bg-gray-50 hover:bg-gov-blue-50 rounded-xl p-4 transition-colors group"
              >
                <BookOpen size={16} className="text-gov-blue flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-800 group-hover:text-gov-blue">{relatedScheme.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{relatedScheme.ministry}</p>
                </div>
              </Link>
            </div>
          )}

          <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100">
            <button 
              onClick={() => {
                try {
                  const saved = JSON.parse(localStorage.getItem('userBookmarks') || '[]');
                  const exists = saved.some(b => String(b.id) === String(doc.documentId || doc.id));
                  let updated;
                  if (exists) {
                    updated = saved.filter(b => String(b.id) !== String(doc.documentId || doc.id));
                  } else {
                    const itemToSave = {
                      id: doc.documentId || doc.id,
                      title: doc.title,
                      type: doc.documentType || doc.category || 'Document',
                      dept: doc.departmentName || doc.department || 'General Administration',
                      saved: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                      route: `/user/documents/${doc.documentId || doc.id}`,
                    };
                    updated = [itemToSave, ...saved];
                  }
                  localStorage.setItem('userBookmarks', JSON.stringify(updated));
                  // force re-render
                  setDoc(d => ({ ...d, _saved: !exists }));
                } catch (_) {}
              }}
              className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                (() => {
                  try {
                    const saved = JSON.parse(localStorage.getItem('userBookmarks') || '[]');
                    return saved.some(b => String(b.id) === String(doc.documentId || doc.id));
                  } catch { return false; }
                })() ? 'text-gov-saffron' : 'text-gray-500 hover:text-gov-saffron'
              }`}
            >
              <Bookmark size={14} fill={(() => {
                try {
                  const saved = JSON.parse(localStorage.getItem('userBookmarks') || '[]');
                  return saved.some(b => String(b.id) === String(doc.documentId || doc.id));
                } catch { return false; }
              })() ? 'currentColor' : 'none'} />
              {(() => {
                try {
                  const saved = JSON.parse(localStorage.getItem('userBookmarks') || '[]');
                  return saved.some(b => String(b.id) === String(doc.documentId || doc.id));
                } catch { return false; }
              })() ? 'Saved' : 'Save for later'}
            </button>
          </div>

        </div>

        {/* Right: document preview / download */}
        <div className="lg:col-span-2">
          <div className="card p-0 overflow-hidden sticky top-6">
            <div className="bg-gov-blue-dark text-white px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold flex items-center gap-2"><FileText size={15} /> Document Preview</span>
              {doc.fileName && (
                <a
                  href={`http://localhost:8082/api/documents/download/${doc.fileName}${localStorage.getItem('infoseva_access_token') || sessionStorage.getItem('jwt_token') ? `?token=${localStorage.getItem('infoseva_access_token') || sessionStorage.getItem('jwt_token')}` : ''}`}
                  target="_blank"
                  rel="noreferrer"
                  download={doc.title || doc.fileName}
                  className="text-white/70 hover:text-white transition-colors p-1"
                  title="Download document"
                >
                  <Download size={16} />
                </a>
              )}
            </div>
            {doc.fileName ? (
              <div className="p-4 bg-gray-50 flex flex-col items-center justify-center min-h-[300px] text-center">
                <FileText size={48} className="text-gov-blue mb-3 opacity-70" />
                <p className="text-sm font-semibold text-gray-800 mb-1">{doc.title}</p>
                <p className="text-xs text-gray-400 mb-4">{doc.fileName}</p>
                <a
                  href={`http://localhost:8082/api/documents/download/${doc.fileName}${localStorage.getItem('infoseva_access_token') || sessionStorage.getItem('jwt_token') ? `?token=${localStorage.getItem('infoseva_access_token') || sessionStorage.getItem('jwt_token')}` : ''}`}
                  target="_blank"
                  rel="noreferrer"
                  download={doc.title || doc.fileName}
                  className="btn-primary text-xs flex items-center gap-1.5 px-4 py-2"
                >
                  <Download size={14} /> Download Original Document
                </a>
              </div>


            ) : (
              <div className="p-5 bg-[#fdfdfa] max-h-[520px] overflow-y-auto">
                <pre className="text-[11px] leading-relaxed text-gray-700 whitespace-pre-wrap font-mono">
                  {doc.sampleContent || "Official document content is available for download."}
                </pre>
              </div>
            )}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Official document records published on the InfoSeva portal.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
