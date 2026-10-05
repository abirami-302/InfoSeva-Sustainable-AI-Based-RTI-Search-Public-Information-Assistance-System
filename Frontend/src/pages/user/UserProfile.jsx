import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, MapPin, Globe, Edit3, Save, LogOut, Shield,
  Camera, Eye, Trash2, Upload, ChevronDown, Check,
  Briefcase, Smartphone,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, BackNavigation } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import ChangePasswordSection from '../../components/common/ChangePasswordSection';

const LANGUAGES = [
  'English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam',
  'Bengali', 'Marathi', 'Gujarati', 'Punjabi',
];

const PROFESSIONS = [
  'Student', 'Government Employee', 'Private Employee', 'Self Employed',
  'Business Owner', 'Farmer', 'Teacher', 'Doctor', 'Engineer', 'Lawyer',
  'Journalist', 'Researcher', 'Homemaker', 'Retired', 'Unemployed', 'Other'
];

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Puducherry', 'Chandigarh',
];

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
    .join('') || '?';

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
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 120;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        onChange(compressed);
      };
      img.src = event.target.result;
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
      {/* Avatar */}
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
        {/* Camera overlay */}
        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera size={20} className="text-white" />
        </div>
        {/* Edit badge */}
        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gov-blue rounded-full flex items-center justify-center border-2 border-white shadow">
          <Camera size={13} className="text-white" />
        </div>
      </div>

      {/* Dropdown menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-gray-100 w-52 z-50 overflow-hidden"
            >
              {photo && (
                <button
                  onClick={() => { setPreviewOpen(true); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gov-blue-50 hover:text-gov-blue transition-colors"
                >
                  <Eye size={15} /> View Photo
                </button>
              )}
              <button
                onClick={() => { fileRef.current?.click(); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gov-blue-50 hover:text-gov-blue transition-colors"
              >
                <Upload size={15} /> {photo ? 'Change Photo' : 'Upload Photo'}
              </button>
              {photo && (
                <>
                  <hr className="border-gray-100" />
                  <button
                    onClick={handleRemove}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={15} /> Remove Photo
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && <p className="text-xs text-red-500 text-center">{error}</p>}

      {/* Photo preview modal */}
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
              <div className="p-4 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Profile Photo</span>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function UserProfile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '9876543210',
    profession: user?.profession || 'Student',
    state: user?.state || 'Tamil Nadu',
    city: user?.city || 'Madurai',
    language: user?.lang || 'English',
    photo: user?.photo || null,
  });

  const update = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

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
            phone: p.phoneNumber || prev.phone,
            profession: p.profession ? p.profession.replace(/_/g, ' ') : (user?.profession || prev.profession),
            photo: p.profilePhotoUrl || user?.photo || prev.photo,
            state: p.address?.state || prev.state,
            city: p.address?.city || prev.city,
          }));

          if (p.profilePhotoUrl || p.profession) {
            updateUser({
              photo: p.profilePhotoUrl || user?.photo,
              profession: p.profession || user?.profession
            });
          }
        }
      })
      .catch((err) => console.warn('Could not fetch user profile:', err));
  }, []);

  const handleSave = async () => {
    const token = localStorage.getItem('infoseva_access_token');
    if (token) {
      try {
        // 1. Persist demographic profile, profession, and photo to Oracle backend
        await fetch('http://localhost:8081/api/users/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: form.name,
            phoneNumber: form.phone,
            profession: form.profession,
            profilePhotoUrl: form.photo || ''
          })
        });

        // 2. Persist address to Oracle backend
        await fetch('http://localhost:8081/api/users/address', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            state: form.state,
            city: form.city,
            country: 'India'
          })
        });
      } catch (err) {
        console.warn('Backend profile update failed:', err);
      }
    }

    try {
      const devProfiles = JSON.parse(localStorage.getItem('infoseva_dev_profiles') || '{}');
      if (form.email) {
        devProfiles[form.email] = { name: form.name, photo: form.photo };
        localStorage.setItem('infoseva_dev_profiles', JSON.stringify(devProfiles));
      }
    } catch (e) {}

    // Update session state so avatar and details update portal-wide
    updateUser({
      name: form.name,
      phone: form.phone,
      state: form.state,
      city: form.city,
      lang: form.language,
      photo: form.photo,
      profession: form.profession,
    });

    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Dual Back Navigation */}
      <BackNavigation dashboardPath="/user" />

      <PageHeader title="My Profile" subtitle="Manage your personal information and preferences." />

      {/* Success banner */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2"
          >
            <Check size={16} /> Profile updated successfully.
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Avatar & Name Card ─────────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <ProfilePhotoSection
            photo={form.photo}
            name={form.name}
            onChange={(url) => update('photo', url)}
          />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-gray-900">{form.name}</h2>
            <p className="text-gray-500 text-sm mt-0.5">{form.email}</p>
            <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start flex-wrap">
              <span className="badge bg-gov-blue-50 text-gov-blue">Citizen Account</span>
              <span className="badge bg-green-50 text-green-700">Verified</span>
            </div>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg border transition-colors flex-shrink-0 ${
              editing
                ? 'bg-gov-blue text-white border-gov-blue'
                : 'border-gray-200 text-gray-600 hover:border-gov-blue hover:text-gov-blue'
            }`}
          >
            <Edit3 size={15} /> {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* ── Personal Information ───────────────────────────────────────── */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <User size={16} className="text-gov-blue" /> Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Full Name', key: 'name', icon: User, type: 'text' },
            { label: 'Email Address', key: 'email', icon: Mail, type: 'email' },
            { label: 'Phone Number', key: 'phone', icon: Smartphone, type: 'tel' },
            { label: 'City / Town', key: 'city', icon: MapPin, type: 'text' },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                {f.label}
              </label>
              {editing ? (
                <input
                  type={f.type}
                  className="input-field text-sm"
                  value={form[f.key]}
                  onChange={(e) => update(f.key, e.target.value)}
                />
              ) : (
                <p className="text-sm font-medium text-gray-800 py-2">{form[f.key] || '—'}</p>
              )}
            </div>
          ))}

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              State
            </label>
            {editing ? (
              <select
                className="input-field text-sm"
                value={form.state}
                onChange={(e) => update('state', e.target.value)}
              >
                {STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm font-medium text-gray-800 py-2 flex items-center gap-1.5">
                <MapPin size={13} className="text-gray-400" /> {form.state}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              Preferred Language
            </label>
            {editing ? (
              <select
                className="input-field text-sm"
                value={form.language}
                onChange={(e) => update('language', e.target.value)}
              >
                {LANGUAGES.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm font-medium text-gray-800 py-2 flex items-center gap-1.5">
                <Globe size={13} className="text-gray-400" /> {form.language}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              Profession / Occupation
            </label>
            {editing ? (
              <select
                className="input-field text-sm"
                value={form.profession}
                onChange={(e) => update('profession', e.target.value)}
              >
                {PROFESSIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm font-medium text-gray-800 py-2 flex items-center gap-1.5">
                <Briefcase size={13} className="text-gray-400" /> {form.profession || '—'}
              </p>
            )}
          </div>
        </div>

        {editing && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
            <button
              onClick={handleSave}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Save size={14} /> Save Changes
            </button>
            <button
              onClick={() => setEditing(false)}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* ── Account & Security ─────────────────────────────────────────── */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Shield size={16} className="text-gov-blue" /> Account & Security
        </h3>
        <div className="space-y-2">
          <button
            onClick={() => setShowChangePassword(!showChangePassword)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all text-sm font-medium text-gray-700"
          >
            <div className="flex items-center gap-2">
              <Shield size={15} className="text-gov-blue" />
              Change Password
            </div>
            <ChevronDown
              size={15}
              className={`text-gray-400 transition-transform ${showChangePassword ? 'rotate-180' : ''}`}
            />
          </button>

          <AnimatePresence>
            {showChangePassword && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden px-4"
              >
                <ChangePasswordSection
                  onClose={() => setShowChangePassword(false)}
                  userEmail={form.email}
                  userPhone={form.phone}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <hr className="border-gray-100 my-1" />

          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-200 transition-all text-sm font-medium text-red-600 flex items-center gap-2"
          >
            <LogOut size={15} /> Sign Out of InfoSeva
          </button>
        </div>
      </div>
    </div>
  );
}
