// src/components/layout/DashboardShell.jsx
// Reusable shell: navy sidebar + top accent bar + content area.
// Use this to wrap DataManagerDashboard, AdminDashboard, etc.
import React from 'react';
import { colors } from '../../styles/theme';

export default function DashboardShell({ portalName, portalSubtitle, navItems, activePath, onNavigate, statusBadge, children }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`w-64 ${colors.sidebarBg} flex flex-col`}>
        <div className="h-1 w-full flex">
          <div className="flex-1 bg-orange-400" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-green-400" />
        </div>
        <div className="px-5 py-5">
          <h1 className="text-white font-bold text-lg leading-tight">{portalName}</h1>
          <p className="text-slate-400 text-xs">{portalSubtitle}</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = activePath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 bg-gray-50 flex flex-col">
        <header className="flex items-center justify-between px-8 py-4 border-b border-gray-100 bg-white">
          <div>{/* breadcrumb slot handled by page itself if needed */}</div>
          {statusBadge}
        </header>
        <main className="flex-1 px-8 py-6">{children}</main>
      </div>
    </div>
  );
}