import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCog, Search, Download, MoreVertical, Edit3, Trash2, X,
  FileText, Database, Link2, TrendingUp, Mail, Phone,
  AlertCircle, Check, User, ShieldOff, ShieldCheck
} from 'lucide-react';
import { PageHeader, Pagination, BackNavigation } from '../../components/common';
import { usePagination } from '../../hooks/usePagination';
import { fetchAdminUsers, fetchAdminUserById, updateAdminUser, deleteAdminUser, toggleDataManagerRole, toggleUserStatus } from '../../services/adminService';
import { INDIAN_STATES, getDistricts, getCities } from '../../data/india-locations';

const PROFESSIONS = [
  'Student', 'Government Employee', 'Private Employee', 'Self Employed',
  'Business Owner', 'Farmer', 'Teacher', 'Doctor', 'Engineer',
  'Lawyer', 'Journalist', 'Researcher', 'Homemaker', 'Retired',
  'Unemployed', 'Other'
];

const GENDERS = ['Male', 'Female', 'Other'];

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
  const map = { Active: 'bg-green-100 text-green-700', Pending: 'bg-yellow-100 text-yellow-700', Suspended: 'bg-red-100 text-red-700' };
  return map[status] || 'bg-gray-100 text-gray-600';
}

function downloadCSV(rows) {
  const headers = ['ID', 'Name', 'Email', 'Phone', 'Location', 'Status', 'Joined'];
  const csvRows = rows.map(m => [m.id, m.name, m.email, m.phone, m.workLocation, m.status, m.joined]);
  const csv = [headers, ...csvRows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `infoseva-data-managers-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ── Edit Data Manager Modal ──────────────────────────────────────────────────
function EditDataManagerModal({ form, setForm, onSave, onClose, isSaving }) {
  const [errors, setErrors] = useState({});

  const up = (k, v) => setForm(p => ({ ...p, [k]: v }));

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

  const handleSave = () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      onSave(form);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <UserCog size={18} className="text-gov-blue" />
            Edit Data Manager
          </h3>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                className={`input-field text-sm ${errors.name ? 'border-red-400' : ''}`}
                value={form.name || ''}
                onChange={e => { up('name', e.target.value); setErrors(p => ({ ...p, name: '' })); }}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.name}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Email</label>
              <input
                type="email"
                disabled
                className="input-field text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                value={form.email || ''}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Mobile Phone</label>
              <input
                className={`input-field text-sm ${errors.phone ? 'border-red-400' : ''}`}
                placeholder="10 digits"
                maxLength={10}
                value={form.phone || ''}
                onChange={e => { up('phone', e.target.value.replace(/\D/g, '')); setErrors(p => ({ ...p, phone: '' })); }}
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.phone}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Date of Birth</label>
              <input
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                className="input-field text-sm"
                value={form.dob || ''}
                onChange={e => up('dob', e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Gender</label>
              <select
                className="input-field text-sm"
                value={form.gender || ''}
                onChange={e => up('gender', e.target.value)}
              >
                <option value="">Select Gender</option>
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">State</label>
              <select
                className="input-field text-sm"
                value={form.state || ''}
                onChange={e => {
                  up('state', e.target.value);
                  up('district', '');
                  up('city', '');
                }}
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">District</label>
              <select
                className="input-field text-sm"
                value={form.district || ''}
                disabled={!form.state}
                onChange={e => {
                  up('district', e.target.value);
                  up('city', '');
                }}
              >
                <option value="">Select District</option>
                {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">City</label>
              {availableCities.length > 0 ? (
                <select
                  className="input-field text-sm"
                  value={form.city || ''}
                  onChange={e => up('city', e.target.value)}
                >
                  <option value="">Select City</option>
                  {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input
                  className="input-field text-sm"
                  placeholder="Enter city"
                  value={form.city || ''}
                  onChange={e => up('city', e.target.value)}
                />
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Pincode</label>
              <input
                className={`input-field text-sm ${errors.pincode ? 'border-red-400' : ''}`}
                placeholder="6 digits"
                maxLength={6}
                value={form.pincode || ''}
                onChange={e => { up('pincode', e.target.value.replace(/\D/g, '')); setErrors(p => ({ ...p, pincode: '' })); }}
              />
              {errors.pincode && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.pincode}</p>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary text-sm flex items-center gap-1.5 flex-1 justify-center"
          >
            <Check size={15} /> {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button onClick={onClose} disabled={isSaving} className="btn-secondary text-sm flex-1 justify-center">
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DataManagerManagement() {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [editingManager, setEditingManager] = useState(null);
  const [editForm, setEditForm] = useState(emptyProfileForm);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmRemoveRole, setConfirmRemoveRole] = useState(null); // { id, name }
  const [openMenuId, setOpenMenuId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const loadDataManagers = async () => {
    setLoading(true);
    const { data } = await fetchAdminUsers({ role: 'ROLE_DATA_MANAGER', size: 100 });
    if (data?.content && data.content.length) {
      setManagers(data.content.map((dm, idx) => ({
        id: dm.id,
        rawId: dm.id,
        displayId: `DM${String(idx + 1).padStart(2, '0')}`,
        name: dm.name || 'Data Manager',
        email: dm.email,
        phone: dm.phone || '—',
        rawPhone: dm.phone || '',
        dob: dm.dob || '',
        gender: dm.gender ? (dm.gender.charAt(0) + dm.gender.slice(1).toLowerCase()) : '',
        profession: dm.profession ? dm.profession.replace(/_/g, ' ') : '',
        state: dm.state || '',
        district: dm.district || '',
        city: dm.city || '',
        pincode: dm.pincode || '',
        workLocation: dm.city ? `${dm.city}, ${dm.state || ''}` : (dm.state || '—'),
        uploadPermission: true,
        apiAccess: true,
        approvalPermission: true,
        docs: 0,
        records: 0,
        apis: 0,
        status: dm.status || 'Active',
        joined: dm.joined ? new Date(dm.joined).toISOString().slice(0, 10) : '—',
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDataManagers();
  }, []);

  const showToast = msg => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); };

  const filtered = useMemo(() =>
    managers.filter(m => `${m.name} ${m.email} ${m.id} ${m.phone}`.toLowerCase().includes(query.toLowerCase())),
    [managers, query]
  );

  const { page, setPage, pageItems: pagedManagers } = usePagination(filtered, 10);
  const maxDocs = Math.max(...managers.map(m => m.docs), 1);
  const totals = useMemo(() => ({
    docs: managers.reduce((s, m) => s + m.docs, 0),
    records: managers.reduce((s, m) => s + m.records, 0),
    apis: managers.reduce((s, m) => s + m.apis, 0),
  }), [managers]);

  const openEdit = async (m) => {
    setOpenMenuId(null);
    setEditingManager(m);

    // Initial pre-fill from row
    setEditForm({
      name: m.name || '',
      email: m.email || '',
      phone: m.rawPhone || (m.phone === '—' ? '' : m.phone) || '',
      dob: m.dob || '',
      gender: m.gender || '',
      profession: m.profession || '',
      state: m.state || '',
      district: m.district || '',
      city: m.city || '',
      pincode: m.pincode || ''
    });

    // Real fetch from Oracle backend
    const { data } = await fetchAdminUserById(m.id || m.rawId);
    if (data) {
      setEditForm({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        dob: data.dob || '',
        gender: data.gender ? (data.gender.charAt(0) + data.gender.slice(1).toLowerCase()) : '',
        profession: data.profession ? data.profession.replace(/_/g, ' ') : '',
        state: data.state || '',
        district: data.district || '',
        city: data.city || '',
        pincode: data.pincode || ''
      });
    }
  };

  const handleSaveProfile = async (formData) => {
    if (!editingManager) return;
    setIsSaving(true);

    const payload = {
      name: formData.name.trim(),
      phone: formData.phone ? formData.phone.trim() : null,
      dob: formData.dob || null,
      gender: formData.gender ? formData.gender.toUpperCase() : null,
      profession: formData.profession ? formData.profession.toUpperCase().replace(/\s+/g, '_') : null,
      state: formData.state || null,
      district: formData.district || null,
      city: formData.city || null,
      pincode: formData.pincode || null
    };

    const { data, error } = await updateAdminUser(editingManager.id || editingManager.rawId, payload);
    setIsSaving(false);

    if (error) {
      showToast(error);
    } else {
      showToast(`Data Manager ${formData.name} profile updated successfully`);
      setEditingManager(null);
      loadDataManagers();
    }
  };

  const removeManager = async (manager) => {
    if (!manager) return;
    const { error } = await deleteAdminUser(manager.id || manager.rawId);
    if (error) {
      showToast(error);
    } else {
      showToast('Data manager removed successfully');
      loadDataManagers();
    }
    setConfirmDelete(null);
  };

  // Demote: removes ROLE_DATA_MANAGER, user reverts to ROLE_CITIZEN
  const handleRemoveRole = async (manager) => {
    if (!manager) return;
    const { error } = await toggleDataManagerRole(manager.id || manager.rawId);
    if (error) {
      showToast(`Failed to remove role: ${error}`);
    } else {
      showToast(`${manager.name}'s Data Manager role removed. Account reverted to Citizen.`);
      loadDataManagers();
    }
    setConfirmRemoveRole(null);
  };

  const handleToggleStatus = async (manager) => {
    if (!manager) return;
    const isCurrentlyActive = manager.status === 'Active';
    const { error } = await toggleUserStatus(manager.id || manager.rawId);
    if (error) {
      showToast(`Failed to update status: ${error}`);
    } else {
      showToast(isCurrentlyActive ? `${manager.name} account suspended.` : `${manager.name} account activated.`);
      loadDataManagers();
    }
    setOpenMenuId(null);
  };

  return (
    <div className="space-y-5">
      {/* Dual Back Navigation */}
      <BackNavigation dashboardPath="/admin/dashboard" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader title="Data Manager Management" subtitle="Oversee all data managers and their account profiles." />
        <div className="flex items-center gap-2">
          <button onClick={() => downloadCSV(filtered)} className="btn-secondary text-sm flex items-center gap-1.5">
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4 flex items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="input-field text-sm pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-visible">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Name / ID', 'Contact', 'Location', 'Status', 'Joined Date', ''].map(h => (
                <th key={h} className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pagedManagers.map((m, i) => (
              <motion.tr key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gov-blue-50 text-gov-blue font-semibold flex items-center justify-center text-xs">
                      {(m.name || 'DM').split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{m.name}</p>
                      <p className="text-xs text-gray-400">ID: {m.id}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-xs text-gray-500">
                  <p className="flex items-center gap-1"><Mail size={11} /> {m.email}</p>
                  <p className="flex items-center gap-1 mt-0.5"><Phone size={11} /> {m.phone}</p>
                </td>
                <td className="py-3 px-4 text-xs text-gray-500">
                  <p className="text-gray-700">{m.workLocation}</p>
                </td>
                <td className="py-3 px-4">
                  <span className={`badge text-xs ${statusBadge(m.status)}`}>{m.status}</span>
                </td>
                <td className="py-3 px-4 text-xs text-gray-500 font-medium">
                  {m.joined}
                </td>
                <td className="py-3 px-4 text-right relative">
                  <button onClick={() => setOpenMenuId(openMenuId === m.id ? null : m.id)} className="p-1.5 rounded-lg hover:bg-gray-100">
                    <MoreVertical size={15} className="text-gray-500" />
                  </button>
                  <AnimatePresence>
                    {openMenuId === m.id && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute right-4 top-10 z-20 bg-white border border-gray-100 rounded-xl shadow-lg py-1 w-36 text-left"
                      >
                        <button
                          onClick={() => openEdit(m)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          <Edit3 size={13} /> Edit Details
                        </button>
                        <button
                          onClick={() => handleToggleStatus(m)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          {m.status === 'Active' ? <ShieldOff size={13} className="text-red-500" /> : <ShieldCheck size={13} className="text-green-500" />}
                          {m.status === 'Active' ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          onClick={() => { setConfirmRemoveRole(m); setOpenMenuId(null); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-orange-600 hover:bg-orange-50"
                        >
                          <ShieldOff size={13} /> Remove Role
                        </button>
                        <button
                          onClick={() => { setConfirmDelete(m); setOpenMenuId(null); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={13} /> Delete Account
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </td>
              </motion.tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="py-10 text-center text-sm text-gray-400">No data managers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalItems={filtered.length} pageSize={10} onPageChange={setPage} />

      {/* Edit Data Manager Modal */}
      <AnimatePresence>
        {editingManager && (
          <EditDataManagerModal
            form={editForm}
            setForm={setEditForm}
            onSave={handleSaveProfile}
            onClose={() => setEditingManager(null)}
            isSaving={isSaving}
          />
        )}
      </AnimatePresence>

      {/* Remove Data Manager Role confirmation */}
      <AnimatePresence>
        {confirmRemoveRole && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmRemoveRole(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center"
            >
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShieldOff size={20} />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Remove Data Manager Role?</h3>
              <p className="text-xs text-gray-500 mb-1">
                <span className="font-bold text-gray-700">{confirmRemoveRole.name}</span>
              </p>
              <p className="text-xs text-gray-400 mb-5">
                This will revoke their Data Manager privileges. Their account will revert to a Citizen role. The account will <strong>not</strong> be deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleRemoveRole(confirmRemoveRole)}
                  className="flex-1 bg-orange-500 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-orange-600 transition-colors"
                >
                  Remove Role
                </button>
                <button onClick={() => setConfirmRemoveRole(null)} className="btn-secondary text-sm flex-1">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete account confirmation */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center"
            >
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 size={20} />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Remove {confirmDelete.name}?</h3>
              <p className="text-xs text-gray-400 mb-5">This action will deactivate the Data Manager account in InfoSeva.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => removeManager(confirmDelete)}
                  className="flex-1 bg-red-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-red-700 transition-colors"
                >
                  Remove
                </button>
                <button onClick={() => setConfirmDelete(null)} className="btn-secondary text-sm flex-1">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg z-50"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
