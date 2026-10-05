import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings as SettingsIcon, Shield, Database, Save, CheckCircle2,
  Globe, Wrench, Calendar, Clock, AlertTriangle, Info, Loader2,
} from 'lucide-react';
import { PageHeader, Switch, BackNavigation } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';

const REASONS = ['Scheduled Maintenance', 'Emergency Maintenance', 'System Upgrade', 'Security Patch', 'Database Migration'];
const AFFECTED_ROLES = ['Citizen', 'Guest', 'Data Manager'];

// ─── Platform Name Section ────────────────────────────────────────────────────
function PlatformNameSection({ platformName, savePlatformName }) {
  const [draft, setDraft] = useState(platformName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Sync if context changes (e.g. another component saves it)
  useEffect(() => { setDraft(platformName); }, [platformName]);

  const handleSave = async () => {
    if (!draft.trim()) { setError('Platform name cannot be empty'); return; }
    if (draft.trim() === platformName) { setSaved(true); setTimeout(() => setSaved(false), 2000); return; }
    setSaving(true); setError('');
    const { error: err } = await savePlatformName(draft.trim());
    setSaving(false);
    if (err) { setError(err); }
    else { setSaved(true); setTimeout(() => setSaved(false), 2500); }
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">
        Platform Name
      </label>
      <div className="flex gap-2">
        <input
          className={`input-field text-sm flex-1 ${error ? 'border-red-400' : ''}`}
          value={draft}
          onChange={e => { setDraft(e.target.value); setError(''); setSaved(false); }}
          placeholder="e.g. InfoSeva"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary text-sm flex items-center gap-1.5 flex-shrink-0 disabled:opacity-70"
        >
          {saving
            ? <Loader2 size={14} className="animate-spin" />
            : saved
              ? <CheckCircle2 size={14} />
              : <Save size={14} />
          }
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Apply'}
        </button>
      </div>

      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={11} /> {error}</p>}

      {/* Live preview */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs text-blue-700">
        <Info size={13} className="flex-shrink-0" />
        <span>
          Preview: <strong>{draft || 'InfoSeva'}</strong> will appear in the sidebar, browser tab title, and all public-facing pages.
          The backend (<code>GET /api/admin/config/platform</code>) is the source of truth.
        </span>
      </div>
    </div>
  );
}

// ─── Maintenance Config Section ───────────────────────────────────────────────
function MaintenanceSection({ maintenanceConfig, setMaintenanceConfig }) {
  const upM = (k, v) => setMaintenanceConfig(prev => ({ ...prev, [k]: v }));
  const toggleRole = (role) => {
    const cur = maintenanceConfig.affectedRoles || [];
    setMaintenanceConfig(prev => ({
      ...prev,
      affectedRoles: cur.includes(role) ? cur.filter(r => r !== role) : [...cur, role],
    }));
  };

  const m = maintenanceConfig;
  const isActive = m.enabled;

  return (
    <div className="space-y-4">
      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-700 font-medium">Enable Maintenance Mode</p>
          <p className="text-xs text-gray-400">Affected users will see the maintenance screen instead of the application</p>
        </div>
        <Switch checked={m.enabled} onChange={v => upM('enabled', v)} />
      </div>

      {/* Active warning */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2 text-xs text-red-700"
          >
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <p><strong>Maintenance mode is currently ENABLED.</strong> Affected users cannot access the platform. Administrators retain full access.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emergency toggle */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div>
          <p className="text-sm text-gray-700 font-medium flex items-center gap-2">
            Emergency Mode <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded uppercase">Immediate</span>
          </p>
          <p className="text-xs text-gray-400">Bypasses scheduled times — takes effect immediately when Maintenance Mode is enabled</p>
        </div>
        <Switch checked={m.isEmergency} onChange={v => upM('isEmergency', v)} />
      </div>

      {/* Schedule (hidden when emergency) */}
      <AnimatePresence>
        {!m.isEmergency && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block flex items-center gap-1">
                  <Calendar size={11} /> Start Date
                </label>
                <input type="date" className="input-field text-sm" value={m.startDate} onChange={e => upM('startDate', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block flex items-center gap-1">
                  <Clock size={11} /> Start Time
                </label>
                <input type="time" className="input-field text-sm" value={m.startTime} onChange={e => upM('startTime', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block flex items-center gap-1">
                  <Calendar size={11} /> End Date
                </label>
                <input type="date" className="input-field text-sm" value={m.endDate} onChange={e => upM('endDate', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block flex items-center gap-1">
                  <Clock size={11} /> Expected End Time
                </label>
                <input type="time" className="input-field text-sm" value={m.endTime} onChange={e => upM('endTime', e.target.value)} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reason */}
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Reason</label>
        <select className="input-field text-sm" value={m.reason} onChange={e => upM('reason', e.target.value)}>
          {REASONS.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      {/* Message */}
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">
          Maintenance Message <span className="text-gray-400 font-normal">(shown to affected users)</span>
        </label>
        <textarea
          className="input-field text-sm resize-none min-h-20"
          maxLength={500}
          value={m.message}
          onChange={e => upM('message', e.target.value)}
          placeholder="We are performing scheduled maintenance..."
        />
        <p className="text-[10px] text-gray-400 text-right mt-0.5">{m.message.length}/500</p>
      </div>

      {/* Affected Roles */}
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-2 block">Affected Roles</label>
        <div className="flex flex-wrap gap-3">
          {AFFECTED_ROLES.map(role => (
            <label key={role} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                className="accent-gov-blue"
                checked={(m.affectedRoles || []).includes(role)}
                onChange={() => toggleRole(role)}
              />
              {role}
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          Administrators always retain access regardless of this setting.
        </p>
      </div>

      {/* Maintenance page preview */}
      {isActive && (
        <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 text-center">
          <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Maintenance Page Preview</p>
          <div className="text-2xl mb-1">🔧</div>
          <p className="font-bold text-gray-800">{m.reason}</p>
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">{m.message}</p>
          {!m.isEmergency && m.startDate && m.endDate && (
            <p className="text-xs text-gov-blue mt-2">
              {m.startDate} {m.startTime} → {m.endDate} {m.endTime}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Settings() {
  const {
    platformName, savePlatformName,
    maintenanceConfig, setMaintenanceConfig,
    platformSettings, loadPlatformSettings, settingsLoading, saveSettings,
  } = useAdmin();

  // Local settings state (inherits from context when loaded)
  const [settings, setSettings] = useState({
    contactEmail: 'support@infoseva.gov.in',
    supportPhone: '1800-11-4567',
    twoFactorAuth: true,
    sessionTimeoutMins: 30,
    ipWhitelistEnabled: false,
    passwordMinLength: 12,
    autoSyncIntervalHrs: 6,
    ocrEngine: 'Tesseract v5',
    aiModelProvider: 'Claude Sonnet 5',
    storageLimitGB: 500,
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load settings from backend on mount
  useEffect(() => { loadPlatformSettings(); }, [loadPlatformSettings]);

  // Sync context settings into local form when available
  useEffect(() => {
    if (platformSettings) {
      const { maintenance, ...rest } = platformSettings;
      setSettings(s => ({ ...s, ...rest }));
    }
  }, [platformSettings]);

  const update = (k, v) => setSettings(prev => ({ ...prev, [k]: v }));

  const handleSaveAll = async () => {
    setSaving(true);
    const { error } = await saveSettings({ ...settings, maintenance: maintenanceConfig });
    setSaving(false);
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Dual Back Navigation */}
      <BackNavigation dashboardPath="/admin/dashboard" />

      <PageHeader title="Platform Settings" subtitle="Configure InfoSeva platform behaviour, security, and integrations." />

      {settingsLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 size={14} className="animate-spin" /> Loading settings from backend…
        </div>
      )}

      {/* Save success */}
      <AnimatePresence>
        {saved && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
            <CheckCircle2 size={16} /> All settings saved successfully.
          </motion.div>
        )}
      </AnimatePresence>

      {/* General */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
          <Globe size={16} className="text-gov-blue" /> General Settings
        </h3>
        <div className="space-y-4">
          {/* Platform Name — fetched from backend, propagated via context */}
          <PlatformNameSection platformName={platformName} savePlatformName={savePlatformName} />

          <div className="pt-3 border-t border-gray-100">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Contact Email</label>
            <input type="email" className="input-field text-sm" value={settings.contactEmail}
              onChange={e => update('contactEmail', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Support Phone</label>
            <input className="input-field text-sm" value={settings.supportPhone}
              onChange={e => update('supportPhone', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
          <Wrench size={16} className="text-gov-saffron" /> Maintenance Mode
        </h3>
        <MaintenanceSection
          maintenanceConfig={maintenanceConfig}
          setMaintenanceConfig={setMaintenanceConfig}
        />
      </div>

      {/* Security */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Shield size={16} className="text-gov-blue" /> Security Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 font-medium">Two-Factor Authentication</p>
              <p className="text-xs text-gray-400">Require OTP verification for admin logins</p>
            </div>
            <Switch checked={settings.twoFactorAuth} onChange={v => update('twoFactorAuth', v)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Session Timeout (minutes)</label>
            <input type="number" min={5} max={120} className="input-field text-sm"
              value={settings.sessionTimeoutMins} onChange={e => update('sessionTimeoutMins', Number(e.target.value))} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 font-medium">IP Whitelist</p>
              <p className="text-xs text-gray-400">Restrict admin portal access to approved IP ranges</p>
            </div>
            <Switch checked={settings.ipWhitelistEnabled} onChange={v => update('ipWhitelistEnabled', v)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Minimum Password Length</label>
            <input type="number" min={8} max={32} className="input-field text-sm"
              value={settings.passwordMinLength} onChange={e => update('passwordMinLength', Number(e.target.value))} />
          </div>
        </div>
      </div>

      {/* Data */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Database size={16} className="text-gov-blue" /> Data Settings
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Auto-sync Interval (hours)</label>
            <input type="number" min={1} max={24} className="input-field text-sm"
              value={settings.autoSyncIntervalHrs} onChange={e => update('autoSyncIntervalHrs', Number(e.target.value))} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">OCR Engine</label>
            <select className="input-field text-sm" value={settings.ocrEngine} onChange={e => update('ocrEngine', e.target.value)}>
              {['Tesseract v5', 'Google Cloud Vision', 'AWS Textract'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">AI Model Provider</label>
            <select className="input-field text-sm" value={settings.aiModelProvider} onChange={e => update('aiModelProvider', e.target.value)}>
              {['Claude Sonnet 5', 'Claude Haiku 4.5', 'Claude Opus 4.8'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Storage Limit (GB)</label>
            <input type="number" min={50} step={50} className="input-field text-sm"
              value={settings.storageLimitGB} onChange={e => update('storageLimitGB', Number(e.target.value))} />
          </div>
        </div>
      </div>

      <button
        onClick={handleSaveAll}
        disabled={saving}
        className="btn-primary text-sm flex items-center gap-2 disabled:opacity-70"
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {saving ? 'Saving…' : 'Save All Settings'}
      </button>
    </div>
  );
}
