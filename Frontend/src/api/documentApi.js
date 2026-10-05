// src/api/documentApi.js
import { request, getAuthHeaders } from './client';
import { govDocuments, circularDetails } from '../data/dummyData';

export async function getAllDocuments() {
  return request({ resolveWith: govDocuments });
}

export async function getDocumentById(id) {
  try {
    const response = await fetch(`http://localhost:8082/api/documents/${id}`, {
      headers: getAuthHeaders(),
    });
    if (response.ok) {
      const result = await response.json();
      if (result.data) {
        return request({ resolveWith: result.data });
      }
    }
  } catch (err) {
    // continue to fallback
  }

  // Fallback to static dummy dataset (e.g. for pre-seeded documents like income-certificate)
  const dummyDoc = govDocuments.find((d) => String(d.id) === String(id) || d.slug === id);
  if (dummyDoc) {
    return request({ resolveWith: dummyDoc });
  }

  return request({ shouldFail: true, failMessage: 'Document not found or inaccessible.' });
}

export async function getAllCirculars() {
  return request({ resolveWith: circularDetails });
}

export async function getCircularById(id) {
  const circular = circularDetails.find((c) => String(c.id) === String(id));
  if (circular) {
    return request({ resolveWith: circular });
  }

  // Fallback to fetch from backend documents API
  try {
    const res = await getDocumentById(id);
    if (res && res.data) {
      const d = res.data;
      return request({
        resolveWith: {
          id: d.documentId || id,
          title: d.title,
          type: d.category === 'GO' ? 'Government Order' : 'Circular',
          department: d.departmentName || 'Government Department',
          date: d.uploadDate || '2025-01-01',
          referenceNo: d.fileName || `REF-${id}`,
          summary: d.description || d.title,
          sampleContent: d.description || 'Full document content available via download.',
          downloadUrl: d.fileUrl ? `http://localhost:8082/api/documents/download/${d.fileName}` : '#'
        }
      });
    }
  } catch (_) {}

  return request({ shouldFail: true, failMessage: 'Circular not found' });
}


/**
 * Called by Data Manager upload flow. In simulation mode this pushes
 * into the in-memory array so it appears immediately in User-facing
 * pages within the same session — mirroring what a real POST + re-fetch
 * would do once Spring Boot is connected.
 */
export async function uploadDocument(newDoc) {
  // Extract file, create FormData
  const { file, ...metadata } = newDoc;
  const formData = new FormData();
  
  if (file) {
    formData.append('file', file);
  }
  
  formData.append('metadata', new Blob([JSON.stringify(metadata)], {
    type: 'application/json'
  }));
  
  const headers = getAuthHeaders();
  // Fetch handles multipart boundary automatically when body is FormData
  const response = await fetch('http://localhost:8082/api/documents/upload', {
    method: 'POST',
    headers: headers,
    body: formData
  });
  
  if (!response.ok) {
    let errMsg = 'Failed to upload document';
    try {
      const errJson = await response.json();
      if (errJson && errJson.message) errMsg = errJson.message;
    } catch (_) {}
    throw new Error(errMsg);
  }
  
  const result = await response.json();
  return result.data;
}

export function recordDocumentView(id) {
  if (!id) return;
  const cleanId = String(id).replace(/^\D+/g, '');
  if (!cleanId) return;

  const token = localStorage.getItem('infoseva_access_token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    fetch(`http://localhost:8082/api/documents/${cleanId}/view`, {
      method: 'POST',
      headers,
    }).catch(() => {});
  } catch (_) {}
}
