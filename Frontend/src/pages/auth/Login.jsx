import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import {
  Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight,
  CheckCircle, Sparkles, ChevronDown, Loader, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SHOW_TEST_LOGIN = process.env.REACT_APP_SHOW_TEST_LOGIN !== 'false';

function TricolorBar() {
  return (
    <div className="h-1.5 w-full flex">
      <div className="flex-1 bg-gov-saffron" />
      <div className="flex-1 bg-white" />
      <div className="flex-1 bg-gov-green" />
    </div>
  );
}

function AshokaEmblem({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Ashoka Chakra">
      <circle cx="50" cy="50" r="46" stroke="#000080" strokeWidth="4" fill="none" />
      <circle cx="50" cy="50" r="8" fill="#000080" />
      {[...Array(24)].map((_, i) => {
        const angle = (i * 360) / 24;
        const rad = (angle * Math.PI) / 180;
        const x2 = 50 + 44 * Math.cos(rad);
        const y2 = 50 + 44 * Math.sin(rad);
        return <line key={i} x1="50" y1="50" x2={x2} y2={y2} stroke="#000080" strokeWidth="2" />;
      })}
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  useEffect(() => {
    if (user) {
      const destination = user.role === 'admin' || user.role === 'ROLE_ADMIN' ? '/admin' : (user.role === 'datamanager' || user.role === 'ROLE_DATA_MANAGER' ? '/datamanager' : '/user');
      navigate(destination, { replace: true });
    }
  }, [user, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);

  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [capsLock, setCapsLock] = useState(false);



  // Forgot Password Modal State
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Target, 2: Verify OTP & New Password
  const [forgotTarget, setForgotTarget] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPw, setForgotNewPw] = useState('');
  const [forgotConfirm, setForgotConfirm] = useState('');
  const [forgotDone, setForgotDone] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Dev Auto-Fill Collapsible Panel State
  const [devOpen, setDevOpen] = useState(false);

  const DEFAULT_TEST_USERS = [
    { email: 'priya.sharma@example.com', password: 'Password@123', role: 'user', name: 'Priya Sharma', label: 'Citizen User' },
    { email: 'anita.nair@example.com', password: 'Password@123', role: 'admin', name: 'Anita Nair', label: 'Platform Admin' },
    { email: 'meena.k@example.com', password: 'Password@123', role: 'datamanager', name: 'Meena Krishnan', label: 'Data Manager' }
  ];

  const [testUsers, setTestUsers] = useState(() => {
    try {
      const cached = localStorage.getItem('infoseva_dev_profiles');
      if (cached) {
        const parsed = JSON.parse(cached);
        return DEFAULT_TEST_USERS.map(u => ({
          ...u,
          name: parsed[u.email]?.name || u.name,
          profilePhotoUrl: parsed[u.email]?.photo || u.profilePhotoUrl
        }));
      }
    } catch (e) {}
    return DEFAULT_TEST_USERS;
  });

  useEffect(() => {
    fetch('http://localhost:8081/api/auth/test-users')
      .then(res => res.json())
      .then(resData => {
        if (resData.success && Array.isArray(resData.data)) {
          setTestUsers(resData.data);
          try {
            const cache = {};
            resData.data.forEach(u => {
              cache[u.email] = { name: u.name, photo: u.profilePhotoUrl };
            });
            localStorage.setItem('infoseva_dev_profiles', JSON.stringify(cache));
          } catch (e) {}
        }
      })
      .catch(err => console.warn('Could not fetch test users:', err));
  }, []);

  const handleKeyDown = (e) => {
    setCapsLock(e.getModifierState('CapsLock'));
  };

  const validateLogin = () => {
    const errs = {};
    const em = email.trim();
    if (!em) errs.email = 'Email address is required';
    else if (!EMAIL_RE.test(em)) errs.email = 'Enter a valid email address';
    if (!password) errs.password = 'Password is required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Live Backend HTTP Call: Login
  // The backend is the ONLY authentication authority.
  // No offline fallback. No USER_DB authentication.
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateLogin()) return;
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8081/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const resData = await response.json();
      setLoading(false);

      if (response.ok && resData.success) {
        const u = resData.data?.user;
        const accessToken = resData.data?.accessToken;
        const refreshToken = resData.data?.refreshToken;

        // Guard: backend must supply both tokens and user object
        if (!u || !accessToken || !refreshToken) {
          setError('Authentication server returned an incomplete response. Please try again.');
          return;
        }

        const tokens = { accessToken, refreshToken };
        const role = u.role === 'ROLE_ADMIN' ? 'admin' : u.role === 'ROLE_DATA_MANAGER' ? 'datamanager' : 'user';
        login(role, {
          id: u.id,
          name: u.name,
          email: u.email,
          authProvider: u.authProvider,
          profession: u.profession,
          photo: u.profilePhotoUrl,
          phone: u.phoneNumber,
          state: u.state,
          city: u.city,
        }, tokens);
        navigate(role === 'admin' ? '/admin' : role === 'datamanager' ? '/datamanager' : '/user');
      } else {
        // Backend returned a structured error — display it to the user
        const status = response.status;
        if (status === 429) {
          setError(resData.message || 'Too many login attempts. Please wait before trying again.');
        } else if (status === 401 || status === 400) {
          setError(resData.message || 'Invalid email or password. Please check your credentials and try again.');
        } else if (status === 403) {
          setError(resData.message || 'Your account has been disabled. Please contact support.');
        } else if (status >= 500) {
          setError('Authentication server encountered an error. Please try again later.');
        } else {
          setError(resData.message || 'Login failed. Please try again.');
        }
      }
    } catch (err) {
      setLoading(false);
      // Network error — backend is unreachable
      setError('Unable to connect to the authentication server. Please check your network connection or try again later.');
    }
  };

  // Live Backend HTTP Call: Google OAuth2 Login via GIS ID Token
  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    if (!credentialResponse?.credential) {
      setError('Failed to receive authentication credential from Google.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8081/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: credentialResponse.credential })
      });

      const resData = await response.json();
      setLoading(false);

      if (response.ok && resData.success) {
        const u = resData.data?.user;
        const accessToken = resData.data?.accessToken;
        const refreshToken = resData.data?.refreshToken;

        if (!u || !accessToken || !refreshToken) {
          setError('Authentication server returned an incomplete response. Please try again.');
          return;
        }

        const tokens = { accessToken, refreshToken };
        const role = u.role === 'ROLE_ADMIN' ? 'admin' : u.role === 'ROLE_DATA_MANAGER' ? 'datamanager' : 'user';
        login(role, { name: u.name, email: u.email, authProvider: u.authProvider }, tokens);
        navigate(role === 'admin' ? '/admin' : role === 'datamanager' ? '/datamanager' : '/user');
      } else {
        setError(resData.message || 'Google authentication failed. Please try again.');
      }
    } catch (err) {
      setLoading(false);
      setError('Unable to connect to the authentication server. Please check your network connection.');
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign-In was cancelled or failed to initialize.');
  };

  // Live Backend HTTP Call: Send Recovery OTP
  const handleSendForgotOtp = async (e) => {
    e.preventDefault();
    if (!forgotTarget.trim()) {
      setForgotError('Please enter your registered email address or phone number');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      const response = await fetch('http://localhost:8081/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: forgotTarget.trim() })
      });
      const data = await response.json();
      setForgotLoading(false);
      if (response.ok && data.success) {
        setForgotStep(2);
      } else {
        setForgotError(data.message || 'Failed to send OTP code.');
      }
    } catch (err) {
      setForgotLoading(false);
      setForgotError('Backend server offline.');
    }
  };

  // Live Backend HTTP Call: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!forgotOtp || forgotOtp.length !== 6) {
      setForgotError('Please enter the 6-digit OTP code');
      return;
    }
    if (!forgotNewPw || forgotNewPw.length < 8) {
      setForgotError('New password must be at least 8 characters long');
      return;
    }
    if (forgotNewPw !== forgotConfirm) {
      setForgotError('Passwords do not match');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      const response = await fetch('http://localhost:8081/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: forgotTarget.trim(),
          otpCode: forgotOtp,
          newPassword: forgotNewPw
        })
      });
      const data = await response.json();
      setForgotLoading(false);
      if (response.ok && data.success) {
        setForgotDone(true);
      } else {
        setForgotError(data.message || 'Failed to reset password.');
      }
    } catch (err) {
      setForgotLoading(false);
      setForgotError('Backend server offline.');
    }
  };

  const resetForgotModal = () => {
    setForgotOpen(false);
    setForgotStep(1);
    setForgotTarget('');
    setForgotOtp('');
    setForgotNewPw('');
    setForgotConfirm('');
    setForgotDone(false);
    setForgotError('');
  };

  return (
    <div className="min-h-screen bg-hero-gradient flex flex-col">
      <TricolorBar />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Branding */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="flex flex-col items-center mb-5">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl mb-2">
            <AshokaEmblem size={44} />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            Info<span className="text-gov-saffron">Seva</span>
          </h1>
          <p className="text-white/70 text-xs mt-0.5 font-medium">Sustainable AI-Based RTI Search & Public Information Portal</p>
        </motion.div>

        {/* Login Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <TricolorBar />

          <div className="p-7">
            <div className="text-center mb-5">
              <h2 className="text-xl font-bold text-gray-900">Welcome Back</h2>
              <p className="text-gray-500 text-xs mt-1">Sign in to access your InfoSeva Citizen Portal</p>
            </div>

            {/* Global Error Banner */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-3 mb-4">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5 text-red-500" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              {/* Email Input */}
              <div>
                <label htmlFor="login-email" className="text-xs font-semibold text-gray-700 mb-1 block">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); setFieldErrors({}); }}
                    placeholder="name@example.com"
                    className={`input-field w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border ${fieldErrors.email ? 'border-red-500 bg-red-50/20' : 'border-gray-300'}`}
                  />
                </div>
                {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="login-password" className="text-xs font-semibold text-gray-700 mb-1 block">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="login-password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onKeyDown={handleKeyDown}
                    onChange={e => { setPassword(e.target.value); setError(''); setFieldErrors({}); }}
                    placeholder="••••••••"
                    className={`input-field w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border ${fieldErrors.password ? 'border-red-500 bg-red-50/20' : 'border-gray-300'}`}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {capsLock && (
                  <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1 mt-1">
                    <AlertTriangle size={12} /> Caps Lock is ON
                  </p>
                )}
                {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-4 h-4 rounded border-gray-300 accent-gov-blue" />
                  <span className="text-xs text-gray-600">Remember Me</span>
                </label>
                <button type="button" onClick={() => setForgotOpen(true)} className="text-xs text-gov-blue font-semibold hover:underline">
                  Forgot Password?
                </button>
              </div>

              {/* Sign In Button */}
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-60">
                {loading ? <><Loader size={16} className="animate-spin" /> Authenticating...</> : <>Sign In <ArrowRight size={16} /></>}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Real Google Identity Services (GIS) Sign-In */}
              <div className="w-full flex justify-center google-btn-wrapper my-1">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outline"
                  shape="rectangular"
                  size="large"
                  width="100%"
                  text="continue_with"
                  logo_alignment="left"
                />
              </div>

              {/* Create Account Link */}
              <Link to="/register" className="block w-full text-center py-2.5 border-2 border-gov-blue text-gov-blue rounded-xl text-sm font-semibold hover:bg-gov-blue/5 transition-colors">
                Create New Account
              </Link>

              {/* Developer Testing Collapsible Panel (Commented out for now - uncomment when needed) */}
              {/* {SHOW_TEST_LOGIN && (
                <div className="mt-4 border border-amber-200 bg-amber-50/70 rounded-xl overflow-hidden">
                  <button type="button" onClick={() => setDevOpen(!devOpen)} className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-amber-800 hover:bg-amber-100/50">
                    <span className="flex items-center gap-1.5"><Sparkles size={13} className="text-amber-600" /> Developer Testing (Auto Fill)</span>
                    <ChevronDown size={14} className={`transition-transform ${devOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {devOpen && (
                    <div className="px-4 pb-3 pt-1 border-t border-amber-200/60 space-y-1.5">
                      <p className="text-[11px] text-amber-700">Click a test user below to auto-fill credentials:</p>
                      {testUsers.map(u => (
                        <div key={u.email} onClick={() => { setEmail(u.email); setPassword(u.password || 'Password@123'); setError(''); setFieldErrors({}); }}
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-amber-200 hover:border-amber-400 cursor-pointer text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center font-bold text-amber-800 text-xs overflow-hidden flex-shrink-0">
                              {u.profilePhotoUrl ? (
                                <img src={u.profilePhotoUrl} alt={u.name || 'User'} className="w-full h-full object-cover" />
                              ) : (
                                (u.name || u.label || 'U')[0]
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-gray-900 truncate">{u.name || u.label}</span>
                                <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-medium flex-shrink-0">{u.label}</span>
                              </div>
                              <p className="text-[10px] text-gray-500 truncate">{u.email}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded flex-shrink-0 ml-2">Fill</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )} */}
            </form>
          </div>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {forgotOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Reset Password</h3>
              <p className="text-xs text-gray-500 mb-4">Verify your account contact details to recover your password</p>

              {forgotError && <p className="text-xs text-red-500 bg-red-50 p-2.5 rounded-lg border border-red-200 mb-3">{forgotError}</p>}

              {forgotDone ? (
                <div className="text-center py-4 space-y-3">
                  <CheckCircle size={40} className="text-green-500 mx-auto" />
                  <h4 className="font-bold text-gray-800 text-sm">Password Reset Successfully!</h4>
                  <p className="text-xs text-gray-500">All active sessions have been revoked for security. You can now login with your new password.</p>
                  <button type="button" onClick={resetForgotModal} className="btn-primary w-full py-2 text-xs font-semibold">Back to Login</button>
                </div>
              ) : forgotStep === 1 ? (
                <form onSubmit={handleSendForgotOtp} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Email or Phone Number</label>
                    <input type="text" value={forgotTarget} onChange={e => setForgotTarget(e.target.value)} placeholder="user@example.com or 9876543210" className="input-field w-full text-sm py-2 px-3 border border-gray-300 rounded-xl" />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={resetForgotModal} className="px-4 py-2 text-xs text-gray-600 hover:underline">Cancel</button>
                    <button type="submit" disabled={forgotLoading} className="btn-primary px-5 py-2 text-xs font-semibold flex items-center gap-1.5">
                      {forgotLoading ? <Loader size={14} className="animate-spin" /> : 'Send OTP Code'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">6-Digit OTP Code</label>
                    <input type="text" maxLength={6} value={forgotOtp} onChange={e => setForgotOtp(e.target.value.replace(/\D/g, ''))} placeholder="123456" className="input-field w-full text-sm py-2 px-3 tracking-widest text-center border border-gray-300 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">New Password</label>
                    <input type="password" value={forgotNewPw} onChange={e => setForgotNewPw(e.target.value)} placeholder="Min 8 characters" className="input-field w-full text-sm py-2 px-3 border border-gray-300 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Confirm New Password</label>
                    <input type="password" value={forgotConfirm} onChange={e => setForgotConfirm(e.target.value)} placeholder="Re-enter password" className="input-field w-full text-sm py-2 px-3 border border-gray-300 rounded-xl" />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setForgotStep(1)} className="px-4 py-2 text-xs text-gray-600 hover:underline">Back</button>
                    <button type="submit" disabled={forgotLoading} className="btn-primary px-5 py-2 text-xs font-semibold flex items-center gap-1.5">
                      {forgotLoading ? <Loader size={14} className="animate-spin" /> : 'Reset Password'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
