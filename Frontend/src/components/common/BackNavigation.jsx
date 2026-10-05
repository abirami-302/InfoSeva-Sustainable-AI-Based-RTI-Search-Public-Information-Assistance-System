import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';

/**
 * Reusable InfoSeva Dual Navigation:
 * - Option 1: Normal Back (navigate(-1))
 * - Option 2: Back to Dashboard (direct dashboard route)
 */
export default function BackNavigation({
  backLabel = 'Back',
  dashboardLabel = 'Back to Dashboard',
  dashboardPath,
  onBack,
  onDashboard,
  className = '',
}) {
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-detect destination dashboard if not explicitly passed
  const resolvedDashboardPath = dashboardPath || (() => {
    const path = (location.pathname || '').toLowerCase();
    if (path.startsWith('/admin')) return '/admin/dashboard';
    if (path.startsWith('/datamanager')) return '/datamanager';
    return '/user';
  })();

  const handleBack = () => {
    if (typeof onBack === 'function') {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleDashboard = () => {
    if (typeof onDashboard === 'function') {
      onDashboard();
    } else {
      navigate(resolvedDashboardPath);
    }
  };

  return (
    <div className={`flex items-center gap-1.5 text-sm font-medium ${className}`}>
      {/* 1. Normal Back */}
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-gray-500 hover:text-gov-blue hover:bg-gov-blue/5 transition-colors group cursor-pointer"
        title="Go back to previous page"
      >
        <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
        <span>{backLabel}</span>
      </button>

      {/* Visual Separator */}
      <span className="text-gray-300 select-none">|</span>

      {/* 2. Back to Dashboard */}
      <button
        type="button"
        onClick={handleDashboard}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-gray-500 hover:text-gov-blue hover:bg-gov-blue/5 transition-colors group cursor-pointer"
        title="Go directly to Dashboard"
      >
        <LayoutDashboard size={14} className="text-gray-400 group-hover:text-gov-blue transition-colors" />
        <span>{dashboardLabel}</span>
      </button>
    </div>
  );
}
