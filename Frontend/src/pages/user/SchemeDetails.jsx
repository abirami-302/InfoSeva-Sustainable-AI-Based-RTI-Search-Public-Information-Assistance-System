import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Landmark, Users, Calendar, CheckCircle2, FileText,
  ExternalLink, ChevronDown, Bookmark, ScrollText,
} from 'lucide-react';
import { PageHeader, LoadingSkeleton, EmptyState, BackNavigation } from '../../components/common';
import { getSchemeById } from '../../api/schemesApi';
import { getCircularById, recordDocumentView } from '../../api/documentApi';
import { useDataManager } from '../../context/DataManagerContext';
import { toSchemeCards } from '../../utils/dataManagerAdapter';

export default function SchemeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { manualRecords, bulkRecords, apiRecords } = useDataManager();
  const dmSchemes = toSchemeCards({ manualRecords, bulkRecords, apiRecords });
  const [scheme, setScheme] = useState(null);
  const [relatedCircular, setRelatedCircular] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getSchemeById(id, dmSchemes)
      .then((data) => {
        if (cancelled) return;
        setScheme(data);
        recordDocumentView(data?.documentId || data?.id || id);
        if (data.relatedCircularId) {
          getCircularById(data.relatedCircularId).then((c) => !cancelled && setRelatedCircular(c)).catch(() => {});
        }
      })
      .catch(() => !cancelled && setError('This scheme could not be found.'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Loading scheme..." />
        <div className="card p-6"><LoadingSkeleton lines={6} /></div>
      </div>
    );
  }

  if (error || !scheme) {
    return (
      <EmptyState
        icon={FileText}
        title="Scheme not found"
        description="The scheme you're looking for doesn't exist or may have been removed."
        action={<button onClick={() => navigate('/user/schemes')} className="btn-primary px-5 py-2">Back to Schemes</button>}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Dual Back Navigation */}
      <BackNavigation dashboardPath="/user" />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-gov-blue-50 text-gov-blue mb-2">
              {scheme.category}
            </span>
            <h1 className="text-2xl font-bold text-gray-900 font-display">{scheme.name}</h1>
            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
              <Landmark size={14} /> {scheme.ministry}
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200">
            {scheme.status}
          </span>
        </div>

        {scheme.isDataManagerSourced && (
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
            <FileText size={12} /> Published via Data Manager — {scheme.sourceLabel}
          </p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Benefit</p>
            <p className="text-sm font-bold text-gray-800">{scheme.benefit}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Users size={12} /> Beneficiaries</p>
            <p className="text-sm font-bold text-gray-800">{scheme.beneficiaries}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Calendar size={12} /> Launched</p>
            <p className="text-sm font-bold text-gray-800">{scheme.launched}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Eligibility</p>
            <p className="text-xs font-medium text-gray-700 leading-snug">{scheme.eligibility}</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mt-6">{scheme.description}</p>

        {/* Documents Required */}
        <div className="mt-6">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <FileText size={15} className="text-gov-blue" /> Documents Required
          </h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {scheme.documentsRequired?.map((doc) => (
              <div key={doc} className="flex items-center gap-2 text-sm text-gray-600 bg-gov-blue-50/50 rounded-lg px-3 py-2">
                <CheckCircle2 size={14} className="text-gov-blue flex-shrink-0" /> {doc}
              </div>
            ))}
          </div>
        </div>

        {/* How to Apply */}
        <div className="mt-6">
          <h3 className="text-sm font-bold text-gray-800 mb-3">How to Apply</h3>
          <ol className="space-y-2.5">
            {scheme.howToApply?.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-600">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gov-blue text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* FAQs */}
        {scheme.faqs?.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-bold text-gray-800 mb-3">Frequently Asked Questions</h3>
            <div className="space-y-2">
              {scheme.faqs.map((f, i) => (
                <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {f.q}
                    <ChevronDown size={15} className={`transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-3 text-sm text-gray-500 leading-relaxed">{f.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related circular — citation-style link back to source */}
        {relatedCircular && (
          <div className="mt-6 border-t border-gray-100 pt-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Source Reference</p>
            <Link
              to={`/user/circulars/${relatedCircular.id}`}
              className="flex items-start gap-3 bg-gray-50 hover:bg-gov-blue-50 rounded-xl p-4 transition-colors group"
            >
              <ScrollText size={16} className="text-gov-blue flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-800 group-hover:text-gov-blue">{relatedCircular.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{relatedCircular.department} · Ref: {relatedCircular.referenceNo}</p>
              </div>
            </Link>
          </div>
        )}

        <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100">
          <button 
            onClick={() => {
              try {
                const saved = JSON.parse(localStorage.getItem('userBookmarks') || '[]');
                const exists = saved.some(b => String(b.id) === String(scheme.id) || String(b.realId) === String(scheme.realId));
                let updated;
                if (exists) {
                  updated = saved.filter(b => String(b.id) !== String(scheme.id) && String(b.realId) !== String(scheme.realId));
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
                }
                localStorage.setItem('userBookmarks', JSON.stringify(updated));
                setScheme(s => ({ ...s, _saved: !exists }));
              } catch (_) {}
            }}
            className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
              (() => {
                try {
                  const saved = JSON.parse(localStorage.getItem('userBookmarks') || '[]');
                  return saved.some(b => String(b.id) === String(scheme.id) || String(b.realId) === String(scheme.realId));
                } catch { return false; }
              })() ? 'text-gov-saffron' : 'text-gray-500 hover:text-gov-saffron'
            }`}
          >
            <Bookmark size={14} fill={(() => {
              try {
                const saved = JSON.parse(localStorage.getItem('userBookmarks') || '[]');
                return saved.some(b => String(b.id) === String(scheme.id) || String(b.realId) === String(scheme.realId));
              } catch { return false; }
            })() ? 'currentColor' : 'none'} />
            {(() => {
              try {
                const saved = JSON.parse(localStorage.getItem('userBookmarks') || '[]');
                return saved.some(b => String(b.id) === String(scheme.id) || String(b.realId) === String(scheme.realId));
              } catch { return false; }
            })() ? 'Saved' : 'Save for later'}
          </button>

          {scheme.sampleDocumentUrl && (
            <a 
              href={scheme.sampleDocumentUrl.startsWith('http') 
                ? `${scheme.sampleDocumentUrl}${localStorage.getItem('infoseva_access_token') || sessionStorage.getItem('jwt_token') ? `?token=${localStorage.getItem('infoseva_access_token') || sessionStorage.getItem('jwt_token')}` : ''}`
                : scheme.sampleDocumentUrl} 
              target="_blank"
              rel="noreferrer"
              download
              className="flex items-center gap-1.5 text-xs font-semibold text-gov-blue hover:underline"
            >
              <FileText size={14} /> Download Document
            </a>
          )}

          <div className="flex-1" />
          <a
            href={scheme.applyLink && scheme.applyLink !== '#' ? scheme.applyLink : '#'}
            target="_blank" rel="noreferrer"
            className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2"
          >
            Apply Now <ExternalLink size={14} />
          </a>
        </div>
      </motion.div>
    </div>
  );
}
