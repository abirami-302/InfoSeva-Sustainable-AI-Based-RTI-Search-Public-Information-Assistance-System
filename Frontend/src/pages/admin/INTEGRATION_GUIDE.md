# InfoSeva Admin Portal — Integration Guide

## Files delivered
- `UserManagement.jsx` — full CRUD (add/edit/remove/status toggle/export CSV/search/filter)
- `DataManagerManagement.jsx` — manager directory (add/edit/remove/change password) + upload analytics section
- `SystemMonitoring.jsx` — live service health, uptime, latency, incident log (auto-refreshes every 30s)
- `ActivityLogs.jsx` — filterable/searchable log stream with export
- `Settings.jsx` — fully functional general/security/data settings with working toggles and save
- `AdminProfile.jsx` — full admin profile with personal info, admin details, preferences, change password, sign out

Each is a **default export** — drop them into your pages folder (e.g. `src/pages/admin/`).

## 1. Routes (App.jsx / your router config)
Replace/add these under your admin route tree:

```jsx
import AdminDashboard from './pages/admin/AdminDashboard'; // already exists
import AdminAnalytics from './pages/admin/Analytics';       // already exists
import UserManagement from './pages/admin/UserManagement';
import DataManagerManagement from './pages/admin/DataManagerManagement';
import SystemMonitoring from './pages/admin/SystemMonitoring';
import ActivityLogs from './pages/admin/ActivityLogs';
import Settings from './pages/admin/Settings';
import AdminProfile from './pages/admin/AdminProfile';

<Route path="/admin" element={<AdminLayout />}>
  <Route index element={<AdminDashboard />} />
  <Route path="dashboard" element={<AdminDashboard />} />
  <Route path="users" element={<UserManagement />} />
  <Route path="data-managers" element={<DataManagerManagement />} />
  <Route path="analytics" element={<AdminAnalytics />} />
  <Route path="monitoring" element={<SystemMonitoring />} />
  <Route path="logs" element={<ActivityLogs />} />
  <Route path="settings" element={<Settings />} />
  <Route path="profile" element={<AdminProfile />} />
</Route>
```

## 2. Sidebar (matches your Image 2 nav)
```jsx
const navItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'User Management', path: '/admin/users', icon: Users },
  { label: 'Data Managers', path: '/admin/data-managers', icon: UserCog },
  { label: 'Platform Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'System Monitoring', path: '/admin/monitoring', icon: Server },
  { label: 'Activity Logs', path: '/admin/logs', icon: ScrollText },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
  { label: 'Profile', path: '/admin/profile', icon: UserCircle },
];
```
Removed from the old sidebar per your final list: Departments, Documents, RTI Repository, Govt. Schemes.

## 3. Dependencies assumed (already used elsewhere in your codebase)
- `../../components/common` exports `PageHeader`
- `../../components/common/ChangePasswordSection` — same component `UserProfile.jsx` already uses
- `../../context/AuthContext` — `useAuth()` returning `{ user, logout }`
- Tailwind utility classes already defined in your project: `.card`, `.btn-primary`, `.btn-secondary`, `.input-field`, `.badge`, and color tokens `gov-blue`, `gov-blue-50`, `gov-saffron`
- `framer-motion`, `lucide-react`, `react-router-dom` — already in use

## 4. What's real vs. what's demo data
All pages ship with realistic seed data (arrays at the top of each file) so they render fully populated out of the box. Every button — add, edit, remove, status toggle, password change, export, save — updates real local React state and is fully clickable. To connect to your backend, replace the seed arrays and the local `set...` calls with your API calls (e.g. inside `saveUser`, `removeUser`, `handleSave`, etc.) — the UI/UX and validation logic stay the same.

## 5. Notes on specific pages
- **Export CSV** buttons generate a real downloadable `.csv` via `Blob` — no backend needed to test.
- **System Monitoring** is a new page (distinct from Activity Logs) showing simulated live health metrics that refresh automatically every 30 seconds, plus a manual refresh button.
- **Data Manager Management** section 2 shows per-manager uploaded docs/records/APIs with proportional bar visualization, plus platform-wide totals.
- **Admin Profile** mirrors your citizen `UserProfile.jsx` fields (name, email, phone, city, state, language) and adds admin-specific fields (employee ID, department, designation, access level) as requested.
