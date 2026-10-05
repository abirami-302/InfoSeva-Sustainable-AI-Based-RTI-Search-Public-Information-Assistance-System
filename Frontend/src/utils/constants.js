// src/utils/constants.js
export const ROLES = {
  CITIZEN: 'citizen',
  DATA_MANAGER: 'datamanager',
  ADMIN: 'admin',
};

export const REDIRECT_BY_ROLE = {
  [ROLES.CITIZEN]: '/user',
  [ROLES.DATA_MANAGER]: '/datamanager',
  [ROLES.ADMIN]: '/admin/dashboard',
};

export const PROFESSIONS = [
  'Student',
  'Farmer',
  'Salaried Employee',
  'Self-Employed / Business',
  'Government Employee',
  'Homemaker',
  'Unemployed',
  'Retired',
  'Other',
];

export const PAGE_SIZE_DEFAULT = 6;

// Common search suggestions keyed by prefix, used across every search bar
export const SEARCH_SUGGESTIONS = {
  ration: ['Ration Card', 'Ration Card Tamil Nadu', 'Ration Card Apply', 'Ration Card Status'],
  income: ['Income Certificate', 'Income Certificate Apply', 'Income Certificate Status', 'Income Tax Return Filing'],
  caste: ['Caste Certificate', 'Caste Certificate Apply', 'Caste Certificate Verification'],
  passport: ['Passport Renewal', 'Passport Application', 'Passport Seva Kendra Appointment', 'Passport Status Tracking'],
  aadhaar: ['Aadhaar Update', 'Aadhaar Card Download', 'Aadhaar Enrollment Centre', 'Aadhaar Linking Status'],
  pan: ['PAN Card Apply', 'PAN Card Correction', 'PAN Aadhaar Linking', 'PAN Card Status'],
  voter: ['Voter ID Correction', 'Voter ID Apply', 'Voter List Search', 'Voter ID Download'],
  pm: ['PM Kisan Samman Nidhi', 'PM Awas Yojana', 'PM Mudra Yojana', 'PM Ujjwala Yojana'],
  birth: ['Birth Certificate', 'Birth Certificate Apply', 'Birth Certificate Correction'],
  scholarship: ['National Scholarship Portal', 'Scholarship Eligibility', 'Scholarship Status'],
};
