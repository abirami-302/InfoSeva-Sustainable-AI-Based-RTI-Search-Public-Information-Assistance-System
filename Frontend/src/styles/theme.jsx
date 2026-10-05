// src/styles/theme.js
// Central theme file — import these into ANY dashboard (Admin, DataManager, etc.)
// so colors/spacing/components stay consistent across the whole app.

export const colors = {
  sidebarBg: 'bg-[#0B1739]',        // dark navy sidebar
  sidebarText: 'text-slate-300',
  sidebarActiveBg: 'bg-white/10',
  sidebarActiveText: 'text-white',
  sidebarHover: 'hover:bg-white/5',
  accentBarOrange: 'bg-orange-400',
  accentBarGreen: 'bg-green-400',

  pageBg: 'bg-gray-50',
  cardBg: 'bg-white',
  cardBorder: 'border border-gray-100',
  cardShadow: 'shadow-sm',

  textPrimary: 'text-gray-900',
  textSecondary: 'text-gray-500',
  textMuted: 'text-gray-400',
};

// Pastel icon-chip backgrounds used in stat cards (rotate through these)
export const iconChip = {
  blue:   'bg-blue-50 text-blue-600',
  green:  'bg-green-50 text-green-600',
  orange: 'bg-orange-50 text-orange-600',
  purple: 'bg-purple-50 text-purple-600',
  red:    'bg-red-50 text-red-600',
};

// Reusable Tailwind class strings
export const ui = {
  card: `${colors.cardBg} ${colors.cardBorder} ${colors.cardShadow} rounded-2xl`,
  statCard: `${colors.cardBg} ${colors.cardBorder} ${colors.cardShadow} rounded-2xl p-5 flex items-center gap-4`,
  sectionCard: `${colors.cardBg} ${colors.cardBorder} ${colors.cardShadow} rounded-2xl p-5`,
  sidebarLinkBase: `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors`,
  sidebarLinkActive: `${colors.sidebarActiveBg} ${colors.sidebarActiveText}`,
  sidebarLinkInactive: `${colors.sidebarText} ${colors.sidebarHover}`,
  primaryBtn: `bg-[#0B1739] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#111f4d] transition-colors flex items-center gap-1.5`,
  secondaryBtn: `bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5`,
  badge: `text-xs font-medium px-2 py-0.5 rounded-full`,
};

export const badgeColor = {
  High: 'bg-green-50 text-green-600',
  Medium: 'bg-yellow-50 text-yellow-600',
  Low: 'bg-red-50 text-red-600',
  Active: 'bg-green-50 text-green-600',
  'Not Connected': 'bg-gray-100 text-gray-500',
  Degraded: 'bg-red-50 text-red-600',
};

// Chart color palette (matches the navy/orange/green scheme)
export const chartColors = {
  primaryLine: '#0B1739',
  secondaryLine: '#F97316', // orange
  bar: '#0B1739',
  donut: ['#0B1739', '#3B82F6', '#F97316', '#22C55E'],
};