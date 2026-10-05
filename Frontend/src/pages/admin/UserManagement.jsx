import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Download, MoreVertical, Edit3, Trash2, X,
  Mail, Phone, ShieldCheck, ShieldOff, Filter, UserCheck,
  MapPin, Briefcase, Calendar, Check, AlertCircle, RefreshCw
} from 'lucide-react';
import { PageHeader, Pagination, BackNavigation } from '../../components/common';
import { usePagination } from '../../hooks/usePagination';
import {
  fetchAdminUsers,
  fetchAdminUserById,
  updateAdminUser,
  deleteAdminUser,
  toggleUserStatus,
  toggleDataManagerRole,
  fetchUserStats
} from '../../services/adminService';
import { INDIAN_STATES, getDistricts, getCities } from '../../data/india-locations';

const PROFESSIONS = [
  'Student', 'Farmer', 'Private Employee', 'Government Employee',
  'Self Employed', 'Business Owner', 'Teacher', 'Doctor', 'Engineer',
  'Lawyer', 'Journalist', 'Researcher', 'Homemaker', 'Social Worker',
  'Retired', 'Unemployed', 'Other'
];

const GENDERS = ['Male', 'Female', 'Other', 'Prefer Not to Say'];

const emptyProfileForm = {
  name: '',
  email: '',
  phone: '',
  dob: '',
  gender: '',
  profession: '',
  state: '',
  district: '',
  city: '',
  pincode: ''
};

function statusBadge(status) {
  const map = {
    Active: 'bg-green-100 text-green-700',
    Suspended: 'bg-red-100 text-red-700',
    Pending: 'bg-yellow-100 text-yellow-700',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
}

function professionBadge(prof) {
  if (!prof) return 'bg-gray-100 text-gray-600';
  const clean = prof.replace(/_/g, ' ').toLowerCase();
  if (clean.includes('student')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  if (clean.includes('farmer')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (clean.includes('government')) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (clean.includes('private')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (clean.includes('business') || clean.includes('self')) return 'bg-purple-50 text-purple-700 border-purple-200';
  return 'bg-gray-50 text-gray-700 border-gray-200';
}

function formatJoinedDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

function downloadCSV(rows) {
  const headers = ['Citizen ID', 'Name', 'Email', 'Phone', 'Profession', 'Location', 'Status', 'Profile Complete', 'Joined Date'];
  const csvRows = rows.map(u => [
    u.id,
    u.name,
    u.email,
    u.phone || '',
    u.profession || '',
    [u.city, u.district, u.state].filter(Boolean).join(', ') || '',
    u.status,
    u.profileComplete ? 'Yes' : 'No',
    formatJoinedDate(u.joined)
  ]);
  const csv = [headers, ...csvRows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `infoseva-citizens-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ── Edit Citizen Profile Modal ───────────────────────────────────────────────
function EditCitizenModal({ citizen, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: citizen.name || '',
    email: citizen.email || '',
    phone: citizen.phone || '',
    dob: citizen.dob || '',
    gender: citizen.gender || '',
    profession: citizen.profession || '',
    state: citizen.state || '',
    district: citizen.district || '',
    city: citizen.city || '',
    pincode: citizen.pincode || ''
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  // Load detailed Oracle user profile if available
  useEffect(() => {
    let mounted = true;
    const fetchFullDetails = async () => {
      try {
        const { data } = await fetchAdminUserById(citizen.id);
        if (mounted && data) {
          setForm(prev => ({
            ...prev,
            name: data.name || prev.name,
            email: data.email || prev.email,
            phone: data.phone || prev.phone,
            dob: data.dob || prev.dob,
            gender: data.gender ? (data.gender.charAt(0) + data.gender.slice(1).toLowerCase()) : prev.gender,
            profession: data.profession ? data.profession.replace(/_/g, ' ') : prev.profession,
            state: data.state || prev.state,
            district: data.district || prev.district,
            city: data.city || prev.city,
            pincode: data.pincode || prev.pincode
          }));
        }
      } catch (err) {
        // Fallback to row data already present
      } finally {
        if (mounted) setIsLoadingDetails(false);
      }
    };
    fetchFullDetails();
    return () => { mounted = false; };
  }, [citizen.id]);

  const updateField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const availableDistricts = useMemo(() => {
    return form.state ? getDistricts(form.state) : [];
  }, [form.state]);

  const availableCities = useMemo(() => {
    return form.state && form.district ? getCities(form.state, form.district) : [];
  }, [form.state, form.district]);

  const validate = () => {
    const errs = {};
    if (!form.name || !form.name.trim()) errs.name = 'Full name is required';
    if (form.phone && !/^\d{10}$/.test(form.phone.trim())) {
      errs.phone = 'Phone number must be exactly 10 digits';
    }
    if (form.pincode && !/^\d{6}$/.test(form.pincode.trim())) {
      errs.pincode = 'Pincode must be exactly 6 digits';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSaving(true);
    const payload = {
      name: form.name.trim(),
      phone: form.phone ? form.phone.trim() : null,
      dob: form.dob || null,
      gender: form.gender ? form.gender.toUpperCase().replace(/\s+/g, '_') : null,
      profession: form.profession ? form.profession.toUpperCase().replace(/\s+/g, '_') : null,
      state: form.state || null,
      district: form.district || null,
      city: form.city || null,
      pincode: form.pincode || null
    };

    const { data, error } = await updateAdminUser(citizen.id, payload);
    setIsSaving(false);

    if (error) {
      setErrors({ api: error });
    } else {
      onSaved(data || { ...citizen, ...payload });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0 bg-gray-50/50">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Edit3 size={17} className="text-gov-blue" />
              Edit Citizen Profile
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Citizen #{citizen.id} &bull; {citizen.email}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errors.api && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{errors.api}</span>
            </div>
          )}

          {isLoadingDetails && (
            <div className="flex items-center justify-center gap-2 py-2 text-xs text-gov-blue font-medium bg-gov-blue/5 rounded-lg border border-gov-blue/10">
              <RefreshCw size={12} className="animate-spin" />
              Syncing demographic profile from Oracle records...
            </div>
          )}

          {/* Section 1: Basic Identity */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => updateField('name', e.target.value)}
                  className={`input-field text-sm w-full ${errors.name ? 'border-red-400 ring-red-100' : ''}`}
                  placeholder="Citizen full legal name"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  disabled
                  className="input-field text-sm w-full bg-gray-100 text-gray-500 cursor-not-allowed"
                />
                <p className="text-[10px] text-gray-400 mt-1">Unique login identity, cannot be modified</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className={`input-field text-sm w-full ${errors.phone ? 'border-red-400 ring-red-100' : ''}`}
                  placeholder="10-digit mobile number"
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={e => updateField('dob', e.target.value)}
                  className="input-field text-sm w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
                <select
                  value={form.gender}
                  onChange={e => updateField('gender', e.target.value)}
                  className="input-field text-sm w-full"
                >
                  <option value="">Select Gender</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Profession / Domain</label>
                <select
                  value={form.profession}
                  onChange={e => updateField('profession', e.target.value)}
                  className="input-field text-sm w-full"
                >
                  <option value="">Select Profession</option>
                  {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Address Details */}
          <div className="pt-2 border-t border-gray-100">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Residential Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">State / UT</label>
                <select
                  value={form.state}
                  onChange={e => {
                    const st = e.target.value;
                    setForm(prev => ({ ...prev, state: st, district: '', city: '' }));
                  }}
                  className="input-field text-sm w-full"
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">District</label>
                <select
                  value={form.district}
                  disabled={!form.state}
                  onChange={e => {
                    const dst = e.target.value;
                    setForm(prev => ({ ...prev, district: dst, city: '' }));
                  }}
                  className="input-field text-sm w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">{form.state ? 'Select District' : 'Select state first'}</option>
                  {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">City / Town</label>
                {availableCities.length > 0 ? (
                  <select
                    value={form.city}
                    onChange={e => updateField('city', e.target.value)}
                    className="input-field text-sm w-full"
                  >
                    <option value="">Select City / Town</option>
                    {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={form.city}
                    onChange={e => updateField('city', e.target.value)}
                    placeholder="Enter city or village name"
                    className="input-field text-sm w-full"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={form.pincode}
                  onChange={e => updateField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={`input-field text-sm w-full ${errors.pincode ? 'border-red-400 ring-red-100' : ''}`}
                  placeholder="6-digit postal code"
                />
                {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="btn-secondary text-sm px-4 py-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="btn-primary text-sm px-5 py-2 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check size={14} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main UserManagement Component ───────────────────────────────────────────
export default function UserManagement() {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [professionFilter, setProfessionFilter] = useState('All');
  const [selected, setSelected] = useState([]);
  const [editingCitizen, setEditingCitizen] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmPromote, setConfirmPromote] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [toast, setToast] = useState('');

  const loadData = async () => {
    setLoading(true);
    const usersRes = await fetchAdminUsers({ page: 0, size: 500 });
    if (usersRes.data?.content) {
      setAllUsers(usersRes.data.content);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // Filter ONLY normal citizens for this page
  const citizens = useMemo(() => {
    return allUsers.filter(u => {
      const r = (u.role || '').toUpperCase();
      return r === 'ROLE_CITIZEN' || r === 'CITIZEN' || !r;
    });
  }, [allUsers]);

  // Dynamic Citizen Statistics
  const citizenStats = useMemo(() => {
    const total = citizens.length;
    const active = citizens.filter(c => c.status === 'Active').length;
    const suspended = citizens.filter(c => c.status === 'Suspended').length;
    const pending = citizens.filter(c => !c.profileComplete || c.status === 'Pending').length;
    return { total, active, suspended, pending };
  }, [citizens]);

  // Dynamic Search & Filtering
  const filtered = useMemo(() => {
    return citizens.filter(c => {
      // 1. Search query: matches name, email, or user ID
      const q = query.trim().toLowerCase();
      let matchesQuery = true;
      if (q) {
        const idStr = String(c.id || '');
        const idWithHash = `#${idStr}`;
        const nameStr = (c.name || '').toLowerCase();
        const emailStr = (c.email || '').toLowerCase();
        const phoneStr = (c.phone || '').toLowerCase();
        matchesQuery = nameStr.includes(q) || emailStr.includes(q) || idStr.includes(q) || idWithHash.includes(q) || phoneStr.includes(q);
      }

      // 2. Status filter
      let matchesStatus = true;
      if (statusFilter !== 'All') {
        matchesStatus = c.status === statusFilter;
      }

      // 3. Profession filter
      let matchesProfession = true;
      if (professionFilter !== 'All') {
        const p = (c.profession || '').toLowerCase().replace(/_/g, ' ');
        const target = professionFilter.toLowerCase();
        matchesProfession = p === target || p.includes(target);
      }

      return matchesQuery && matchesStatus && matchesProfession;
    });
  }, [citizens, query, statusFilter, professionFilter]);

  const { page, setPage, pageItems: pagedCitizens } = usePagination(filtered, 10);

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleSelectAll = () => setSelected(selected.length === filtered.length && filtered.length > 0 ? [] : filtered.map(u => u.id));

  // Row Action Handlers
  const handleToggleStatus = async (citizen) => {
    const isCurrentlyActive = citizen.status === 'Active';
    const { error } = await toggleUserStatus(citizen.id);
    if (error) {
      showToast(`Error: ${error}`);
    } else {
      showToast(isCurrentlyActive ? `${citizen.name} has been suspended.` : `${citizen.name} account is now active.`);
      loadData();
    }
    setOpenMenuId(null);
  };

  const handlePromoteToDataManager = async (citizen) => {
    const { error } = await toggleDataManagerRole(citizen.id);
    if (error) {
      showToast(`Error: ${error}`);
    } else {
      showToast(`Success: ${citizen.name} promoted to Data Manager. Moved to Data Manager Management.`);
      loadData();
    }
    setConfirmPromote(null);
    setOpenMenuId(null);
  };

  const removeCitizen = async (citizenToDelete) => {
    if (!citizenToDelete) return;
    const { error } = await deleteAdminUser(citizenToDelete.id);
    if (error) {
      showToast(`Error: ${error}`);
    } else {
      showToast(`Citizen ${citizenToDelete.name} removed successfully.`);
      loadData();
    }
    setConfirmDelete(null);
    setSelected(prev => prev.filter(x => x !== citizenToDelete.id));
  };

  const handleCitizenSaved = (updated) => {
    showToast(`Citizen ${updated.name || 'profile'} updated successfully!`);
    setEditingCitizen(null);
    loadData();
  };

  return (
    <div className="space-y-5">
      {/* Dual Back Navigation */}
      <BackNavigation dashboardPath="/admin/dashboard" />

      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title="Citizen Management"
          subtitle={`Manage registered Indian citizens, demographic profiles, and account statuses (${citizens.length} registered citizens)`}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadCSV(selected.length ? citizens.filter(u => selected.includes(u.id)) : filtered)}
            className="btn-secondary text-sm flex items-center gap-1.5"
          >
            <Download size={15} /> Export Citizens {selected.length ? `(${selected.length})` : ''}
          </button>
        </div>
      </div>

      {/* Stat Strip - Specific to Citizens */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Citizens', value: citizenStats.total, icon: Users, color: 'text-gov-blue bg-gov-blue-50' },
          { label: 'Active Citizens', value: citizenStats.active, icon: ShieldCheck, color: 'text-green-600 bg-green-50' },
          { label: 'Suspended Citizens', value: citizenStats.suspended, icon: ShieldOff, color: 'text-red-600 bg-red-50' },
          { label: 'Pending Profile', value: citizenStats.pending, icon: Filter, color: 'text-yellow-600 bg-yellow-50' },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon size={16} />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800 leading-none">{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Strip */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        {/* Dynamic Search by Name, Email, or User ID */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search citizens by name, email, or user ID..."
            className="input-field text-sm pl-9 w-full"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-semibold text-gray-500 hidden sm:inline">Status:</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input-field text-sm w-auto"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        {/* Profession Filter */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-semibold text-gray-500 hidden sm:inline">Profession:</label>
          <select
            value={professionFilter}
            onChange={e => setProfessionFilter(e.target.value)}
            className="input-field text-sm w-auto max-w-[200px]"
          >
            <option value="All">All Professions</option>
            {PROFESSIONS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Reset Filter Button */}
        {(query || statusFilter !== 'All' || professionFilter !== 'All') && (
          <button
            onClick={() => { setQuery(''); setStatusFilter('All'); setProfessionFilter('All'); }}
            className="text-xs text-gov-blue hover:underline font-medium px-2 py-1"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Citizens Table */}
      <div className="card overflow-visible">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="py-3 px-4 w-8">
                <input
                  type="checkbox"
                  checked={selected.length === filtered.length && filtered.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide text-left">Citizen / ID</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide text-left">Contact Info</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide text-left">Profession & Location</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide text-left">Status</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide text-left">Joined Date</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pagedCitizens.map((u, i) => {
              const locationStr = [u.city, u.district, u.state].filter(Boolean).join(', ');
              return (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-gray-50/80 transition-colors relative"
                >
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selected.includes(u.id)}
                      onChange={() => toggleSelect(u.id)}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gov-blue-50 text-gov-blue font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-sm border border-gov-blue/10">
                        {(u.name || 'C').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 leading-tight">{u.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded">
                            ID: #{u.id}
                          </span>
                          {!u.profileComplete && (
                            <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              Profile Pending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Contact Info */}
                  <td className="py-3 px-4 text-xs text-gray-600">
                    <p className="flex items-center gap-1.5 font-medium text-gray-800">
                      <Mail size={12} className="text-gray-400 flex-shrink-0" />
                      <span>{u.email}</span>
                    </p>
                    <p className="flex items-center gap-1.5 mt-1 text-gray-500">
                      <Phone size={12} className="text-gray-400 flex-shrink-0" />
                      <span>{u.phone || '—'}</span>
                    </p>
                  </td>

                  {/* Profession & Location */}
                  <td className="py-3 px-4 text-xs">
                    <div>
                      {u.profession ? (
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${professionBadge(u.profession)}`}>
                          {u.profession.replace(/_/g, ' ')}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">No profession set</span>
                      )}
                    </div>
                    <p className="flex items-center gap-1 text-gray-500 text-[11px] mt-1">
                      <MapPin size={11} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate max-w-[180px]">{locationStr || 'Location not set'}</span>
                    </p>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <span className={`badge text-xs font-semibold ${statusBadge(u.status)}`}>
                      {u.status}
                    </span>
                  </td>

                  {/* Joined Date */}
                  <td className="py-3 px-4 text-xs text-gray-500 font-medium">
                    {formatJoinedDate(u.joined)}
                  </td>

                  {/* Actions column */}
                  <td className="py-3 px-4 text-right relative">
                    <div className="flex items-center justify-end gap-1">
                      {/* Quick Edit Profile Button */}
                      <button
                        onClick={() => setEditingCitizen(u)}
                        title="Edit Profile"
                        className="p-1.5 rounded-lg text-gray-600 hover:text-gov-blue hover:bg-gov-blue-50 transition-colors"
                      >
                        <Edit3 size={15} />
                      </button>

                      {/* Quick Make Data Manager Button */}
                      <button
                        onClick={() => setConfirmPromote(u)}
                        title="Make Data Manager"
                        className="p-1.5 rounded-lg text-gray-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                      >
                        <UserCheck size={15} />
                      </button>

                      {/* Menu for Suspend / Delete */}
                      <button
                        onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                      >
                        <MoreVertical size={15} />
                      </button>
                    </div>

                    {/* Kebab Popover Menu */}
                    <AnimatePresence>
                      {openMenuId === u.id && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="absolute right-4 top-10 z-20 bg-white border border-gray-100 rounded-xl shadow-lg py-1 w-48 text-left"
                        >
                          <button
                            onClick={() => { setEditingCitizen(u); setOpenMenuId(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                          >
                            <Edit3 size={13} className="text-gov-blue" />
                            Edit Profile Info
                          </button>

                          <button
                            onClick={() => { setConfirmPromote(u); setOpenMenuId(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-700 hover:bg-blue-50"
                          >
                            <UserCheck size={13} className="text-blue-600" />
                            Make Data Manager
                          </button>

                          <button
                            onClick={() => handleToggleStatus(u)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                          >
                            {u.status === 'Active' ? (
                              <>
                                <ShieldOff size={13} className="text-red-500" />
                                Suspend Account
                              </>
                            ) : (
                              <>
                                <ShieldCheck size={13} className="text-green-500" />
                                Activate Account
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => { setConfirmDelete(u); setOpenMenuId(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={13} />
                            Remove Citizen
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </td>
                </motion.tr>
              );
            })}

            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users size={24} className="text-gray-300" />
                    <p className="font-medium text-gray-600">No citizens match your filter criteria.</p>
                    <p className="text-xs text-gray-400">Try changing your search keywords or resetting filters.</p>
                  </div>
                </td>
              </tr>
            )}

            {loading && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-gray-400">
                  <div className="flex items-center justify-center gap-2 text-gov-blue">
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Loading citizens from database...</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalItems={filtered.length} pageSize={10} onPageChange={setPage} />

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {editingCitizen && (
          <EditCitizenModal
            citizen={editingCitizen}
            onClose={() => setEditingCitizen(null)}
            onSaved={handleCitizenSaved}
          />
        )}
      </AnimatePresence>

      {/* Promote to Data Manager Confirmation Modal */}
      <AnimatePresence>
        {confirmPromote && (
          <div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setConfirmPromote(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center"
            >
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserCheck size={22} />
              </div>
              <h3 className="font-bold text-gray-800 text-base mb-1">Make Data Manager?</h3>
              <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                Are you sure you want to promote <strong>{confirmPromote.name}</strong> to a Data Manager? They will gain administrative access to upload and review documents.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handlePromoteToDataManager(confirmPromote)}
                  className="flex-1 bg-gov-blue text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-gov-blue-600 transition-colors shadow-sm"
                >
                  Confirm & Promote
                </button>
                <button
                  onClick={() => setConfirmPromote(null)}
                  className="btn-secondary text-sm flex-1"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center"
            >
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 size={20} />
              </div>
              <h3 className="font-bold text-gray-800 text-base mb-1">Remove {confirmDelete.name}?</h3>
              <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                This action will deactivate this citizen account from InfoSeva and revoke their access.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => removeCitizen(confirmDelete)}
                  className="flex-1 bg-red-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-red-700 transition-colors shadow-sm"
                >
                  Remove
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="btn-secondary text-sm flex-1"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl z-50 flex items-center gap-2"
          >
            <Check size={15} className="text-green-400" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
