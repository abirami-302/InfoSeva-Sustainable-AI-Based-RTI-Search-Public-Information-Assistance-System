import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, CheckCircle, Mail, Phone, ShieldCheck, ArrowLeft, KeyRound, ChevronDown } from 'lucide-react';

// ─── Reusable styled field (matches registration form look) ───────────────────

function Field({ label, required, children }) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {children}
      </div>
    </div>
  );
}

function TextInput({ hasLeftIcon, hasRightIcon, ...props }) {
  return (
    <input
      {...props}
      className={`w-full ${hasLeftIcon ? 'pl-10' : 'pl-4'} ${hasRightIcon ? 'pr-10' : 'pr-4'} py-3 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gov-blue/30 focus:border-gov-blue transition-colors`}
    />
  );
}

// ─── OTP input row ──────────────────────────────────────────────────────────

function OtpInput({ value, onChange, length = 6 }) {
  const digits = value.split('');
  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    const joined = next.join('').slice(0, length);
    onChange(joined);
    if (val && i < length - 1) {
      document.getElementById(`otp-${i + 1}`)?.focus();
    }
  };
  return (
    <div className="flex gap-2 justify-between">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          value={digits[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !digits[i] && i > 0) {
              document.getElementById(`otp-${i - 1}`)?.focus();
            }
          }}
          maxLength={1}
          inputMode="numeric"
          className="w-11 h-12 text-center text-lg font-semibold rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gov-blue/30 focus:border-gov-blue"
        />
      ))}
    </div>
  );
}

// ─── Main inline section ────────────────────────────────────────────────────
// Renders directly below the "Change Password" button — no popup/overlay.
// Modes: 'change' -> 'forgot-request' -> 'forgot-otp' -> 'forgot-reset' -> 'success'

export default function ChangePasswordSection({ onClose, userEmail, userPhone }) {
  const [mode, setMode] = useState('change');

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  // Forgot password state
  const [contact, setContact] = useState(userEmail || userPhone || '');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNew, setShowForgotNew] = useState(false);

  const getStoredAuth = () => {
    try {
      return JSON.parse(localStorage.getItem('userAuth')) || {};
    } catch {
      return {};
    }
  };

  const saveStoredAuth = (data) => {
    localStorage.setItem('userAuth', JSON.stringify(data));
  };

  // ── Change password flow ──
  const handleChangeSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    const authData = getStoredAuth();
    if (authData.password !== undefined && authData.password !== currentPassword) {
      setError('Current password is incorrect.');
      return;
    }
    saveStoredAuth({ ...authData, password: newPassword });
    setMode('success');
  };

  // ── Forgot password flow ──
  const requestOtp = (e) => {
    e.preventDefault();
    setError('');
    if (!contact.trim()) {
      setError('Please enter your registered email or mobile number.');
      return;
    }
    // No backend/SMS gateway yet. OTP is not actually generated or sent here —
    // any 6-digit code the user enters on the next screen will be accepted.
    setEnteredOtp('');
    setMode('forgot-otp');
  };

  const verifyOtp = (e) => {
    e.preventDefault();
    setError('');
    if (enteredOtp.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    // No backend yet — accept any 6-digit OTP as verified.
    setError('');
    setMode('forgot-reset');
  };

  const resetPassword = (e) => {
    e.preventDefault();
    setError('');
    if (!forgotNewPassword || !forgotConfirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (forgotNewPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    const authData = getStoredAuth();
    saveStoredAuth({ ...authData, password: forgotNewPassword });
    setMode('success');
  };

  return (
    <div className="mt-2 border-t border-gray-100 pt-4">
      <AnimatePresence mode="wait">

        {/* ── Change Password ── */}
        {mode === 'change' && (
          <motion.div key="change" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <form onSubmit={handleChangeSubmit} className="space-y-4">
              <Field label="Current Password" required>
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                <TextInput
                  hasLeftIcon
                  hasRightIcon
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </Field>

              <Field label="New Password" required>
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                <TextInput
                  hasLeftIcon
                  hasRightIcon
                  type={showNew ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </Field>

              <Field label="Confirm New Password" required>
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                <TextInput
                  hasLeftIcon
                  hasRightIcon
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </Field>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex items-center gap-3">
                <button type="submit" className="btn-primary text-sm py-2.5 px-5">
                  Update Password
                </button>
                <button type="button" onClick={onClose} className="btn-secondary text-sm py-2.5 px-5">
                  Cancel
                </button>
              </div>

              <button
                type="button"
                onClick={() => { setError(''); setMode('forgot-request'); }}
                className="text-sm text-gov-blue hover:underline"
              >
                Forgot current password?
              </button>
            </form>
          </motion.div>
        )}

        {/* ── Forgot Password: request OTP ── */}
        {mode === 'forgot-request' && (
          <motion.div key="forgot-request" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <button onClick={() => { setError(''); setMode('change'); }} className="text-gray-400 hover:text-gray-600 mb-3 flex items-center gap-1 text-xs font-medium">
              <ArrowLeft size={14} /> Back
            </button>
            <h4 className="font-semibold text-gray-800 text-sm mb-1 flex items-center gap-2">
              <ShieldCheck size={16} className="text-gov-blue" /> Forgot Password
            </h4>
            <p className="text-xs text-gray-400 mb-4">Enter your registered email or mobile number to receive an OTP.</p>

            <form onSubmit={requestOtp} className="space-y-4">
              <Field label="Email or Mobile Number" required>
                {contact.includes('@') ? (
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                ) : (
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                )}
                <TextInput
                  hasLeftIcon
                  type="text"
                  placeholder="yourname@example.com or 98XXXXXXXX"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
              </Field>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <button type="submit" className="btn-primary text-sm py-2.5 px-5">
                Send OTP
              </button>
            </form>
          </motion.div>
        )}

        {/* ── Forgot Password: enter OTP ── */}
        {mode === 'forgot-otp' && (
          <motion.div key="forgot-otp" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <button onClick={() => { setError(''); setMode('forgot-request'); }} className="text-gray-400 hover:text-gray-600 mb-3 flex items-center gap-1 text-xs font-medium">
              <ArrowLeft size={14} /> Back
            </button>
            <h4 className="font-semibold text-gray-800 text-sm mb-1 flex items-center gap-2">
              <KeyRound size={16} className="text-gov-blue" /> Enter OTP
            </h4>
            <p className="text-xs text-gray-400 mb-4">
              Enter the 6-digit code sent to <span className="font-medium text-gray-600">{contact}</span>.
            </p>

            <form onSubmit={verifyOtp} className="space-y-4">
              <OtpInput value={enteredOtp} onChange={setEnteredOtp} />

              {error && <p className="text-xs text-red-500">{error}</p>}

              <button type="submit" className="btn-primary text-sm py-2.5 px-5">
                Verify OTP
              </button>
            </form>
          </motion.div>
        )}

        {/* ── Forgot Password: reset password ── */}
        {mode === 'forgot-reset' && (
          <motion.div key="forgot-reset" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <h4 className="font-semibold text-gray-800 text-sm mb-1 flex items-center gap-2">
              <Lock size={16} className="text-gov-blue" /> Set New Password
            </h4>
            <p className="text-xs text-gray-400 mb-4">Your identity has been verified. Choose a new password.</p>

            <form onSubmit={resetPassword} className="space-y-4">
              <Field label="New Password" required>
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                <TextInput
                  hasLeftIcon
                  hasRightIcon
                  type={showForgotNew ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowForgotNew(!showForgotNew)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showForgotNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </Field>

              <Field label="Confirm New Password" required>
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                <TextInput
                  hasLeftIcon
                  type="password"
                  placeholder="Re-enter new password"
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                />
              </Field>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <button type="submit" className="btn-primary text-sm py-2.5 px-5">
                Reset Password
              </button>
            </form>
          </motion.div>
        )}

        {/* ── Success ── */}
        {mode === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="text-center py-3">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={24} className="text-green-500" />
            </div>
            <h4 className="font-semibold text-gray-800 text-sm mb-1">Password Updated!</h4>
            <p className="text-xs text-gray-400 mb-4">Your password has been changed successfully.</p>
            <button onClick={onClose} className="btn-primary text-sm py-2.5 px-5">
              Done
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
