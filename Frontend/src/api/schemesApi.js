// src/api/schemesApi.js
import { request } from './client';
import { schemes } from '../data/dummyData';

export async function getAllSchemes() {
  return request({ resolveWith: schemes });
}

export async function getSchemeById(id, extraSchemes = []) {
  // Check uploaded/real schemes first (by dm- id or raw id or slug)
  const realScheme = extraSchemes.find(
    (s) => String(s.id) === String(id) || String(s.realId) === String(id) || `dm-${s.id}` === String(id) || s.slug === id
  );
  if (realScheme) {
    return request({ resolveWith: realScheme });
  }

  // Fallback to fetch from backend documents API
  const rawId = String(id).replace(/^dm-/, '');
  if (/^\d+$/.test(rawId)) {
    try {
      const res = await fetch(`http://localhost:8082/api/documents/${rawId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('infoseva_access_token') || sessionStorage.getItem('jwt_token') || ''}`
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const d = json.data;
          const pdfUrl = d.fileName ? `http://localhost:8082/api/documents/download/${d.fileName}` : null;
          return request({
            resolveWith: {
              id: `dm-${d.documentId}`,
              realId: d.documentId,
              name: d.title,
              category: d.category || 'Education',
              documentType: d.documentType || d.category,
              ministry: d.ministry || d.departmentName || 'Government of India',
              department: d.departmentName || 'General',
              status: 'Active',
              benefit: d.benefit || 'Refer to scheme guidelines',
              beneficiaries: d.beneficiaries || 'All India',
              educationLevel: d.educationLevel || null,
              applicationDeadline: d.applicationDeadline || null,
              launched: d.launchedYear || (d.uploadDate ? String(d.uploadDate).slice(0, 4) : '2025'),
              eligibility: d.eligibility || d.description || 'Refer to scheme guidelines',
              eligibilityQuestions: d.eligibilityQuestions,
              description: d.description || `${d.title} — official published document.`,
              documentsRequired: d.documentsRequired || ['Aadhaar Card', 'Proof of Address', 'Bank Passbook'],
              howToApply: d.howToApply || [
                'Visit the nearest Common Service Centre (CSC) or official portal.',
                'Fill out the application form and attach the required documents.',
                'Submit and note your application/reference number for tracking.'
              ],
              faqs: d.faqs || [],
              applyLink: d.applyLink || '#',
              sampleDocumentUrl: pdfUrl,
              fileName: d.fileName || null,
              sourceLabel: 'Approved Document',
              isDataManagerSourced: true,
            }
          });
        }
      }
    } catch (_) {}
  }

  // Fallback to static dummy dataset
  const dummyScheme = schemes.find((s) => String(s.id) === String(id) || s.slug === id);
  if (dummyScheme) {
    return request({ resolveWith: dummyScheme });
  }

  return request({ shouldFail: true, failMessage: 'Scheme not found' });
}



export async function getSchemesByCategory(category) {
  const filtered = category ? schemes.filter((s) => s.category === category) : schemes;
  return request({ resolveWith: filtered });
}
