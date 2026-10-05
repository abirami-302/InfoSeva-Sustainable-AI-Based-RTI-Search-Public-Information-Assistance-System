// src/api/client.js
// Central place all network calls flow through.
// TODAY: simulates network latency and returns dummy data.
// WHEN BACKEND IS READY: replace the body of `request()` with a real axios
// call using API_BASE_URL — no page component needs to change, since every
// api/*.js file only calls `request()`, never fetch/axios directly.

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const SIMULATED_LATENCY_MS = 500;

/**
 * Simulates an API call. Swap this implementation for a real axios call
 * once Spring Boot backend is live:
 *
 *   import axios from 'axios';
 *   export async function request({ resolveWith }) {
 *     const res = await axios.get(`${API_BASE_URL}/...`);
 *     return res.data;
 *   }
 */
export function request({ resolveWith, shouldFail = false, failMessage = 'Something went wrong. Please try again.' }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error(failMessage));
      } else {
        resolve(resolveWith);
      }
    }, SIMULATED_LATENCY_MS);
  });
}

// Attach Bearer JWT token from localStorage to authenticated API requests
export function getAuthHeaders() {
  const token = localStorage.getItem('infoseva_access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}
