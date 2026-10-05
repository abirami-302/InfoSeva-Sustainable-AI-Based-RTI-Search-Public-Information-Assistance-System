import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, UserCog, BarChart3, Server, ScrollText,
  Settings as SettingsIcon, UserCircle, ShieldCheck, AlertTriangle, LogOut, ChevronDown, User, Menu, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAdmin } from '../../context/AdminContext';
import TricolorBackdrop from '../common/TricolorBackdrop';

const navItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'User Management', path: '/admin/users', icon: Users },
  { label: 'Data Managers', path: '/admin/data-managers', icon: UserCog },
  { label: 'Platform Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Activity Logs', path: '/admin/logs', icon: ScrollText },
  { label: 'Profile', path: '/admin/profile', icon: UserCircle },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { platformName, maintenanceConfig } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropOpen, setUserDropOpen] = useState(false);

  const maintenanceScheduled = maintenanceConfig?.enabled && !maintenanceConfig?.isEmergency;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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

      {/* Fixed Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-gov-blue-dark text-white z-40 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={22} className="text-gov-saffron" />
            <div>
              <h1 className="font-bold text-lg leading-none font-display">{platformName}</h1>
              <p className="text-[11px] text-white/50 mt-1">Admin Portal</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-white/60 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="h-1 flex flex-shrink-0">
          <div className="flex-1 bg-gov-saffron" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-green-600" />
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-wider text-white/40 px-3 pt-3 pb-2 font-semibold">Administration</p>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5">
            <div className="w-8 h-8 rounded-full bg-gov-saffron flex items-center justify-center text-xs font-bold flex-shrink-0">
              {(user?.name || 'A')[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate">{user?.name || 'Admin User'}</p>
              <p className="text-[11px] text-white/50 truncate">{user?.email || 'admin@infoseva.gov.in'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-white/60 hover:text-red-400 transition-colors"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="relative z-10 flex-1 md:ml-64 flex flex-col min-h-screen min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden text-gray-500 hover:text-gray-700"
              >
                <Menu size={20} />
              </button>
              <div className="text-sm text-gray-400 hidden md:block">
                <span className="text-gov-blue font-semibold">System Administration</span>
                <span className="mx-2">·</span>
                <span>{platformName} Platform</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* User Dropdown with Sign Out */}
              <div className="relative">
                <button
                  onClick={() => setUserDropOpen(!userDropOpen)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gov-blue transition-colors"
                >
                  <div className="w-8 h-8 bg-gov-blue rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                    {user?.photo ? (
                      <img src={user.photo} alt={user?.name || 'Admin'} className="w-full h-full object-cover" />
                    ) : (
                      (user?.name || 'A')[0]
                    )}
                  </div>
                  <span className="hidden md:block">{user?.name?.split(' ')[0] || 'Admin'}</span>
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
                        className="absolute right-0 top-11 bg-white rounded-xl shadow-xl border border-gray-100 p-2 w-48 z-50"
                      >
                        <NavLink
                          to="/admin/profile"
                          onClick={() => setUserDropOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gov-blue-50 hover:text-gov-blue"
                        >
                          <User size={14} /> Admin Profile
                        </NavLink>
                        <NavLink
                          to="/admin/settings"
                          onClick={() => setUserDropOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gov-blue-50 hover:text-gov-blue"
                        >
                          <SettingsIcon size={14} /> Platform Settings
                        </NavLink>
                        <hr className="my-1 border-gray-100" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 w-full text-left font-medium"
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

        {/* Main Content Area */}
        <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
          {/* Maintenance scheduled banner */}
          {maintenanceScheduled && (
            <div className="bg-yellow-500 text-yellow-900 text-xs font-semibold px-6 py-2 mb-4 rounded-xl flex items-center gap-2">
              <AlertTriangle size={13} />
              Maintenance scheduled: {maintenanceConfig.startDate} {maintenanceConfig.startTime} – {maintenanceConfig.endDate} {maintenanceConfig.endTime}
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}