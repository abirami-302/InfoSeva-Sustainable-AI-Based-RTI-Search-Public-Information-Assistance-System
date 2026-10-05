import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, MapPin, Globe, Edit3, LogOut, Shield,
  Camera, Eye, Trash2, Upload, ChevronDown, Check,
  FolderInput, CheckCircle2, Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Pagination, paginate, BackNavigation } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useDataManager } from '../../context/DataManagerContext';
import ChangePasswordSection from '../../components/common/ChangePasswordSection';
import * as ui from '../../styles/datamanager/DataManagerUI';
import { LANGUAGES, STATES } from './shared';

const PAGE_SIZE = 5;
const RANGE_OPTIONS = ['Last 7 days', 'Last 30 days', 'All time'];

function withinRange(dateStr, rangeLabel) {
  if (!dateStr || rangeLabel === 'All time') return true;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return true;
  const days = rangeLabel === 'Last 7 days' ? 7 : 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return d >= cutoff;
}

// ── Profile Photo with Options Menu ──────────────────────────────────────────
function ProfilePhotoSection({ photo, name, onChange }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();
  const menuRef = useRef();

  const initials = (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'U';

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB.');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        onChange(dataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    setMenuOpen(false);
  };

  const handleRemove = () => {
    onChange(null);
    setMenuOpen(false);
  };

  return (
    <div className="relative flex flex-col items-center gap-3">
      <div
        className="relative cursor-pointer group"
        onClick={() => setMenuOpen((o) => !o)}
        ref={menuRef}
      >
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gov-blue-50 border-4 border-white shadow-lg flex items-center justify-center">
          {photo ? (
            <img src={photo} alt={name || 'Profile'} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-gov-blue">{initials}</span>
          )}
        </div>
        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera size={20} className="text-white" />
        </div>
        <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-gov-blue text-white flex items-center justify-center border-2 border-white shadow">
          <Edit3 size={12} />
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-28 z-30 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 w-44 text-xs font-medium"
          >
            {photo && (
              <button
                type="button"
                onClick={() => { setPreviewOpen(true); setMenuOpen(false); }}
                className="w-full text-left px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
              >
                <Eye size={13} /> View Photo
              </button>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full text-left px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
            >
              <Upload size={13} /> Upload New Photo
            </button>
            {photo && (
              <button
                type="button"
                onClick={handleRemove}
                className="w-full text-left px-3.5 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600 border-t border-gray-100"
              >
                <Trash2 size={13} /> Remove Photo
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-xs text-red-500 text-center">{error}</p>}

      <AnimatePresence>
        {previewOpen && photo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-sm w-full"
            >
              <img src={photo} alt="Profile" className="w-full object-cover" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Dynamic Real Upload Activity Section ─────────────────────────────────────
function RealUploadActivitySection({ manualRecords, bulkRecords }) {
  const [range, setRange] = useState('All time');
  const [page, setPage] = useState(1);

  const allUploads = useMemo(() => {
    const combined = [
      ...manualRecords.map(r => ({ ...r, sourceType: 'Single Upload' })),
      ...bulkRecords.map(r => ({ ...r, sourceType: 'Bulk Upload' })),
    ];
    return combined.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [manualRecords, bulkRecords]);

  const filtered = useMemo(() => {
    return allUploads.filter((item) => withinRange(item.date, range));
  }, [allUploads, range]);

  const pageItems = paginate(filtered, page, PAGE_SIZE);

  return (
    <div className={ui.cardPad}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <FolderInput size={16} className="text-gov-blue" />
            Document Upload Activity (Live)
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">{allUploads.length} total intake records tracked</p>
        </div>
        <div className="flex gap-1.5">
          {RANGE_OPTIONS.map((r) => (
            <button key={r} onClick={() => { setRange(r); setPage(1); }} className={ui.filterChip(range === r)}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {pageItems.length === 0 ? (
        <div className={ui.emptyState}>No upload activity recorded in this time range.</div>
      ) : (
        <div className="space-y-2">
          {pageItems.map((doc) => {
            const isBulk = doc.sourceType === 'Bulk Upload';
            return (
              <div key={doc.id} className={`${ui.rowHoverSm} border border-gray-100 rounded-xl p-3 bg-gray-50/30`}>
                <div className={ui.iconChip(isBulk ? 'blue' : 'navy', 'w-8 h-8')}>
                  {isBulk ? <FolderInput size={14} /> : <Upload size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-bold text-gray-900 truncate">{doc.title}</p>
                    <span className={ui.badge('blue')}>{doc.category || doc.documentType || 'Document'}</span>
                    <span className={ui.badge(
                      doc.status === 'Published' ? 'green' :
                      doc.status === 'In Review' ? 'yellow' : 'red'
                    )}>
                      {doc.status || 'Active'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {doc.department || 'General Administration'}
                    {doc.batchName && ` · Batch: ${doc.batchName}`}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                    <Clock size={10} /> Uploaded on {doc.date || 'Recent'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}

// ── Main DM Profile Component ────────────────────────────────────────────────
export function DMProfile() {
  const { user, logout, updateUser } = useAuth();
  const { manualRecords, bulkRecords, reviewQueue } = useDataManager();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    state: user?.state || '',
    city: user?.city || '',
    language: user?.lang || 'English',
    photo: user?.photo || null,
  });

  useEffect(() => {
    const token = localStorage.getItem('infoseva_access_token');
    if (!token) return;

    fetch('http://localhost:8081/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data) {
          const p = resData.data;
          setForm((prev) => ({
            ...prev,
            name: p.user?.name || user?.name || prev.name,
            email: p.user?.email || user?.email || prev.email,
            phone: p.phoneNumber || user?.phone || prev.phone,
            state: p.address?.state || user?.state || prev.state,
            city: p.address?.city || user?.city || prev.city,
            photo: p.profilePhotoUrl !== undefined ? p.profilePhotoUrl : (user?.photo || prev.photo),
          }));

          updateUser({
            name: p.user?.name || user?.name,
            phone: p.phoneNumber || user?.phone,
            state: p.address?.state || user?.state,
            city: p.address?.city || user?.city,
            photo: p.profilePhotoUrl !== undefined ? p.profilePhotoUrl : user?.photo,
          });
        }
      })
      .catch((err) => console.warn('Could not fetch data manager profile:', err));
  }, []);

  const roleLabel = (() => {
    const r = (user?.role || '').toString().toUpperCase().replace(/^ROLE_/, '');
    if (r === 'ADMIN') return 'Administrator';
    if (r === 'DATA_MANAGER' || r === 'DATAMANAGER') return 'Data Manager';
    if (r === 'CITIZEN' || r === 'USER') return 'Citizen';
    return r || 'User';
  })();

  const update = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('infoseva_access_token');
    if (token) {
      try {
        // 1. Persist demographic profile (name, phone, photo)
        await fetch('http://localhost:8081/api/users/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: form.name,
            phoneNumber: form.phone,
            profilePhotoUrl: form.photo || ''
          })
        });

        // 2. Persist address (state, city)
        await fetch('http://localhost:8081/api/users/address', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            state: form.state,
            city: form.city
          })
        });
      } catch (err) {
        console.warn('Backend update failed:', err);
      }
    }

    updateUser({
      name: form.name,
      phone: form.phone,
      state: form.state,
      city: form.city,
      lang: form.language,
      photo: form.photo
    });

    // Sync developer test profile cache for immediate reflection in login screen
    try {
      const devProfiles = JSON.parse(localStorage.getItem('infoseva_dev_profiles') || '{}');
      if (form.email) {
        devProfiles[form.email] = { name: form.name, photo: form.photo };
        localStorage.setItem('infoseva_dev_profiles', JSON.stringify(devProfiles));
      }
    } catch (e) {}

    setSaving(false);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const totalUploaded = manualRecords.length + bulkRecords.length;
  const approvedDocs = [...manualRecords, ...bulkRecords].filter(r => r.status === 'Published' || r.reviewStatus === 'APPROVED').length;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Dual Back Navigation */}
      <BackNavigation dashboardPath="/datamanager" />

      <PageHeader title="Data Manager Profile" subtitle="Manage your account details, track real document upload performance, and security settings." />

      <AnimatePresence>
        {saved && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={ui.successBanner}>
            <CheckCircle2 size={16} /> Profile updated successfully.
          </motion.div>
        )}
      </AnimatePresence>

      <div className={ui.cardPad6}>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <ProfilePhotoSection
            photo={form.photo}
            name={form.name || user?.name || ''}
            onChange={(url) => update('photo', url)}
          />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-gray-900">{form.name || user?.name || 'User'}</h2>
            <p className="text-gray-500 text-sm mt-0.5">{form.email || user?.email || ''}</p>
            <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start flex-wrap">
              <span className={ui.badge('navy')}>Role: {roleLabel}</span>
              <span className={ui.badge('green')}>Active Session</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100 text-center">
              <div className="bg-blue-50/60 p-2 rounded-xl border border-blue-100/60">
                <p className="text-[10px] uppercase font-bold text-gray-500">Total Uploads</p>
                <p className="text-sm font-bold text-gov-blue mt-0.5">{totalUploaded}</p>
              </div>
              <div className="bg-amber-50/60 p-2 rounded-xl border border-amber-100/60">
                <p className="text-[10px] uppercase font-bold text-gray-500">In Review</p>
                <p className="text-sm font-bold text-amber-700 mt-0.5">{reviewQueue.length}</p>
              </div>
              <div className="bg-green-50/60 p-2 rounded-xl border border-green-100/60">
                <p className="text-[10px] uppercase font-bold text-gray-500">Published</p>
                <p className="text-sm font-bold text-green-700 mt-0.5">{approvedDocs}</p>
              </div>
            </div>
          </div>

          <button onClick={() => setEditing(!editing)} className={ui.btn.editProfile(editing)}>
            <Edit3 size={15} /> {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      <div className={ui.cardPad}>
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <User size={16} className="text-[#0B1739]" /> Officer Information & Station
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Full Name', key: 'name', type: 'text' },
            { label: 'Official Email', key: 'email', type: 'email' },
            { label: 'Contact Phone', key: 'phone', type: 'tel' },
            { label: 'City / District', key: 'city', type: 'text' },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">{f.label}</label>
              {editing ? (
                <input type={f.type} className={ui.input} value={form[f.key]} onChange={(e) => update(f.key, e.target.value)} />
              ) : (
                <p className="text-sm font-medium text-gray-800 py-1.5">{form[f.key] || '—'}</p>
              )}
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">State / UT</label>
            {editing ? (
              <select className={ui.input} value={form.state} onChange={(e) => update('state', e.target.value)}>
                {STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            ) : (
              <p className="text-sm font-medium text-gray-800 py-1.5 flex items-center gap-1.5">
                <MapPin size={13} className="text-gray-400" />{form.state}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Operational Language</label>
            {editing ? (
              <select className={ui.input} value={form.language} onChange={(e) => update('language', e.target.value)}>
                {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
              </select>
            ) : (
              <p className="text-sm font-medium text-gray-800 py-1.5 flex items-center gap-1.5">
                <Globe size={13} className="text-gray-400" />{form.language}
              </p>
            )}
          </div>
        </div>
        {editing && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
            <button onClick={handleSave} className={ui.btn.saveProfile}><Check size={14} /> Save Profile</button>
            <button onClick={() => setEditing(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        )}
      </div>

      <RealUploadActivitySection manualRecords={manualRecords} bulkRecords={bulkRecords} />

      <div className={ui.cardPad}>
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Shield size={16} className="text-[#0B1739]" /> Security & Account
        </h3>
        <div className="space-y-2">
          <button onClick={() => setShowChangePassword(!showChangePassword)} className={ui.btn.accountRow}>
            Change Password
            <ChevronDown size={15} className={`text-gray-400 transition-transform ${showChangePassword ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showChangePassword && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-4">
                <ChangePasswordSection onClose={() => setShowChangePassword(false)} userEmail={form.email} userPhone={form.phone} />
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={handleLogout} className={ui.btn.logout}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}