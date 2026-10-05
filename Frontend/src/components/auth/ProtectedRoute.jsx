import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Helper to normalize any role representation to a standard string ('admin', 'datamanager', 'user')
export const normalizeRole = (role) => {
  if (!role) return '';
  const clean = role.toString().toUpperCase().replace(/^ROLE_/, '').trim();
  if (clean === 'ADMIN') return 'admin';
  if (clean === 'DATA_MANAGER' || clean === 'DATAMANAGER') return 'datamanager';
  if (clean === 'CITIZEN' || clean === 'USER') return 'user';
  return clean.toLowerCase();
};

// Helper to get formatted display name for roles
export const getRoleDisplayName = (role) => {
  const norm = normalizeRole(role);
  if (norm === 'admin') return 'Platform Administrator';
  if (norm === 'datamanager') return 'Data Manager';
  if (norm === 'user') return 'Citizen User';
  return role || 'User';
};

// Helper to get default dashboard for any role
export const getDashboardPathForRole = (role) => {
  const norm = normalizeRole(role);
  if (norm === 'admin') return '/admin/dashboard';
  if (norm === 'datamanager') return '/datamanager';
  return '/user';
};

// Access Denied / 403 view when role check fails
function AccessDeniedView({ userRole, userName, allowedRoles, onLogout }) {
  const navigate = useNavigate();
  const userDashboard = getDashboardPathForRole(userRole);
  const targetRoleName = allowedRoles.map(getRoleDisplayName).join(' or ');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden">
        {/* Tricolor top border */}
        <div className="h-1.5 w-full flex">
          <div className="flex-1 bg-gov-saffron" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-green-600" />
        </div>

        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100 shadow-sm">
            <ShieldAlert size={32} />
          </div>

          <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full uppercase tracking-wider mb-2">
            403 · Access Forbidden
          </span>

          <h1 className="text-xl font-bold text-gray-900 font-display">
            Restricted Portal Area
          </h1>

          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            You do not have authorization to access this module. This section is restricted exclusively to authorized <strong className="text-gray-800">{targetRoleName}</strong> personnel.
          </p>

          <div className="mt-5 p-3.5 bg-gray-50 rounded-xl border border-gray-100 text-left text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-500">Current Session:</span>
              <span className="font-semibold text-gray-800">{userName || 'Active User'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Assigned Role:</span>
              <span className="font-semibold text-purple-700">{getRoleDisplayName(userRole)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Required Role:</span>
              <span className="font-semibold text-red-600">{targetRoleName}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate(userDashboard, { replace: true })}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gov-blue text-white text-sm font-medium hover:bg-gov-blue-dark transition-all shadow-sm"
            >
              <ArrowLeft size={16} /> Return to Dashboard
            </button>
            <button
              onClick={onLogout}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { user, tokens, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Authentication Check
  if (!user || !tokens?.accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Role Authorization Check
  if (allowedRoles && allowedRoles.length > 0) {
    const userRoleNorm = normalizeRole(user.role);
    const normalizedAllowed = allowedRoles.map(r => normalizeRole(r));

    const isAuthorized = normalizedAllowed.includes(userRoleNorm);

    if (!isAuthorized) {
      const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
      };

      return (
        <AccessDeniedView
          userRole={user.role}
          userName={user.name}
          allowedRoles={allowedRoles}
          onLogout={handleLogout}
        />
      );
    }
  }

  // Authorized
  return children ? children : null;
}
