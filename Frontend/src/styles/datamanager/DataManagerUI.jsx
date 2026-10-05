// src/styles/DataManagerUI.jsx

export const card = 'card';
export const cardPad = 'card p-5';
export const cardPad4 = 'card p-4';
export const cardPad6 = 'card p-6';
export const cardOverflow = 'card overflow-hidden';

export const input = 'input-field text-sm';
export const textarea = 'input-field text-sm w-full font-sans resize-y';

export const btn = {
  primary: 'btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed',
  primarySmall: 'bg-gov-blue text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-gov-blue-dark transition-colors disabled:opacity-50',
  primaryTiny: 'text-xs font-medium text-white bg-gov-blue px-3 py-1.5 rounded-lg hover:bg-gov-blue-dark',
  secondary: 'text-xs font-medium text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100',
  ghost: 'text-xs text-gray-400 hover:text-red-500 underline',
  approve: 'flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors',
  reject: 'flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors',
  edit: 'flex items-center gap-1 text-xs font-medium text-gov-blue border border-gov-blue/30 px-3 py-1.5 rounded-lg hover:bg-gov-blue-50 transition-colors',
  view: 'flex items-center gap-1 text-xs font-medium text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors',
  aiValidate: 'flex items-center gap-1.5 text-xs font-medium text-gov-blue bg-gov-blue-50 border border-gov-blue/20 px-3 py-1.5 rounded-lg hover:bg-gov-blue-100 transition-colors disabled:opacity-60',
  link: 'text-xs font-medium text-gov-blue border border-gov-blue/30 px-3 py-1.5 rounded-lg hover:bg-gov-blue-50 transition-colors flex-shrink-0',
  editProfile: (active) => `flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg border transition-colors ${active ? 'bg-gov-blue text-white border-gov-blue' : 'border-gray-200 text-gray-600 hover:border-gov-blue hover:text-gov-blue'}`,
  saveProfile: 'btn-primary flex items-center gap-2 text-sm',
  logout: 'w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-200 transition-all text-sm font-medium text-red-600 flex items-center gap-2',
  accountRow: 'w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all text-sm font-medium text-gray-700',
};

const badgeMap = {
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-50 text-blue-700',
  navy: 'bg-gov-blue-50 text-gov-blue',
  gray: 'bg-gray-100 text-gray-500',
};
export const badge = (color, extra = '') => `badge text-xs ${badgeMap[color] || badgeMap.gray} ${extra}`;
export const confColor = (c) => c >= 80 ? badgeMap.green : c >= 55 ? badgeMap.yellow : badgeMap.red;

export const filterChip = (active) =>
  `text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${active ? 'bg-gov-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`;

const chipMap = {
  purple: 'bg-gov-blue-50 text-gov-blue',
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  red: 'bg-red-50 text-red-500',
  navy: 'bg-gov-blue-50 text-gov-blue',
};
export const iconChip = (color, sizeCls = 'w-9 h-9') => `${sizeCls} rounded-xl flex items-center justify-center flex-shrink-0 ${chipMap[color] || chipMap.navy}`;

export const rowHover = 'px-5 py-4 hover:bg-gray-50 transition-colors';
export const rowHoverFlex = 'flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors';
export const rowHoverSm = 'flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors';
export const emptyState = 'p-8 text-center text-sm text-gray-400';
export const emptyStateCard = 'card p-8 text-center text-sm text-gray-400';

export const infoBanner = 'card p-4 flex items-start gap-3 bg-gov-blue-50/50 border-gov-blue-100';
export const successBanner = 'bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2';

export const dropzone = (dragging) =>
  `card p-8 text-center border-dashed border-2 transition-colors ${dragging ? 'border-gov-blue bg-gov-blue-50' : 'border-gray-200 hover:border-gov-blue/50'}`;
export const dropzoneIconWrap = 'w-16 h-16 bg-gov-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4';

export const modalOverlay = 'fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4';
export const modalBox = 'bg-white rounded-2xl p-6 max-w-md w-full';

export const toggle = (on) => `w-11 h-6 rounded-full transition-colors relative ${on ? 'bg-gov-blue' : 'bg-gray-200'}`;
export const toggleDot = (on) => `absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`;

export const statBox = 'card p-4 text-center';
export const statBoxLeft = 'card p-4';

export const tableHeadRow = 'border-b border-gray-100 bg-gray-50';
export const tableTh = 'text-xs font-semibold text-gray-400 uppercase tracking-wide py-2.5 px-4 text-left';
export const tableTd = 'py-2.5 px-4 font-medium text-gray-800 text-xs';
export const tableTdMuted = 'py-2.5 px-4 text-gray-500 text-xs';
export const tableTdMono = 'py-2.5 px-4 text-gray-500 text-xs font-mono';

export const rangeBtn = (active) =>
  `px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${active ? 'bg-gov-blue text-white' : 'text-gray-500 hover:text-gray-800'}`;

export const chartColors = {
  primary: '#003087',
  secondary: '#FF6B00',
  tertiary: '#138808',
  quaternary: '#2563EB',
  pieColors: ['#003087', '#2563EB', '#FF6B00', '#138808', '#8B5CF6', '#6B7280'],
  confColors: ['#059669', '#D97706', '#DC2626'],
};