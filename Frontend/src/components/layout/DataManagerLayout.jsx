import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ClipboardCheck, SearchX, Database,
  BarChart3, User, LogOut, Menu, X, ChevronDown,
  History, FileEdit,
} from 'lucide-react';
import { AshokaEmblem, TricolorBar } from '../common';
import TricolorBackdrop from '../common/TricolorBackdrop';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from '../../pages/datamanager';

// ── Navigation groups ──────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/datamanager' },
      { icon: BarChart3,       label: 'Analytics',  path: '/datamanager/analytics' },
    ],
  },
  {
    label: 'Data Sources',
      items: [
        { icon: Database,    label: 'Data Sources',    path: '/datamanager/sources' },
        { icon: History,     label: 'Upload History',  path: '/datamanager/history' },
      ],
  },
  {
    label: 'Content Management',
    items: [
      { icon: ClipboardCheck, label: 'Review Queue', path: '/datamanager/review' },
      { icon: FileEdit,       label: 'My Drafts',    path: '/datamanager/drafts' },
      { icon: SearchX,        label: 'Content Gaps', path: '/datamanager/gaps' },
    ],
  },
  {
    label: 'Account',
    items: [
      { icon: User, label: 'Profile', path: '/datamanager/profile' },
    ],
  },
];

export default function DataManagerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropOpen, setUserDropOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="relative flex min-h-screen bg-gray-50">
      <TricolorBackdrop />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 shadow-sm z-40 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AshokaEmblem size={36} />
            <div>
              <div className="font-display font-bold text-gov-blue text-base leading-tight">InfoSeva</div>
              <div className="text-xs text-gray-400 leading-tight">Data Manager Portal</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
        <TricolorBar />

        {/* Nav groups */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-1.5">
                {group.label}
              </p>
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/datamanager'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `sidebar-item mb-0.5 ${isActive ? 'active' : ''}`
                  }
                >
                  <item.icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-purple-50">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
              {user?.photo ? (
                <img src={user.photo} alt={user?.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                user?.name?.[0] || 'U'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-gray-800 truncate">{user?.name || 'User'}</div>
              <div className="text-xs text-purple-600">
                {user?.role ? (user.role.toUpperCase().replace(/^ROLE_/, '') === 'DATA_MANAGER' || user.role.toUpperCase() === 'DATAMANAGER' ? 'Data Manager' : user.role.toUpperCase().replace(/^ROLE_/, '')) : 'Data Manager'}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="relative z-10 flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-nav">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden text-gray-500 hover:text-gray-700"
              >
                <Menu size={20} />
              </button>
              <div className="text-sm text-gray-400 hidden md:block">
                <span className="text-purple-600 font-semibold">Data Operations</span>
                <span className="mx-2">·</span>
                <span>InfoSeva Platform</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Notification bell */}
              <NotificationBell />

              {/* User dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropOpen(!userDropOpen)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gov-blue transition-colors"
                >
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                    {user?.photo ? (
                      <img src={user.photo} alt={user?.name || 'User'} className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.[0] || 'U'
                    )}
                  </div>
                  <span className="hidden md:block">{user?.name?.split(' ')[0] || 'User'}</span>
                  <ChevronDown size={14} className={`transition-transform ${userDropOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {userDropOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserDropOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute right-0 top-11 bg-white rounded-xl shadow-xl border border-gray-100 p-2 w-44 z-50"
                      >
                        <NavLink
                          to="/datamanager/profile"
                          onClick={() => setUserDropOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gov-blue-50 hover:text-gov-blue"
                        >
                          <User size={14} /> Profile
                        </NavLink>
                        <NavLink
                          to="/datamanager/analytics"
                          onClick={() => setUserDropOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gov-blue-50 hover:text-gov-blue"
                        >
                          <BarChart3 size={14} /> Analytics
                        </NavLink>
                        <hr className="my-1 border-gray-100" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 w-full"
                        >
                          <LogOut size={14} /> Sign Out
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
