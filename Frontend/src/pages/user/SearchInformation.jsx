import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Bookmark, ExternalLink, ChevronDown, X, FileText,
  Loader, TrendingUp, ArrowUpRight, Download, Share2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, TypeBadge, EmptyState, Pagination, BackNavigation } from '../../components/common';
import { usePagination } from '../../hooks/usePagination';

const PAGE_SIZE = 5;

export default function SearchInformation() {
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-fill query from URL param (e.g. from dashboard trending searches)
  const urlParams = new URLSearchParams(location.search);
  const initialQuery = urlParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Dynamic filter options derived from real published documents
  const [availableCategories, setAvailableCategories] = useState(['All']);
  const [availableDepartments, setAvailableDepartments] = useState(['All Departments']);
  const [availableYears, setAvailableYears] = useState(['All Years']);

  const [filters, setFilters] = useState({
    category: 'All',
    year: 'All Years',
    dept: 'All Departments',
  });

  const [activeCategory, setActiveCategory] = useState('All');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  const [featuredResults, setFeaturedResults] = useState([]);
  const [allPublishedDocs, setAllPublishedDocs] = useState([]);

  // Fetch live published documents on mount for featured feed and filter lists
  useEffect(() => {
    fetch('http://localhost:8082/api/search?keyword=&size=100', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('infoseva_access_token') || sessionStorage.getItem('jwt_token')}`
      }
    })
      .then(res => res.json())
      .then(data => {
        const content = data.data?.content || [];
        if (data.success && content.length > 0) {
          setFeaturedResults(content.slice(0, 8));
          setAllPublishedDocs(content);

          // Extract unique categories, departments, and years from real documents
          const cats = new Set(['All']);
          const depts = new Set(['All Departments']);
          const yrs = new Set(['All Years']);

          content.forEach(doc => {
            if (doc.type) cats.add(doc.type);
            if (doc.category) cats.add(doc.category);
            if (doc.department) depts.add(doc.department);
            if (doc.date) {
              const yr = String(doc.date).slice(0, 4);
              if (yr && yr.length === 4) yrs.add(yr);
            }
          });

          setAvailableCategories(Array.from(cats));
          setAvailableDepartments(Array.from(depts));
          setAvailableYears(Array.from(yrs));
        } else {
          setFeaturedResults([]);
          setAllPublishedDocs([]);
        }
      })
      .catch(err => {
        console.error("Featured search error:", err);
        setFeaturedResults([]);
        setAllPublishedDocs([]);
      });
  }, []);

  // Suggestions dynamically derived from real published document titles
  const suggestions = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const seen = new Set();
    const list = [];

    for (const doc of allPublishedDocs) {
      const title = doc.title || '';
      if (title.toLowerCase().includes(q) && !seen.has(title)) {
        seen.add(title);
        list.push({ text: title, icon: 'result' });
        if (list.length >= 8) break;
      }
    }
    return list;
  }, [query, allPublishedDocs]);

  // Auto-run search if URL has ?q= param
  useEffect(() => {
    if (initialQuery) runSearch(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const runSearch = async (term) => {
    const q = term ?? query;
    if (!q.trim()) return;
    setQuery(q);
    setShowSuggestions(false);
    setLoading(true);
    setSearched(false);
    try {
      const response = await fetch(`http://localhost:8082/api/search?keyword=${encodeURIComponent(q)}&size=100`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('infoseva_access_token') || sessionStorage.getItem('jwt_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const serverResults = data.data?.content || [];
        setResults(serverResults);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Search request error:', err);
      setResults([]);
    } finally {
      setSearched(true);
      setLoading(false);
    }
  };

  const [bookmarked, setBookmarked] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('userBookmarks') || '[]');
      return saved.map(b => b.id);
    } catch {
      return [];
    }
  });

  const toggleBookmark = (item) => {
    const itemId = item.id;
    try {
      const saved = JSON.parse(localStorage.getItem('userBookmarks') || '[]');
      const isBookmarked = saved.some(b => String(b.id) === String(itemId));
      let updated;
      if (isBookmarked) {
        updated = saved.filter(b => String(b.id) !== String(itemId));
        setBookmarked(prev => prev.filter(id => id !== itemId));
        toast.success(`Removed "${item.title}" from saved items`);
      } else {
        const itemToSave = {
          id: itemId,
          title: item.title,
          type: item.type || item.category || 'Document',
          dept: item.department || 'General Administration',
          saved: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          route: item.route || `/user/documents/${itemId}`,
        };
        updated = [itemToSave, ...saved];
        setBookmarked(prev => [...prev, itemId]);
        toast.success(`Saved "${item.title}"`);
      }
      localStorage.setItem('userBookmarks', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to update bookmark', err);
    }
  };


  // Check if any filter is active
  const hasActiveFilter = useMemo(() => {
    return (
      (activeCategory && activeCategory !== 'All') ||
      (filters.category && filters.category !== 'All') ||
      (filters.dept && filters.dept !== 'All Departments' && filters.dept !== '') ||
      (filters.year && filters.year !== 'All Years' && filters.year !== '')
    );
  }, [activeCategory, filters]);

  // Apply all active filters to base dataset (either user search results or all live published documents)
  const filteredResults = useMemo(() => {
    let r = searched ? results : allPublishedDocs;

    const effectiveCategory = activeCategory !== 'All' ? activeCategory : filters.category;

    if (effectiveCategory && effectiveCategory !== 'All') {
      const target = effectiveCategory.toLowerCase().replace(/[^a-z0-9]/g, '');
      r = r.filter((item) => {
        const itemType = (item.type || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const itemCat = (item.category || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return (
          itemType.includes(target) ||
          target.includes(itemType) ||
          itemCat.includes(target) ||
          target.includes(itemCat)
        );
      });
    }

    if (filters.dept && filters.dept !== 'All Departments' && filters.dept !== '') {
      r = r.filter((item) =>
        (item.department || '').toLowerCase().includes(filters.dept.toLowerCase())
      );
    }

    if (filters.year && filters.year !== 'All Years') {
      r = r.filter((item) => {
        if (!item.date) return false;
        const dateStr = String(item.date);
        return dateStr.startsWith(filters.year) || dateStr.includes(filters.year);
      });
    }

    return r;
  }, [searched, results, allPublishedDocs, activeCategory, filters]);


  const { page, setPage, pageItems } = usePagination(filteredResults, PAGE_SIZE);

  const resolveItemRoute = (item) => {
    if (item.route && item.route !== '#') return item.route;
    const type = (item.type || item.category || '').toLowerCase();
    const id = item.refId || item.id;
    if (!id) return null;
    if (type.includes('scheme') || type.includes('yojana') || type.includes('scholarship')) {
      return `/user/schemes/${item.slug || id}`;
    }
    if (type.includes('circular') || type.includes('order') || type.includes('notice')) {
      return `/user/circulars/${id}`;
    }
    return `/user/documents/${id}`;
  };

  const openResult = (item) => {
    const route = resolveItemRoute(item);
    if (route) {
      navigate(route);
    } else if (item.portalUrl || item.applyLink || item.sourceUrl) {
      const url = item.portalUrl || item.applyLink || item.sourceUrl;
      window.open(url.startsWith('http') ? url : `https://${url}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownload = (e, item) => {
    e.stopPropagation();
    if (item.fileName) {
      const token = localStorage.getItem('infoseva_access_token') || sessionStorage.getItem('jwt_token') || '';
      const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
      window.open(`http://localhost:8082/api/documents/download/${item.fileName}${tokenParam}`, '_blank');
      toast.success(`Downloading "${item.title}"`);
    } else {
      toast.success(`Preparing download for "${item.title}"…`, { duration: 2500 });
    }
  };

  const handleShare = async (e, item) => {
    e.stopPropagation();
    const route = resolveItemRoute(item);
    const shareData = {
      title: item.title,
      text: `${item.title} — ${item.department}`,
      url: route ? `${window.location.origin}${route}` : (item.portalUrl || item.applyLink || item.sourceUrl || window.location.href),
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareData.url);
      toast.success('Link copied to clipboard!');
    }
  };

  // Reusable card renderer — used for both search results and featured results
  const renderResultCard = (item, i) => {
    const route = resolveItemRoute(item);
    const portalUrl = item.portalUrl || item.applyLink || (item.sourceUrl && /^https?:\/\//i.test(item.sourceUrl) ? item.sourceUrl : null);

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        className="card p-5 group hover:-translate-y-0.5 transition-transform cursor-pointer"
        onClick={() => openResult(item)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <TypeBadge type={item.type} />
              {item.similarityScore != null && item.similarityScore > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {Math.round(item.similarityScore * 100)}% Semantic Match
                </span>
              )}
              <span className="text-xs text-gray-400">{item.department}</span>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-gray-400">
                {item.date
                  ? new Date(item.date).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })
                  : ''}
              </span>
            </div>

            <h3 className="font-semibold text-gray-900 group-hover:text-gov-blue transition-colors mb-2 text-sm leading-snug">
              {item.title}
            </h3>

            {item.snippet && (
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-2.5 mb-2.5">
                <div className="flex items-start gap-1.5">
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0">
                    Relevant Match
                  </span>
                  <p className="text-xs text-amber-950/80 leading-relaxed italic line-clamp-2">
                    "...{item.snippet}..."
                  </p>
                </div>
              </div>
            )}

            {item.summary && (
              <div className="bg-gov-blue-50 border border-gov-blue/10 rounded-lg p-3 mb-3">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-gov-blue bg-gov-blue/10 px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0">
                    AI Summary
                  </span>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                    {item.summary}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={(e) => { e.stopPropagation(); openResult(item); }}
                className="flex items-center gap-1.5 text-xs font-semibold text-gov-blue hover:underline"
              >
                {route ? <ArrowUpRight size={13} /> : <ExternalLink size={13} />}
                {route ? 'View Details' : 'Open Portal'}
              </button>

              {portalUrl && portalUrl !== '#' && (
                <>
                  <span className="text-gray-200">|</span>
                  <a
                    href={portalUrl.startsWith('http') ? portalUrl : `https://${portalUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                    title="Visit official government portal"
                  >
                    <ExternalLink size={13} /> Official Portal
                  </a>
                </>
              )}

              <span className="text-gray-200">|</span>

              <button
                onClick={(e) => { e.stopPropagation(); toggleBookmark(item); }}
                className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                  bookmarked.some(bId => String(bId) === String(item.id))
                    ? 'text-gov-saffron'
                    : 'text-gray-400 hover:text-gov-saffron'
                }`}
              >
                <Bookmark size={13} fill={bookmarked.some(bId => String(bId) === String(item.id)) ? 'currentColor' : 'none'} />
                {bookmarked.some(bId => String(bId) === String(item.id)) ? 'Saved' : 'Save'}
              </button>

              <span className="text-gray-200">|</span>

              <button
                onClick={(e) => handleDownload(e, item)}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gov-blue transition-colors"
              >
                <Download size={13} /> Download
              </button>

              <span className="text-gray-200">|</span>

              <button
                onClick={(e) => handleShare(e, item)}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gov-blue transition-colors"
              >
                <Share2 size={13} /> Share
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Dual Back Navigation */}
      <BackNavigation dashboardPath="/user" />

      <PageHeader
        title="Search Information"
        subtitle="Search across official government documents, circulars, notifications and orders"
      />

      {/* Search bar */}
      <div className="card p-5 relative" ref={wrapperRef}>
        <div className="flex gap-2">
          <div className="flex-1 relative flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-gov-blue/30 focus-within:border-gov-blue bg-white">
            <Search size={18} className="ml-4 text-gray-400 flex-shrink-0" />
            <input
              className="flex-1 px-3 py-3.5 text-sm outline-none"
              placeholder="Try 'Ration Card', 'PM Kisan', 'Voter ID'..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setSearched(false); setResults([]); setShowSuggestions(false); }}
                className="mr-2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              filtersOpen
                ? 'bg-gov-blue-50 border-gov-blue text-gov-blue'
                : 'border-gray-200 text-gray-600 hover:border-gov-blue hover:text-gov-blue'
            }`}
          >
            <Filter size={16} /> Filters{' '}
            <ChevronDown size={14} className={`transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={() => runSearch()}
            disabled={loading}
            className="btn-primary px-6 flex items-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader size={16} className="animate-spin" /> : <Search size={16} />}
            Search
          </button>
        </div>

        {/* Live suggestions */}
        <AnimatePresence>
          {showSuggestions && query.trim().length >= 2 && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="absolute left-5 right-[calc(11rem+1.25rem)] top-[4.4rem] z-20 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
            >
              {suggestions.map((s, i) => (
                <button
                  key={`${s.text}-${i}`}
                  type="button"
                  onClick={() => runSearch(s.text)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gov-blue-50 transition-colors border-b border-gray-50 last:border-0"
                >
                  {s.icon === 'trend' ? (
                    <TrendingUp size={14} className="text-gray-400 shrink-0" />
                  ) : (
                    <Search size={14} className="text-gray-400 shrink-0" />
                  )}
                  <span className="text-gray-700">{s.text}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters panel */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-gray-100 mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Department</label>
                  <select
                    className="input-field text-sm"
                    value={filters.dept}
                    onChange={(e) => setFilters((prev) => ({ ...prev, dept: e.target.value }))}
                  >
                    {availableDepartments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Document Type</label>
                  <select
                    className="input-field text-sm"
                    value={filters.category}
                    onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                  >
                    {availableCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Year</label>
                  <select
                    className="input-field text-sm"
                    value={filters.year}
                    onChange={(e) => setFilters((prev) => ({ ...prev, year: e.target.value }))}
                  >
                    {availableYears.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={() => {
                    setActiveCategory('All');
                    setFilters({ category: 'All', year: 'All Years', dept: 'All Departments' });
                  }}
                  className="text-xs text-gov-blue hover:underline"
                >
                  Reset filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Category tabs — dynamic based on real documents */}
      {!loading && availableCategories.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setFilters(prev => ({ ...prev, category: cat }));
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                activeCategory === cat
                  ? 'bg-gov-blue text-white border-gov-blue shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gov-blue hover:text-gov-blue'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}


      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex gap-3 mb-3">
                <div className="h-5 w-16 bg-gray-200 rounded-full" />
                <div className="h-5 w-24 bg-gray-200 rounded-full" />
              </div>
              <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-1/2 bg-gray-200 rounded mb-3" />
              <div className="h-4 w-full bg-gray-100 rounded mb-1" />
              <div className="h-4 w-5/6 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Filtered or Search Results */}
      {(searched || hasActiveFilter) && !loading && (
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-sm text-gray-500">
              Found <span className="font-semibold text-gray-800">{filteredResults.length}</span>{' '}
              {searched ? (
                <>
                  results for <span className="font-semibold text-gov-blue">"{query}"</span>
                </>
              ) : (
                <>matching documents</>
              )}
            </p>
          </div>

          {filteredResults.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No matching documents found"
              description="Try adjusting your keyword or resetting your filters to see more results."
              action={
                <button
                  onClick={() => {
                    setQuery('');
                    setActiveCategory('All');
                    setFilters({ category: 'All', year: 'All Years', dept: 'All Departments' });
                  }}
                  className="btn-primary text-xs px-4 py-2 mt-2"
                >
                  Reset All Filters
                </button>
              }
            />
          ) : (
            <>
              <div className="space-y-3">
                {pageItems.map((item, i) => renderResultCard(item, i))}
              </div>
              <Pagination
                page={page}
                totalItems={filteredResults.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      )}

      {/* Default view before any search or filter — featured approved documents */}
      {!loading && !searched && !hasActiveFilter && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mt-2">
            <TrendingUp size={16} className="text-gov-saffron" />
            <h3 className="text-sm font-semibold text-gray-700">Recently Published & Approved Documents</h3>
          </div>

          <div className="space-y-3">
            {featuredResults.map((item, i) => renderResultCard(item, i))}
          </div>
        </div>
      )}
    </div>
  );
}