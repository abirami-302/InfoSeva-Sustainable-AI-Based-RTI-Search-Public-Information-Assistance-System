import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, MapPin, Globe, Edit3, Save, LogOut, Shield, Bell, ChevronDown, Briefcase,
  Camera, Eye, Trash2, Upload, Loader
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Switch, BackNavigation } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import ChangePasswordSection from '../../components/common/ChangePasswordSection';

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati', 'Punjabi'];
const STATES = ['Tamil Nadu', 'Delhi', 'Maharashtra', 'Kerala', 'Gujarat', 'Uttar Pradesh', 'West Bengal', 'Karnataka', 'Rajasthan', 'Bihar'];
const DEPARTMENTS = ['Platform Operations', 'IT & Security', 'Citizen Services', 'Data Governance', 'Compliance'];

// ── Profile Photo with Options Menu ──────────────────────────────────────────
// Same pattern as UserProfile / DMProfile: hover camera overlay, dropdown
// (View / Upload / Remove), and a full preview modal.
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
      <div className="relative cursor-pointer group" onClick={() => setMenuOpen((o) => !o)} ref={menuRef}>
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
        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gov-blue rounded-full flex items-center justify-center border-2 border-white shadow">
          <Camera size={13} className="text-white" />
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
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

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

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
              <div className="p-4 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Profile Photo</span>
                <button onClick={() => setPreviewOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">
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



export default function AdminProfile() {
  const { user, logout, updateUser } = useAuth();
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
    department: user?.department || 'Platform Operations',
    designation: user?.designation || 'Senior Platform Administrator',
    employeeId: user?.employeeId || 'ADM-2024-014',
    accessLevel: 'Full Access',
    notifications: true,
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
      .catch((err) => console.warn('Could not fetch admin profile:', err));
  }, []);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

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

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Dual Back Navigation */}
      <BackNavigation dashboardPath="/admin/dashboard" />

      <PageHeader title="Admin Profile" subtitle="Manage your administrator account and preferences." />

      <AnimatePresence>
        {saved && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
            <Shield size={16} /> Profile updated successfully.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar & name */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <ProfilePhotoSection
            photo={form.photo}
            name={form.name}
            onChange={(url) => update('photo', url)}
          />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-gray-900">{form.name}</h2>
            <p className="text-gray-500 text-sm">{form.designation}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap justify-center sm:justify-start">
              <span className="badge bg-red-100 text-red-700">Administrator</span>
              <span className="badge bg-green-50 text-green-700">{form.accessLevel}</span>
              <span className="badge bg-gov-blue-50 text-gov-blue">{form.employeeId}</span>
            </div>
          </div>
          <button onClick={() => setEditing(!editing)}
            className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg border transition-colors flex-shrink-0 ${editing ? 'bg-gov-blue text-white border-gov-blue' : 'border-gray-200 text-gray-600 hover:border-gov-blue hover:text-gov-blue'}`}>
            <Edit3 size={15} /> {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Personal Info */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><User size={16} className="text-gov-blue" /> Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Full Name', key: 'name', icon: User, type: 'text' },
            { label: 'Email Address', key: 'email', icon: Mail, type: 'email' },
            { label: 'Phone Number', key: 'phone', icon: User, type: 'tel' },
            { label: 'City / Town', key: 'city', icon: MapPin, type: 'text' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">{f.label}</label>
              {editing ? (
                <input type={f.type} className="input-field text-sm" value={form[f.key]} onChange={e => update(f.key, e.target.value)} />
              ) : (
                <p className="text-sm font-medium text-gray-800 py-2">{form[f.key] || '—'}</p>
              )}
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">State</label>
            {editing ? (
              <select className="input-field text-sm" value={form.state} onChange={e => update('state', e.target.value)}>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            ) : (
              <p className="text-sm font-medium text-gray-800 py-2 flex items-center gap-1.5"><MapPin size={13} className="text-gray-400" />{form.state}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Preferred Language</label>
            {editing ? (
              <select className="input-field text-sm" value={form.language} onChange={e => update('language', e.target.value)}>
                {LANGUAGES.map(l => <option key={l}>{l}</option>)}
              </select>
            ) : (
              <p className="text-sm font-medium text-gray-800 py-2 flex items-center gap-1.5"><Globe size={13} className="text-gray-400" />{form.language}</p>
            )}
          </div>
        </div>
        {editing && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
            <button onClick={handleSave} className="btn-primary flex items-center gap-2 text-sm"><Save size={14} /> Save Changes</button>
            <button onClick={() => setEditing(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        )}
      </div>

      {/* Work Info */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Briefcase size={16} className="text-gov-blue" /> Administrative Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Employee ID</label>
            <p className="text-sm font-medium text-gray-800 py-2 font-mono">{form.employeeId}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Department</label>
            {editing ? (
              <select className="input-field text-sm" value={form.department} onChange={e => update('department', e.target.value)}>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            ) : (
              <p className="text-sm font-medium text-gray-800 py-2">{form.department}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Designation</label>
            {editing ? (
              <input className="input-field text-sm" value={form.designation} onChange={e => update('designation', e.target.value)} />
            ) : (
              <p className="text-sm font-medium text-gray-800 py-2">{form.designation}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Access Level</label>
            <p className="text-sm font-medium text-gray-800 py-2">{form.accessLevel}</p>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Bell size={16} className="text-gov-blue" /> Preferences</h3>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-gray-800">Email Notifications</p>
            <p className="text-xs text-gray-400">Receive alerts on system incidents and pending approvals</p>
          </div>
          <Switch checked={form.notifications} onChange={(v) => update('notifications', v)} />
        </div>
      </div>

      {/* Account Actions */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Shield size={16} className="text-gov-blue" /> Account</h3>
        <div className="space-y-2">
          <button onClick={() => setShowChangePassword(!showChangePassword)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all text-sm font-medium text-gray-700">
            Change Password
            <ChevronDown size={15} className={`text-gray-400 transition-transform ${showChangePassword ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showChangePassword && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden px-4">
                <ChangePasswordSection
                  onClose={() => setShowChangePassword(false)}
                  userEmail={form.email}
                  userPhone={form.phone}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <button onClick={handleLogout}
            className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-200 transition-all text-sm font-medium text-red-600 flex items-center gap-2">
            <LogOut size={15} /> Sign Out of Admin Portal
          </button>
        </div>
      </div>
    </div>
  );
}