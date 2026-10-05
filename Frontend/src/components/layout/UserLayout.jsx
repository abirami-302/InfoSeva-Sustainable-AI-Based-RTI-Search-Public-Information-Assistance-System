import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Search, MessageSquare, FileText, BookOpen,
  Scan, Building2, Bookmark, User, LogOut, Bell, Menu, X, ChevronDown, Sparkles,
  Wrench, RefreshCw, Phone, Mail, Clock,
} from 'lucide-react';
import { AshokaEmblem, TricolorBar } from '../common';
import TricolorBackdrop from '../common/TricolorBackdrop';
import { useAuth } from '../../context/AuthContext';
import { useAdmin } from '../../context/AdminContext';
import { getNotifications, markAsRead, markAllAsRead } from '../../api/notificationsApi';

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/user' },
  { icon: Search, label: 'Search Information', path: '/user/search' },
  { icon: Building2, label: 'Government Services', path: '/user/government-services' },
  { icon: MessageSquare, label: 'RTI Retrieval', path: '/user/rti' },
  { icon: FileText, label: 'Generate RTI Draft', path: '/user/rti-draft' },
  { icon: BookOpen, label: 'Government Schemes', path: '/user/schemes' },
  { icon: Scan, label: 'Document Summarizer', path: '/user/docs' },
  { icon: Bookmark, label: 'Saved Items', path: '/user/saved' },
  { icon: User, label: 'Profile', path: '/user/profile' },
];

// ─── Full-screen Maintenance Page ────────────────────────────────────────────
// Replaces the entire application for affected users.
// Administrators are never shown this page (checked in UserLayout before render).
function MaintenancePage({ config, platformName, onRefresh }) {
  const [secondsLeft, setSecondsLeft] = React.useState(60);

  // Auto-refresh countdown
  React.useEffect(() => {
    const tick = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { onRefresh(); return 60; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [onRefresh]);

  const formatSchedule = () => {
    if (config.isEmergency) return 'Immediate — no scheduled end time';
    if (config.startDate && config.endDate) {
      return `${config.startDate} ${config.startTime || ''} → ${config.endDate} ${config.endTime || ''}`;
    }
    return 'Duration not specified';
  };

  return (
    <div className="min-h-screen bg-gov-blue-dark flex flex-col">
      {/* Tricolor top bar */}
      <div className="h-1.5 flex flex-shrink-0">
        <div className="flex-1 bg-gov-saffron" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-green-600" />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg text-center"
        >
          {/* Logo area */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 bg-gov-saffron rounded-2xl flex items-center justify-center">
              <Wrench size={28} className="text-white" />
            </div>
            <div className="text-left">
              <p className="font-display font-bold text-white text-2xl leading-none">{platformName}</p>
              <p className="text-white/50 text-sm mt-1">Government Information Portal</p>
            </div>
          </div>

          {/* Main card */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 text-left space-y-6">
            {/* Title */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-gov-saffron/20 border border-gov-saffron/30 text-gov-saffron text-xs font-bold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wide">
                <span className="w-2 h-2 bg-gov-saffron rounded-full animate-pulse" />
                {config.reason || 'Scheduled Maintenance'}
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Platform Under Maintenance</h1>
              <p className="text-white/70 text-sm leading-relaxed">
                {config.message || 'The platform is currently undergoing scheduled maintenance. We will be back shortly.'}
              </p>
            </div>

            {/* Schedule info */}
            <div className="bg-white/5 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock size={15} className="text-white/70" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-0.5">Maintenance Window</p>
                  <p className="text-sm text-white font-medium">{formatSchedule()}</p>
                </div>
              </div>
            </div>

            {/* Contact support */}
            <div className="border-t border-white/10 pt-4 space-y-2">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wide">Need urgent assistance?</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="mailto:support@infoseva.gov.in"
                  className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors">
                  <Mail size={14} className="text-gov-saffron" /> support@infoseva.gov.in
                </a>
                <a href="tel:1800-11-4567"
                  className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors">
                  <Phone size={14} className="text-gov-saffron" /> 1800-11-4567
                </a>
              </div>
            </div>

            {/* Auto-refresh */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <p className="text-xs text-white/40">
                Auto-checking in <span className="text-white/70 font-semibold">{secondsLeft}s</span>
              </p>
              <button
                onClick={onRefresh}
                className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors"
              >
                <RefreshCw size={13} /> Check Now
              </button>
            </div>
          </div>

          <p className="text-white/30 text-xs mt-6">
            {platformName} — Government of India · Ministry of Electronics & Information Technology
          </p>
        </motion.div>
      </div>

      {/* Tricolor bottom bar */}
      <div className="h-1.5 flex flex-shrink-0">
        <div className="flex-1 bg-gov-saffron" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-green-600" />
      </div>
    </div>
  );
}

function UserLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropOpen, setUserDropOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const notifRef = useRef(null);
  const userDropRef = useRef(null);

  const unreadCount = Array.isArray(notifications) ? notifications.filter((n) => n.unread).length : 0;

  useEffect(() => {
    let cancelled = false;
    setNotifLoading(true);
    const fetchNotifs = () => {
      getNotifications()
        .then((data) => {
          if (!cancelled) setNotifications(Array.isArray(data) ? data : []);
        })
        .catch(() => {
          if (!cancelled) setNotifications([]);
        })
        .finally(() => {
          if (!cancelled) setNotifLoading(false);
        });
    };

    fetchNotifs();

    // Poll every 6 seconds so incoming notifications show on the bell immediately without page reload
    const interval = setInterval(fetchNotifs, 6000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (userDropRef.current && !userDropRef.current.contains(e.target)) {
        setUserDropOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotifClick = async (n) => {
    setNotifOpen(false);
    if (n.unread) {
      const updated = await markAsRead(n.id);
      setNotifications(updated);
    }
    if (n.route) navigate(n.route);
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    const updated = await markAllAsRead();
    setNotifications(updated);
  };

  const handleLogout = () => { logout(); navigate('/'); };

  // ── Maintenance Mode gate ─────────────────────────────────────────────────
  const { maintenanceConfig, platformName } = useAdmin();

  // Admins always bypass maintenance mode.
  // All other roles check if they are in affectedRoles.
  const userRole = user?.role || 'guest';
  const isAdmin  = userRole === 'admin';
  const isAffected =
    !isAdmin &&
    maintenanceConfig?.enabled &&
    (maintenanceConfig.affectedRoles || []).some(
      r => r.toLowerCase() === userRole.toLowerCase() || r.toLowerCase() === 'citizen' || r.toLowerCase() === 'guest'
    );

  if (isAffected) {
    return (
      <MaintenancePage
        config={maintenanceConfig}
        platformName={platformName}
        onRefresh={() => window.location.reload()}
      />
    );
  }
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="relative flex min-h-screen bg-gray-50">
      <TricolorBackdrop />
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 shadow-sm z-40 flex flex-col transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <AshokaEmblem size={36} />
            <div>
              <div className="font-display font-bold text-gov-blue text-base leading-tight">InfoSeva</div>
              <div className="text-xs text-gray-400 leading-tight">Public Info System</div>
            </div>
          </div>
        </div>
        <TricolorBar />

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2 mt-2">Main Menu</p>
          {NAV.map(item => (
            <NavLink key={item.path} to={item.path} end={item.path === '/user'}
              className={({ isActive }) => `sidebar-item mb-0.5 ${isActive ? 'active' : ''}`}>
              <item.icon size={17} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gov-blue-50">
            <div className="w-8 h-8 bg-gov-blue rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
              {user?.photo ? (
                <img src={user.photo} alt={user?.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                user?.name?.[0] || 'U'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-gray-800 truncate">{user?.name}</div>
              <div className="text-xs text-gray-400 truncate">{user?.state}</div>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="relative z-10 flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top Nav */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-nav">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-gray-500">
                <Menu size={20} />
              </button>
              <div className="text-sm text-gray-400 hidden md:block">
                <span className="text-gov-blue font-medium">Citizen Portal</span>
                <span className="mx-2">·</span>
                <span>Government of India</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative" ref={notifRef}>
                <button onClick={() => { setNotifOpen(!notifOpen); setUserDropOpen(false); }}
                  className="relative text-gray-500 hover:text-gov-blue transition-colors">
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-gov-saffron rounded-full text-white text-xs flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="absolute right-0 top-11 bg-white rounded-xl shadow-xl border border-gray-100 p-2 w-72 z-50">
                      <p className="text-xs font-semibold text-gray-500 px-3 py-1 uppercase tracking-wider">Notifications</p>

                      {notifLoading && (
                        <p className="text-xs text-gray-400 px-3 py-3">Loading…</p>
                      )}

                      {!notifLoading && notifications.length === 0 && (
                        <p className="text-xs text-gray-400 px-3 py-3">No notifications yet.</p>
                      )}

                      {!notifLoading && notifications.map(n => (
                        <button
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-gov-blue-50 cursor-pointer text-left"
                        >
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.unread ? 'bg-gov-saffron' : 'bg-gray-200'}`} />
                          <div>
                            <p className={`text-sm leading-snug ${n.unread ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>{n.text}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                          </div>
                        </button>
                      ))}

                      <button
                        onClick={handleMarkAllRead}
                        disabled={unreadCount === 0}
                        className="w-full text-center text-xs text-gov-blue font-medium py-2 hover:underline disabled:text-gray-300 disabled:hover:no-underline"
                      >
                        Mark all as read
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="relative" ref={userDropRef}>
                <button onClick={() => setUserDropOpen(!userDropOpen)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gov-blue transition-colors">
                  <div className="w-8 h-8 bg-gov-blue rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                    {user?.photo ? (
                      <img src={user.photo} alt={user?.name || 'User'} className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.[0] || 'U'
                    )}
                  </div>
                  <span className="hidden md:block">{user?.name?.split(' ')[0]}</span>
                  <ChevronDown size={14} />
                </button>
                <AnimatePresence>
                  {userDropOpen && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="absolute right-0 top-11 bg-white rounded-xl shadow-xl border border-gray-100 p-2 w-44 z-50">
                      <NavLink to="/user/profile" onClick={() => setUserDropOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gov-blue-50 hover:text-gov-blue">
                        <User size={14} /> Profile
                      </NavLink>
                      <NavLink to="/user/saved" onClick={() => setUserDropOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gov-blue-50 hover:text-gov-blue">
                        <Bookmark size={14} /> Saved Items
                      </NavLink>
                      <hr className="my-1 border-gray-100" />
                      <button onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 w-full">
                        <LogOut size={14} /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>

      {/* Sevak AI Floating Button */}
      <SevakAI />
    </div>
  );
}

function SevakAI() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/user/assistant') return null;

  return (
    <div className="fixed bottom-20 right-4 md:bottom-8 md:right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="fixed inset-0 -z-10" onClick={() => setOpen(false)} />
      )}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, scale: 0.85, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-64">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gov-blue rounded-full flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Sevak AI</p>
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" /> Online
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              Ask me anything about government schemes, RTI, documents or services.
            </p>
            <button onClick={() => { navigate('/user/assistant'); setOpen(false); }}
              className="btn-primary w-full py-2 text-sm flex items-center justify-center gap-2">
              <Sparkles size={14} /> Start Chatting
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="w-14 h-14 bg-gov-blue rounded-full shadow-2xl flex flex-col items-center justify-center text-white relative"
        aria-label="Open Sevak AI Assistant"
      >
        <Sparkles size={20} />
        <span className="text-[9px] font-bold mt-0.5">SEVAK</span>
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
      </motion.button>
    </div>
  );
}

export default UserLayout;