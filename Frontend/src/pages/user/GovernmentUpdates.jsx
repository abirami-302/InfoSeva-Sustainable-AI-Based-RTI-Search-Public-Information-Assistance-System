import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Calendar, Building2, ExternalLink, Filter } from 'lucide-react';
import { TypeBadge, Pagination, BackNavigation } from '../../components/common';
import { latestUpdates, circularDetails } from '../../data/dummyData';
import { usePagination } from '../../hooks/usePagination';

import { useDataManager } from '../../context/DataManagerContext';

const PAGE_SIZE = 6;

const TYPE_FILTERS = ['All', 'Circular', 'Government Order', 'Scheme', 'Act'];

function getItemRoute(item) {
  if (item.type === 'Scheme') return `/user/schemes/${item.slug || item.id}`;
  if (item.type === 'Circular' || item.type === 'Government Order') return `/user/circulars/${item.id}`;
  return `/user/documents/${item.id}`;
}

// Merge latestUpdates + circularDetails into one deduped list sorted by date desc
function buildAllUpdates(manualRecords = []) {
  const seen = new Set();
  const all = [];

  // Add uploaded published records (GO, Circular, Notification, Act)
  manualRecords
    .filter(r => r.status === 'Published' && r.documentType !== 'Scheme' && r.documentType !== 'Scholarship')
    .forEach(r => {
      const typeStr = r.documentType === 'GO' ? 'Government Order' : (r.documentType === 'Circular' ? 'Circular' : (r.documentType === 'Act / Rule' ? 'Act' : 'Notification'));
      seen.add(`dm-${r.id}`);
      seen.add(String(r.id));
      all.push({
        id: r.id,
        type: typeStr,
        title: r.title,
        department: r.department || r.ministry || 'Government of India',
        date: r.date || r.issueDate || '2025-01-01',
        summary: r.summary || r.description || r.title,
        badge: 'New',
      });
    });

  // circularDetails is more complete (has referenceNo, sampleContent, summary)
  circularDetails.forEach((c) => {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      all.push({
        id: c.id,
        type: c.type,
        title: c.title,
        department: c.department,
        date: c.date,
        summary: c.summary,
        badge: null,
      });
    }
  });

  // Append latestUpdates entries that aren't already in circularDetails
  latestUpdates.forEach((u) => {
    if (!seen.has(u.id)) {
      all.push(u);
    }
  });

  return all.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export default function GovernmentUpdates() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState('All');
  const { manualRecords } = useDataManager();

  const allUpdates = useMemo(() => buildAllUpdates(manualRecords), [manualRecords]);

  const filtered = useMemo(
    () =>
      typeFilter === 'All'
        ? allUpdates
        : allUpdates.filter((u) => u.type === typeFilter),
    [typeFilter, allUpdates]
  );


  const { page, setPage, pageItems } = usePagination(filtered, PAGE_SIZE);

  return (
    <div className="space-y-5">
      {/* Dual Back Navigation */}
      <BackNavigation dashboardPath="/user" />

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="section-header flex items-center gap-2">
            <Bell size={22} className="text-gov-saffron" />
            Latest Government Updates
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Showing all recent circulars, government orders, schemes and acts.
          </p>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full font-medium">
          {filtered.length} updates
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="card p-3 flex gap-2 flex-wrap items-center">
        <Filter size={14} className="text-gray-400" />
        {TYPE_FILTERS.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              typeFilter === t
                ? 'bg-gov-blue text-white border-gov-blue'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gov-blue hover:text-gov-blue'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Updates List */}
      <div className="space-y-3">
        {pageItems.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => navigate(getItemRoute(item))}
            className="card p-5 cursor-pointer hover:-translate-y-0.5 transition-all group"
          >
            <div className="flex items-start gap-4">
              {/* Type badge + icon column */}
              <div className="flex-shrink-0 pt-0.5">
                <TypeBadge type={item.type} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-gov-blue transition-colors leading-snug">
                  {item.title}
                </h3>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Building2 size={11} /> {item.department}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {new Date(item.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                {item.summary && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>
                )}
                {item.badge && (
                  <span className="inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-gov-saffron/10 text-gov-saffron border border-gov-saffron/20">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Arrow */}
              <ExternalLink
                size={15}
                className="text-gray-200 group-hover:text-gov-blue transition-colors flex-shrink-0 mt-0.5"
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        page={page}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
}
