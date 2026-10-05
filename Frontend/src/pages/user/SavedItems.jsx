import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bookmark, FileText, Trash2, ExternalLink, ArrowRight, ClipboardList,
  ChevronDown, Copy, CheckCheck, ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, TypeBadge, EmptyState, Pagination, BackNavigation } from '../../components/common';
import { usePagination } from '../../hooks/usePagination';
import { savedBookmarks, savedDrafts } from '../../data/dummyData';

const COMPLAINT_DRAFTS_KEY = 'savedComplaintDrafts';
const RTI_DRAFTS_KEY = 'rtiDrafts';
const USER_BOOKMARKS_KEY = 'userBookmarks';

function loadLocalDrafts(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function persistDrafts(key, drafts) {
  try {
    localStorage.setItem(key, JSON.stringify(drafts));
  } catch {
    console.error('Failed to persist drafts');
  }
}

// Determine a route for a bookmark based on its type or explicit route
function getBookmarkRoute(item) {
  if (item.route) return item.route;
  if (item.type === 'Scheme' || item.type === 'Scholarship') {
    return `/user/schemes/${item.id || encodeURIComponent((item.title || '').toLowerCase().replace(/\s+/g, '-'))}`;
  }
  if (item.id) {
    return `/user/documents/${item.id}`;
  }
  return '/user/search';
}

function ComplaintDraftCard({ item, onRemove, index }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(item.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="card p-4 group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <ClipboardList size={18} className="text-gov-saffron" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="badge bg-yellow-100 text-yellow-700">{item.status}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-800 group-hover:text-gov-blue transition-colors truncate">
              {item.subject}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{item.dept}</p>
            <p className="text-xs text-gray-400 mt-0.5">Created {item.created}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {item.content && (
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-1.5 text-xs font-medium text-gov-blue hover:underline"
            >
              View <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
          )}
          <button
            onClick={() => onRemove(item.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && item.content && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 whitespace-pre-wrap leading-relaxed font-mono max-h-64 overflow-y-auto">
                {item.content}
              </div>
              <button onClick={copy} className="mt-2 flex items-center gap-1.5 text-xs font-medium text-gov-blue hover:underline">
                {copied ? <><CheckCheck size={13} className="text-green-500" /> Copied!</> : <><Copy size={13} /> Copy Draft</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function SavedItems() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('bookmarks');
  
  // Real live bookmarks saved by user
  const [bookmarks, setBookmarks] = useState(() => loadLocalDrafts(USER_BOOKMARKS_KEY));
  
  // Real live drafts saved by user
  const [drafts, setDrafts] = useState(() => loadLocalDrafts(RTI_DRAFTS_KEY));
  const [complaintDrafts, setComplaintDrafts] = useState(() => loadLocalDrafts(COMPLAINT_DRAFTS_KEY));

  const { page: bPage, setPage: setBPage, pageItems: pagedBookmarks } = usePagination(bookmarks, 6);
  const { page: dPage, setPage: setDPage, pageItems: pagedDrafts } = usePagination(drafts, 5);
  const { page: cPage, setPage: setCPage, pageItems: pagedComplaintDrafts } = usePagination(complaintDrafts, 5);

  const removeBookmark = (id) => {
    setBookmarks((prev) => {
      const updated = prev.filter((b) => String(b.id) !== String(id) && String(b.realId) !== String(id));
      persistDrafts(USER_BOOKMARKS_KEY, updated);
      return updated;
    });
  };

  const removeDraft = (id) => {
    setDrafts((prev) => {
      const updated = prev.filter((d) => String(d.id) !== String(id));
      persistDrafts(RTI_DRAFTS_KEY, updated);
      return updated;
    });
  };

  const removeComplaintDraft = (id) => {
    setComplaintDrafts((prev) => {
      const updated = prev.filter((d) => String(d.id) !== String(id));
      persistDrafts(COMPLAINT_DRAFTS_KEY, updated);
      return updated;
    });
  };


  return (
    <div className="space-y-5 max-w-2xl">
      {/* Dual Back Navigation */}
      <BackNavigation dashboardPath="/user" />

      <PageHeader
        title="Saved Items"
        subtitle="Your bookmarked documents, schemes, RTI drafts, and complaint drafts."
      />

      {/* Tabs */}
      <div className="card p-1 flex w-fit gap-1">
        {[
          ['bookmarks', 'Bookmarks', Bookmark],
          ['drafts', 'RTI Drafts', FileText],
          ['complaints', 'Complaint Drafts', ClipboardList],
        ].map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === id ? 'bg-gov-blue text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Icon size={15} /> {label}
            <span
              className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-bold ${
                tab === id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {id === 'bookmarks' ? bookmarks.length : id === 'drafts' ? drafts.length : complaintDrafts.length}
            </span>
          </button>
        ))}
      </div>

      {/* ── Bookmarks ────────────────────────────────────────────────────── */}
      {tab === 'bookmarks' && (
        <div className="space-y-3">
          {bookmarks.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="No bookmarks yet"
              description="Save documents and schemes while browsing to find them here."
              action={
                <button
                  onClick={() => navigate('/user/search')}
                  className="btn-primary text-sm flex items-center gap-1.5 mx-auto"
                >
                  <ExternalLink size={14} /> Browse Documents
                </button>
              }
            />
          ) : (
            pagedBookmarks.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="card p-4 flex items-start gap-4 group cursor-pointer"
                onClick={() => navigate(getBookmarkRoute(item))}
              >
                <div className="w-10 h-10 bg-gov-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bookmark size={18} className="text-gov-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <TypeBadge type={item.type} />
                    <span className="text-xs text-gray-400">{item.dept}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800 group-hover:text-gov-blue transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Saved {item.saved}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(getBookmarkRoute(item)); }}
                    className="p-1.5 rounded-lg hover:bg-gov-blue-50 text-gray-400 hover:text-gov-blue transition-colors"
                    title="Open"
                  >
                    <ExternalLink size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeBookmark(item.id); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove bookmark"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
          {bookmarks.length > 6 && (
            <Pagination page={bPage} totalItems={bookmarks.length} pageSize={6} onPageChange={setBPage} />
          )}
        </div>
      )}

      {/* ── RTI Drafts ───────────────────────────────────────────────────── */}
      {tab === 'drafts' && (
        <div className="space-y-3">
          {drafts.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No saved drafts"
              description="Generate RTI drafts and save them here to edit and download later."
              action={
                <button
                  onClick={() => navigate('/user/rti-draft')}
                  className="btn-primary text-sm flex items-center gap-1.5 mx-auto"
                >
                  <FileText size={14} /> Generate RTI Draft
                </button>
              }
            />
          ) : (
            <>
              {pagedDrafts.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="card p-4 group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FileText size={18} className="text-gov-saffron" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="badge bg-yellow-100 text-yellow-700">{item.status}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-800 group-hover:text-gov-blue transition-colors truncate">
                          {item.subject}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">{item.dept}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Created {item.created}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => navigate('/user/rti-draft')}
                        className="flex items-center gap-1.5 text-xs font-medium text-gov-blue hover:underline"
                      >
                        Continue <ArrowRight size={12} />
                      </button>
                      <button
                        onClick={() => removeDraft(item.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}

              <Pagination page={dPage} totalItems={drafts.length} pageSize={5} onPageChange={setDPage} />

              <button
                onClick={() => navigate('/user/rti-draft')}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                <FileText size={14} /> Generate New RTI Draft
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Complaint Drafts ─────────────────────────────────────────────── */}
      {tab === 'complaints' && (
        <div className="space-y-3">
          {complaintDrafts.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No saved complaint drafts"
              description="Generate a complaint draft and save it here to view, copy, or continue later."
              action={
                <button
                  onClick={() => navigate('/user/government-services/file-complaint')}
                  className="btn-primary text-sm flex items-center gap-1.5 mx-auto"
                >
                  <ClipboardList size={14} /> File a Complaint
                </button>
              }
            />
          ) : (
            <>
              {pagedComplaintDrafts.map((item, i) => (
                <ComplaintDraftCard key={item.id} item={item} index={i} onRemove={removeComplaintDraft} />
              ))}
              <Pagination page={cPage} totalItems={complaintDrafts.length} pageSize={5} onPageChange={setCPage} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
