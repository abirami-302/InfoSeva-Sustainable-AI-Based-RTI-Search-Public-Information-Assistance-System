// src/styles/auth.styles.js
// Shared class-string tokens for Login / Register pages.
// Import these instead of retyping the same Tailwind strings on every field.

export const authCard = 'bg-white rounded-2xl shadow-lg border border-gray-100 p-8';
export const authInput =
  'input-field w-full pl-11'; // pairs with a left-positioned lucide icon
export const authLabel = 'block text-sm font-semibold text-gray-700 mb-2';
export const authError = 'text-xs text-red-500 mt-1.5';
export const authDivider = 'flex items-center gap-3 my-6 text-xs text-gray-400';
export const authLinkPrimary = 'text-gov-blue font-semibold hover:underline';
export const authStepDotActive = 'w-8 h-2 rounded-full bg-gov-blue transition-all';
export const authStepDotInactive = 'w-2 h-2 rounded-full bg-gray-200 transition-all';
