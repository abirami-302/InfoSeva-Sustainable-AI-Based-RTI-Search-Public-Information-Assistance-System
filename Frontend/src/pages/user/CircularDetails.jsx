import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ScrollText, Building2, Calendar, Hash, BookOpen } from 'lucide-react';
import { PageHeader, LoadingSkeleton, EmptyState, TypeBadge, BackNavigation } from '../../components/common';
import { getCircularById } from '../../api/documentApi';
import { getSchemeById } from '../../api/schemesApi';

export default function CircularDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [circular, setCircular] = useState(null);
  const [relatedScheme, setRelatedScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getCircularById(id)
      .then((data) => {
        if (cancelled) return;
        setCircular(data);
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
        <PageHeader title="Loading..." />
        <div className="card p-6"><LoadingSkeleton lines={6} /></div>
      </div>
    );
  }

  if (error || !circular) {
    return (
      <EmptyState
        icon={ScrollText}
        title="Not found"
        description="This circular or government order doesn't exist or may have been removed."
        action={<button onClick={() => navigate('/user')} className="btn-primary px-5 py-2">Back to Dashboard</button>}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Dual Back Navigation */}
      <BackNavigation dashboardPath="/user" />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <div className="flex items-center gap-2 mb-2">
          <TypeBadge type={circular.type} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 font-display">{circular.title}</h1>

        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
          <span className="flex items-center gap-1.5"><Building2 size={14} /> {circular.department}</span>
          <span className="flex items-center gap-1.5"><Calendar size={14} /> {circular.date}</span>
          <span className="flex items-center gap-1.5"><Hash size={14} /> {circular.referenceNo}</span>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mt-5">{circular.summary}</p>

        <div className="mt-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Official Text (Sample)</p>
          <div className="bg-[#fdfdfa] border border-gray-100 rounded-xl p-5">
            <pre className="text-[11px] leading-relaxed text-gray-700 whitespace-pre-wrap font-mono">
              {circular.sampleContent}
            </pre>
          </div>
        </div>

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
      </motion.div>
    </div>
  );
}
