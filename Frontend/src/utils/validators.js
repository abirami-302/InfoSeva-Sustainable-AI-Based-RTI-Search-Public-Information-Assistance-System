// src/utils/validators.js
// Single source of truth for all form validation across InfoSeva.
// No page should define its own regex — import from here instead.

export const NAME_REGEX = /^[A-Za-z][A-Za-z\s.'-]*$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MOBILE_REGEX = /^[6-9]\d{9}$/; // Indian mobile: 10 digits, starts 6-9
export const PINCODE_REGEX = /^\d{6}$/;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

export const MIN_AGE = 18;

export function trimAndCollapseSpaces(value = '') {
  return value.trim().replace(/\s+/g, ' ');
}

export function validateName(value) {
  const trimmed = trimAndCollapseSpaces(value);
  if (!trimmed) return 'Name is required';
  if (/\d/.test(trimmed)) return 'Name cannot contain numbers';
  if (!NAME_REGEX.test(trimmed)) return 'Name contains invalid characters';
  if (trimmed.length < 2) return 'Name is too short';
  return '';
}

export function validateEmail(value) {
  const trimmed = trimAndCollapseSpaces(value);
  if (!trimmed) return 'Email is required';
  if (/\s/.test(value)) return 'Email cannot contain spaces';
  if (!EMAIL_REGEX.test(trimmed)) return 'Enter a valid email address';
  return '';
}

export function validateMobile(value) {
  const digits = (value || '').replace(/\D/g, '');
  if (!digits) return 'Mobile number is required';
  if (digits.length !== 10) return 'Mobile number must be exactly 10 digits';
  if (!MOBILE_REGEX.test(digits)) return 'Enter a valid Indian mobile number (starts with 6-9)';
  return '';
}

export function validatePincode(value) {
  const digits = (value || '').replace(/\D/g, '');
  if (!digits) return 'PIN Code is required';
  if (digits.length !== 6) return 'PIN Code must be exactly 6 digits';
  return '';
}

export function validateDateOfBirth(value) {
  if (!value) return 'Date of birth is required';
  const dob = new Date(value);
  const today = new Date();
  if (Number.isNaN(dob.getTime())) return 'Enter a valid date';
  if (dob > today) return 'Date of birth cannot be in the future';

  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;

  if (age < MIN_AGE) return `You must be at least ${MIN_AGE} years old to register`;
  if (age > 120) return 'Enter a valid date of birth';
  return '';
}

export function validatePassword(value) {
  if (!value) return 'Password is required';
  if (value.length < 8) return 'Password must be at least 8 characters';
  if (!/[a-z]/.test(value)) return 'Password must include a lowercase letter';
  if (!/[A-Z]/.test(value)) return 'Password must include an uppercase letter';
  if (!/\d/.test(value)) return 'Password must include a number';
  if (!/[!@#$%^&*]/.test(value)) return 'Password must include a special character (!@#$%^&*)';
  return '';
}

export function validateRequired(value, fieldLabel = 'This field') {
  const trimmed = trimAndCollapseSpaces(value);
  if (!trimmed) return `${fieldLabel} is required`;
  return '';
}

export function validateProfessionOther(profession, otherValue) {
  if (profession !== 'Other') return '';
  const trimmed = trimAndCollapseSpaces(otherValue);
  if (!trimmed) return 'Please specify your profession';
  if (/\d/.test(trimmed)) return 'Profession cannot contain numbers';
  return '';
}
