import React, { createContext, useContext, useState, useEffect } from 'react';
import { getNotifications, getUnreadNotificationCount, markAsRead, markAllAsRead } from '../api/notificationsApi';

const DataManagerContext = createContext(null);

// ─── Initial Data ─────────────────────────────────────────────────────────────

const INITIAL_REVIEW_QUEUE = [
  {
    id: 'r1', title: 'RTI Response - MHA Land Acquisition 2024',
    type: 'RTI Repository', department: 'Ministry of Home Affairs',
    source: 'Manual Upload', confidence: 87,
    flagType: 'Auto-Flagged', uploadDate: '2026-06-28',
    reason: 'Extracted text contains unclear section headings — manual review recommended.',
  },
  {
    id: 'r2', title: 'PM Kisan Samman Nidhi Circular March 2025',
    type: 'Knowledge Base', department: 'Ministry of Agriculture',
    source: 'Bulk Upload', confidence: 43,
    flagType: 'Low Confidence', uploadDate: '2026-06-27',
    reason: 'OCR confidence below threshold — document may be a scanned image with low resolution.',
  },
  {
    id: 'r3', title: 'Community Certificate Application Form TN-2025',
    type: 'Public Services', department: 'Revenue Department',
    source: 'API Sync', confidence: 72,
    flagType: 'Auto-Flagged', uploadDate: '2026-06-26',
    reason: 'Department tag does not match content — possible mis-categorisation detected.',
  },
  {
    id: 'r4', title: 'National Scholarship Portal Guidelines 2024-25',
    type: 'Schemes', department: 'Ministry of Education',
    source: 'Manual Upload', confidence: 91,
    flagType: 'Routine Review', uploadDate: '2026-06-25',
    reason: 'High confidence extraction. Flagged for mandatory human review before publish.',
  },
  {
    id: 'r5', title: 'Digital Personal Data Protection Rules 2025',
    type: 'Knowledge Base', department: 'Ministry of Electronics & IT',
    source: 'Bulk Upload', confidence: 58,
    flagType: 'Medium Confidence', uploadDate: '2026-06-24',
    reason: 'Some sections extracted with partial text — cross-check with original document advised.',
  },
  {
    id: 'r6', title: 'MNREGS Employment Guarantee Scheme Update 2025',
    type: 'Schemes', department: 'Ministry of Rural Development',
    source: 'API Sync', confidence: 34,
    flagType: 'Low Confidence', uploadDate: '2026-06-23',
    reason: 'Multiple tables not extracted correctly. Document structure is complex.',
  },
  {
    id: 'r7', title: 'Forest Rights Act Amendment Circular 2024',
    type: 'Knowledge Base', department: 'Ministry of Tribal Affairs',
    source: 'Manual Upload', confidence: 79,
    flagType: 'Auto-Flagged', uploadDate: '2026-06-22',
    reason: 'Keywords in document do not match assigned category.',
  },
];

const INITIAL_CONTENT_GAPS = [
  { id: 'g1', query: 'Ration card transfer procedure', searches: 412, results: 0, lastSearched: '2 hours ago', priority: 'High', department: 'Food & Civil Supplies' },
  { id: 'g2', query: 'PMAY urban beneficiary list 2025', searches: 389, results: 1, lastSearched: '4 hours ago', priority: 'High', department: 'Ministry of Housing' },
  { id: 'g3', query: 'Encumbrance certificate online Tamil Nadu', searches: 301, results: 0, lastSearched: '6 hours ago', priority: 'High', department: 'Revenue Department' },
  { id: 'g4', query: 'RTI appeal second appellate authority', searches: 278, results: 2, lastSearched: '1 day ago', priority: 'Medium', department: 'DoPT' },
  { id: 'g5', query: 'Old age pension eligibility criteria 2025', searches: 234, results: 0, lastSearched: '1 day ago', priority: 'High', department: 'Social Welfare' },
  { id: 'g6', query: 'Death certificate delayed registration affidavit', searches: 198, results: 1, lastSearched: '2 days ago', priority: 'Medium', department: 'Revenue Department' },
  { id: 'g7', query: 'Water tanker booking procedure', searches: 156, results: 0, lastSearched: '2 days ago', priority: 'Medium', department: 'Municipal Corporation' },
  { id: 'g8', query: 'Senior citizen railway concession card', searches: 134, results: 3, lastSearched: '3 days ago', priority: 'Low', department: 'Ministry of Railways' },
];

const INITIAL_MANUAL_RECORDS = [
  {
    id: 'm1', title: 'RTI Act 2005 — Full Text',
    documentType: 'Act / Rule', department: 'DoPT',
    ministry: 'DoPT (Department of Personnel & Training)',
    category: 'Knowledge Base',
    stateUT: 'All India', documentDate: '2005-10-12',
    referenceNumber: 'ACT-2005-22', language: 'English',
    priority: 'High', accessLevel: 'Public',
    tags: 'RTI, Transparency, Right to Information',
    description: 'The Right to Information Act 2005 full legislative text.',
    sourceUrl: 'https://dopt.gov.in',
    date: '2026-06-01', status: 'Published',
  },
  {
    id: 'm2', title: 'PM Awas Yojana Guidelines 2024',
    documentType: 'Scheme', department: 'Ministry of Housing',
    ministry: 'Ministry of Housing & Urban Affairs',
    category: 'Schemes',
    stateUT: 'All India', documentDate: '2024-04-01',
    referenceNumber: 'PMAY-2024-01', language: 'English',
    priority: 'High', accessLevel: 'Public',
    tags: 'Housing, PMAY, Urban, Rural',
    description: 'Guidelines for Pradhan Mantri Awas Yojana 2024.',
    sourceUrl: 'https://pmaymis.gov.in',
    date: '2026-05-20', status: 'Published',
  },
  {
    id: 'm3', title: 'Income Certificate Application Form',
    documentType: 'Form', department: 'Revenue Department',
    ministry: 'Ministry of Finance',
    category: 'Public Services',
    stateUT: 'Tamil Nadu', documentDate: '2025-01-01',
    referenceNumber: 'TN-REV-FORM-01', language: 'Tamil, English',
    priority: 'Normal', accessLevel: 'Public',
    tags: 'Income Certificate, Revenue, Tamil Nadu',
    description: 'Official application form for Income Certificate in Tamil Nadu.',
    sourceUrl: 'https://tnedistrict.gov.in',
    date: '2026-05-10', status: 'Published',
  },
  {
    id: 'm4', title: 'National Health Mission Guidelines 2025',
    documentType: 'Government Order', department: 'Ministry of Health',
    ministry: 'Ministry of Health & Family Welfare',
    category: 'Knowledge Base',
    stateUT: 'All India', documentDate: '2025-03-15',
    referenceNumber: 'NHM-GO-2025-03', language: 'English',
    priority: 'High', accessLevel: 'Public',
    tags: 'Health, NHM, Public Health',
    description: 'Implementation guidelines for National Health Mission 2025.',
    sourceUrl: 'https://nhm.gov.in',
    date: '2026-04-18', status: 'In Review',
  },
];

const INITIAL_BULK_RECORDS = [
  {
    id: 'b1', title: 'RTI Responses Q1 2026 (Batch)',
    jobName: 'RTI Q1 2026 Ingestion', documentType: 'RTI Response',
    department: 'Multiple', ministry: 'Multiple',
    category: 'RTI Repository', stateUT: 'All India',
    dateRangeFrom: '2026-01-01', dateRangeTo: '2026-03-31',
    description: 'Batch ingestion of Q1 2026 RTI responses from multiple ministries.',
    tags: 'RTI, 2026, Q1', priority: 'High',
    recordCount: 234, date: '2026-06-15', status: 'Published',
  },
  {
    id: 'b2', title: 'Public Services Directory 2026',
    jobName: 'Services Directory 2026', documentType: 'Government Order',
    department: 'Ministry of Electronics', ministry: 'Ministry of Electronics & Information Technology',
    category: 'Public Services', stateUT: 'All India',
    dateRangeFrom: '2026-01-01', dateRangeTo: '2026-06-01',
    description: 'Comprehensive directory of public services available online.',
    tags: 'Services, e-Governance, Directory', priority: 'Normal',
    recordCount: 58, date: '2026-05-20', status: 'Published',
  },
  {
    id: 'b3', title: 'MoAFW Circulars Archive 2025',
    jobName: 'Agriculture Circulars 2025', documentType: 'Circular',
    department: 'Ministry of Agriculture', ministry: 'Ministry of Agriculture & Farmers Welfare',
    category: 'Knowledge Base', stateUT: 'All India',
    dateRangeFrom: '2025-01-01', dateRangeTo: '2025-12-31',
    description: 'Full year archive of Ministry of Agriculture circulars.',
    tags: 'Agriculture, Circulars, 2025', priority: 'Normal',
    recordCount: 89, date: '2026-05-10', status: 'Published',
  },
];

const INITIAL_API_RECORDS = [
  { id: 'a1', title: 'data.gov.in — Scheme Updates Feed', department: 'NIC', category: 'Schemes', date: '2026-06-20', status: 'Published' },
  { id: 'a2', title: 'India Code Portal — Acts and Rules', department: 'MoLJ', category: 'Knowledge Base', date: '2026-06-18', status: 'Published' },
];

const INITIAL_API_SOURCES = [
  {
    id: 'api1',
    name: 'data.gov.in Scheme Feed',
    description: 'Live feed of government scheme updates from the Open Government Data platform.',
    department: 'NIC / MeitY',
    baseUrl: 'https://api.data.gov.in',
    endpoint: '/resource/6176ee09-3d56-4a3b-8115-21841dba69f5',
    method: 'GET',
    responseFormat: 'JSON',
    authType: 'API Key',
    apiKey: 'your-api-key-here',
    bearerToken: '',
    customHeaders: '',
    category: 'Schemes',
    version: 'v1',
    frequency: 'Daily',
    environment: 'Production',
    rateLimit: '100',
    timeout: '30',
    retryAttempts: '3',
    docsUrl: 'https://data.gov.in/ogdpv2dms/api-doc',
    webhookUrl: '',
    contactEmail: 'support@data.gov.in',
    tags: 'Schemes, NIC, Open Data',
    isActive: true,
    notes: 'Primary source for scheme data. Requires annual API key renewal.',
    status: 'Active',
    lastSync: '2026-06-20 08:00',
    nextSync: '2026-06-21 08:00',
    health: 'Healthy',
    createdBy: 'Admin',
    updatedBy: 'Admin',
    errorPolicy: 'Retry on failure',
  },
  {
    id: 'api2',
    name: 'India Code — Acts and Rules',
    description: 'Full text of Indian legislation from the India Code digital repository.',
    department: 'Ministry of Law and Justice',
    baseUrl: 'https://api.indiacode.nic.in',
    endpoint: '/acts',
    method: 'GET',
    responseFormat: 'JSON',
    authType: 'None',
    apiKey: '',
    bearerToken: '',
    customHeaders: '',
    category: 'Knowledge Base',
    version: 'v2',
    frequency: 'Weekly',
    environment: 'Production',
    rateLimit: '60',
    timeout: '30',
    retryAttempts: '2',
    docsUrl: 'https://indiacode.nic.in/api-docs',
    webhookUrl: '',
    contactEmail: 'indiacode@nic.in',
    tags: 'Acts, Rules, Legislation',
    isActive: true,
    notes: 'No authentication required. Weekly sync is sufficient for legislative updates.',
    status: 'Active',
    lastSync: '2026-06-18 12:00',
    nextSync: '2026-06-25 12:00',
    health: 'Healthy',
    createdBy: 'Admin',
    updatedBy: 'Admin',
    errorPolicy: 'Skip on error',
  },
  {
    id: 'api3',
    name: 'MyGov Press Releases',
    description: 'Daily press releases and government communications from MyGov portal.',
    department: 'Ministry of Information & Broadcasting',
    baseUrl: 'https://api.mygov.in',
    endpoint: '/press-releases',
    method: 'GET',
    responseFormat: 'JSON',
    authType: 'Bearer Token',
    apiKey: '',
    bearerToken: 'eyJhbGciOiJIUzI1NiJ9...',
    customHeaders: 'X-Source: InfoSeva',
    category: 'Knowledge Base',
    version: 'v1',
    frequency: 'Daily',
    environment: 'Production',
    rateLimit: '200',
    timeout: '15',
    retryAttempts: '3',
    docsUrl: 'https://api.mygov.in/docs',
    webhookUrl: '',
    contactEmail: 'api@mygov.in',
    tags: 'Press Release, MyGov, Government',
    isActive: false,
    notes: 'Token expires every 90 days. Last renewed on 2026-05-01.',
    status: 'Inactive',
    lastSync: '2026-06-01 06:00',
    nextSync: '—',
    health: 'Unknown',
    createdBy: 'Admin',
    updatedBy: 'Admin',
    errorPolicy: 'Retry on failure',
  },
];

const INITIAL_ACTIVITY_LOG = [
  { id: 'l1', action: 'Bulk Upload', detail: 'RTI_Responses_Q1_2026.zip — 234 records ingested', time: '15 Jun 2026, 10:30 AM', type: 'upload' },
  { id: 'l2', action: 'API Connected', detail: 'data.gov.in Scheme Feed connected successfully', time: '20 Jun 2026, 08:00 AM', type: 'api' },
  { id: 'l3', action: 'Single Upload', detail: 'RTI Act 2005 — Full Text uploaded to Knowledge Base', time: '01 Jun 2026, 02:15 PM', type: 'upload' },
  { id: 'l4', action: 'Review Approved', detail: 'National Scholarship Portal Guidelines 2024-25 approved', time: '22 Jun 2026, 11:00 AM', type: 'review' },
  { id: 'l5', action: 'Review Rejected', detail: 'Low-quality scan of Patta Transfer form rejected', time: '23 Jun 2026, 09:45 AM', type: 'review' },
  { id: 'l6', action: 'API Synced', detail: 'India Code — Acts and Rules: 12 new records synced', time: '18 Jun 2026, 12:00 PM', type: 'api' },
  { id: 'l7', action: 'Bulk Upload', detail: 'MoAFW_Circulars_2025.zip — 89 records ingested', time: '10 May 2026, 04:00 PM', type: 'upload' },
  { id: 'l8', action: 'Content Gap Resolved', detail: 'Added Ration Card Procedure document — gap resolved', time: '25 Jun 2026, 03:30 PM', type: 'gap' },
];



// ─── Provider ─────────────────────────────────────────────────────────────────

export function DataManagerProvider({ children }) {
  const [reviewQueue, setReviewQueue]     = useState([]);
  const [contentGaps, setContentGaps]     = useState([]);
  const [manualRecords, setManualRecords] = useState([]);
  const [bulkRecords, setBulkRecords]     = useState([]);
  const [activityLog, setActivityLog]     = useState(INITIAL_ACTIVITY_LOG);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [dashboardStats, setDashboardStats] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('infoseva_access_token');
      if (!token) return;
      
      let role = localStorage.getItem('infoseva_user_role') || '';
      if (!role) {
        try {
          const u = JSON.parse(localStorage.getItem('infoseva_user') || '{}');
          role = u.role || '';
        } catch (e) {}
      }
      const isStaff = role.toUpperCase().includes('DATA_MANAGER') || role.toUpperCase().includes('ADMIN') || role.toLowerCase() === 'datamanager' || role.toLowerCase() === 'admin';
      if (!isStaff) return;
      
      const headers = { 'Authorization': `Bearer ${token}` };

      // Dashboard stats
      const statsRes = await fetch('http://localhost:8082/api/dashboard/data-manager', { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setDashboardStats(statsData.data);
      }

      // Review Queue
      const reviewRes = await fetch('http://localhost:8082/api/documents/review-queue?page=0&size=200', { headers });
      if (reviewRes.ok) {
        const reviewData = await reviewRes.json();
        const docs = reviewData.data.content || [];
        
        const parseBatchFromDesc = (desc = '', tags = '') => {
          let batchName = null;
          let batchId = null;
          const match = desc.match(/\[Batch:(.*?)\|BatchId:(.*?)\]/);
          if (match) {
            batchName = match[1];
            batchId = match[2];
          } else if (tags.toLowerCase().includes('bulk upload')) {
            const parts = tags.split(',').map(s => s.trim());
            const bName = parts.find(p => !p.toLowerCase().includes('bulk upload'));
            if (bName) {
              batchName = bName;
              batchId = `b-${bName.toLowerCase().replace(/\s+/g, '-')}`;
            }
          }
          return { batchName, batchId };
        };

        setReviewQueue(docs.map(d => {
          const { batchName, batchId } = parseBatchFromDesc(d.description, d.tags);
          const isBulk = !!batchName || (d.tags && d.tags.toLowerCase().includes('bulk'));
          return {
            id: d.documentId,
            title: d.title,
            type: d.category,
            department: d.departmentName,
            fileName: d.fileName,
            description: d.description,
            source: isBulk ? 'Bulk Upload' : 'Single Upload',
            confidence: 90,
            flagType: 'Review Required',
            uploadDate: d.uploadDate,
            reason: d.description || 'Awaiting human review',
            batchName,
            batchId,
            isBulk,
            createdBy: d.createdBy || 'Data Manager',
            approvedBy: d.approvedBy || null,
            publishedBy: d.approvedBy || d.createdBy || 'Data Manager',
            metadata: {
              ...d,
              title: d.title,
              department: d.departmentName,
              category: d.category,
              documentType: d.documentType || d.category,
              benefit: d.benefit,
              educationLevel: d.educationLevel,
              circularNumber: d.circularNumber,
              goNumber: d.goNumber,
              notificationNumber: d.notificationNumber,
              actNumber: d.actNumber,
              actYear: d.actYear,
              issueDate: d.issueDate,
              targetAudience: d.targetAudience,
              directives: d.directives
            }
          };
        }));
      }


      // Content Gaps (Preview for Dashboard)
      const gapsRes = await fetch('http://localhost:8082/api/analytics/content-gaps?page=0&size=100', { headers });
      if (gapsRes.ok) {
        const gapsData = await gapsRes.json();
        const content = gapsData.data?.content || [];
        setContentGaps(content.map((q) => {
          const dateStr = q.lastSearchedAt ? new Date(q.lastSearchedAt).toLocaleDateString() : 'Recently';
          return {
            id: q.queryId,
            query: q.keyword,
            searches: q.searchCount,
            results: 0,
            lastSearched: dateStr,
            priority: q.searchCount > 10 ? 'High' : 'Medium',
            department: 'Unknown'
          };
        }));
      }

      // Documents (Upload History) — staff see all, including draft/pending
      await fetchAllDocuments(headers);
    } catch (e) {
      console.error('Failed to fetch data manager data:', e);
    }
  };

  // ── Shared document-mapping helper (used by both staff and citizen paths) ──

  const mapDocToRecord = (d) => {
    const desc = d.description || '';
    const tags = d.tags || '';
    let batchName = null;
    let batchId = null;
    const match = desc.match(/\[Batch:(.*?)\|BatchId:(.*?)\]/);
    if (match) {
      batchName = match[1];
      batchId = match[2];
    } else if (tags.toLowerCase().includes('bulk upload')) {
      const parts = tags.split(',').map(s => s.trim());
      const bName = parts.find(p => !p.toLowerCase().includes('bulk upload'));
      if (bName) {
        batchName = bName;
        batchId = `b-${bName.toLowerCase().replace(/\s+/g, '-')}`;
      }
    }
    const isBulk = !!batchName || (tags && tags.toLowerCase().includes('bulk'));
    return {
      id: d.documentId,
      title: d.title,
      documentType: d.documentType || d.category,
      department: d.departmentName,
      category: d.category,
      date: d.uploadDate,
      status: d.reviewStatus === 'APPROVED' ? 'Published' : (d.reviewStatus === 'REJECTED' ? 'Rejected' : (d.reviewStatus === 'DRAFT' ? 'Draft' : 'In Review')),
      reviewStatus: d.reviewStatus,
      fileName: d.fileName,
      description: d.description,
      benefit: d.benefit,
      beneficiaries: d.beneficiaries,
      launchedYear: d.launchedYear,
      eligibility: d.eligibility,
      eligibilityQuestions: d.eligibilityQuestions,
      documentsRequired: d.documentsRequired,
      howToApply: d.howToApply,
      faqs: d.faqs,
      applyLink: d.applyLink,
      educationLevel: d.educationLevel,
      applicationDeadline: d.applicationDeadline,
      goNumber: d.goNumber,
      notificationNumber: d.notificationNumber,
      circularNumber: d.circularNumber,
      actYear: d.actYear,
      actNumber: d.actNumber,
      issueDate: d.issueDate || d.uploadDate,
      createdBy: d.createdBy || 'Data Manager',
      approvedBy: d.approvedBy || (d.reviewStatus === 'APPROVED' ? (d.createdBy || 'Data Manager') : null),
      approvedAt: d.approvedAt,
      publishedBy: d.approvedBy || d.createdBy || 'Data Manager',
      tags: d.tags,
      batchName,
      batchId,
      isBulk
    };
  };

  // Fetch all documents from backend and populate manualRecords / bulkRecords.
  // Works for ANY logged-in user — citizens get only APPROVED docs (backend enforces this),
  // staff get all docs (APPROVED + PENDING_REVIEW + DRAFT).
  const fetchAllDocuments = async (headersOverride) => {
    try {
      const token = localStorage.getItem('infoseva_access_token') || localStorage.getItem('token') || sessionStorage.getItem('jwt_token') || '';
      const headers = headersOverride || (token ? { 'Authorization': `Bearer ${token}` } : {});

      const docsRes = await fetch('http://localhost:8082/api/documents', { headers });
      if (!docsRes.ok) return;

      const docsData = await docsRes.json();
      const docs = docsData.data || [];

      const mappedDocs = docs.map(mapDocToRecord);

      // Separate manual vs bulk uploads
      const manuals = mappedDocs.filter(d => !d.isBulk);
      const bulks   = mappedDocs.filter(d => d.isBulk);
      setManualRecords(manuals);
      setBulkRecords(bulks);

      // Build activity log from real documents (staff view)
      const realActivities = mappedDocs.slice(0, 15).map((d, index) => {
        const isBulkDoc = d.isBulk || !!d.batchName;
        const isApproved = d.reviewStatus === 'APPROVED' || d.status === 'Published';
        const isRejected = d.reviewStatus === 'REJECTED';
        let action = isBulkDoc ? 'Bulk Upload' : 'Single Upload';
        if (isApproved) action = 'Review Approved';
        if (isRejected) action = 'Review Rejected';
        return {
          id: `act-${d.id || index}`,
          action,
          detail: `${d.title} (${d.category || 'Document'}) — ${d.department || 'General'}`,
          time: d.date ? new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
          type: action.toLowerCase().includes('upload') ? 'upload' : 'review'
        };
      });
      if (realActivities.length > 0) setActivityLog(realActivities);
    } catch (e) {
      console.error('Failed to fetch documents:', e);
    }
  };



  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      // Map DTO to frontend format
      const mapped = data.map(n => ({
        id: n.id,
        text: n.message,
        time: new Date(n.createdAt).toLocaleTimeString(), // Or use a time ago formatter
        read: n.isRead,
        route: n.referenceType === 'DOCUMENT' ? '/datamanager/review' : '/datamanager',
        type: n.type.toLowerCase()
      }));
      setNotifications(mapped);
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  };

  const fetchUnreadNotificationCount = async () => {
    try {
      const count = await getUnreadNotificationCount();
      setUnreadNotificationCount(count);
    } catch (e) {
      console.error('Failed to fetch unread count', e);
    }
  };

  React.useEffect(() => {
    // For staff: full dashboard data (stats, review queue, content gaps) + documents
    // For citizens: documents only (backend returns only APPROVED ones)
    let role = localStorage.getItem('infoseva_user_role') || '';
    if (!role) {
      try {
        const u = JSON.parse(localStorage.getItem('infoseva_user') || '{}');
        role = u.role || '';
      } catch (e) {}
    }
    const isStaff = role.toUpperCase().includes('DATA_MANAGER') || role.toUpperCase().includes('ADMIN') || role.toLowerCase() === 'datamanager' || role.toLowerCase() === 'admin';
    if (isStaff) {
      fetchDashboardData();
    } else {
      // Citizens: just load approved documents so pages have real data
      fetchAllDocuments();
    }
    fetchNotifications();
    fetchUnreadNotificationCount();
  }, []);

  // ── Review Queue ──────────────────────────────────────────────────────────

  const approveReviewItem = async (id) => {
    try {
      const token = localStorage.getItem('infoseva_access_token');
      if (!token) return false;
      
      const res = await fetch(`http://localhost:8082/api/documents/${id}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ decision: 'APPROVE', reason: 'Approved by Data Manager' })
      });
      
      if (res.ok) {
        setReviewQueue((prev) => prev.filter((i) => i.id !== id));
        addToLog('Review Approved', `Document ID ${id} approved and published.`, 'review');
        addNotification(`Document has been approved and is now live.`, '/datamanager/sources', 'review');
        fetchDashboardData();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to approve item', e);
      return false;
    }
  };

  const rejectReviewItem = async (id) => {
    try {
      const token = localStorage.getItem('infoseva_access_token');
      if (!token) return false;
      
      const res = await fetch(`http://localhost:8082/api/documents/${id}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ decision: 'REJECT', reason: 'Rejected by Data Manager' })
      });
      
      if (res.ok) {
        setReviewQueue((prev) => prev.filter((i) => i.id !== id));
        addToLog('Review Rejected', `Document ID ${id} was rejected.`, 'review');
        addNotification(`Document was rejected from the Review Queue.`, '/datamanager/review', 'review');
        fetchDashboardData();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to reject item', e);
      return false;
    }
  };

  const editReviewItem = async (id, form) => {
    try {
      const token = localStorage.getItem('infoseva_access_token');
      if (token && typeof id === 'number') {
        const payload = {
          title: form.title,
          departmentName: form.department,
          ministry: form.ministry,
          description: form.description,
          category: form.category || form.type,
          documentType: form.type,
          benefit: form.benefit,
          beneficiaries: form.beneficiaries,
          eligibility: form.eligibility,
          educationLevel: form.educationLevel,
          applicationDeadline: form.applicationDeadline,
          goNumber: form.goNumber,
          circularNumber: form.circularNumber,
          notificationNumber: form.notificationNumber,
          actNumber: form.actNumber,
          actYear: form.actYear,
          issueDate: form.issueDate,
          targetAudience: form.targetAudience,
          active: true,
          reviewStatus: 'PENDING_REVIEW'
        };

        await fetch(`http://localhost:8082/api/documents/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }
    } catch (e) {
      console.warn('Backend update for review item optional sync failed:', e);
    }

    setReviewQueue((prev) => prev.map((i) => {
      if (i.id === id) {
        return {
          ...i,
          ...form,
          title: form.title,
          department: form.department,
          type: form.type,
          description: form.description || i.description,
          benefit: form.benefit,
          metadata: {
            ...(i.metadata || {}),
            ...form,
            title: form.title,
            department: form.department,
            departmentName: form.department,
            documentType: form.type,
            category: form.category || form.type,
            benefit: form.benefit,
            educationLevel: form.educationLevel,
            circularNumber: form.circularNumber,
            goNumber: form.goNumber,
            notificationNumber: form.notificationNumber,
            actNumber: form.actNumber,
            actYear: form.actYear,
            issueDate: form.issueDate,
            targetAudience: form.targetAudience,
            description: form.description
          }
        };
      }
      return i;
    }));
  };


  const bulkApproveItems = (ids) => {
    ids.forEach((id) => approveReviewItem(id));
  };

  const bulkRejectItems = (ids) => {
    ids.forEach((id) => rejectReviewItem(id));
  };

  // ── Manual Upload ─────────────────────────────────────────────────────────

  const addManualUpload = (record) => {
    const newRecord = {
      id: `m${Date.now()}`,
      ...record,
      date: new Date().toISOString().slice(0, 10),
      status: 'In Review',
    };
    setManualRecords((prev) => [newRecord, ...prev]);

    const newQueueItem = {
      id: `r${Date.now()}`,
      title: record.title || record.fileName,
      type: record.category,
      department: record.department || '',
      source: 'Manual Upload',
      confidence: Math.floor(Math.random() * 20) + 70,
      flagType: 'Routine Review',
      uploadDate: new Date().toISOString().slice(0, 10),
      reason: `Newly uploaded ${record.documentType || 'document'} — awaiting review before publishing.`,
    };
    setReviewQueue((prev) => [newQueueItem, ...prev]);
    addToLog('Single Upload', `"${record.title || record.fileName}" uploaded to ${record.category}.`, 'upload');
    addNotification(`New document "${record.title || record.fileName}" added to Review Queue.`, '/datamanager/review', 'review');
  };

  const updateDocumentRecord = async (id, form) => {
    try {
      const token = localStorage.getItem('infoseva_access_token') || localStorage.getItem('token');
      if (token && (typeof id === 'number' || !isNaN(Number(id)))) {
        const payload = {
          title: form.title,
          departmentName: form.department,
          ministry: form.ministry,
          description: form.description,
          category: form.category || form.type || form.documentType,
          documentType: form.documentType || form.type,
          benefit: form.benefit,
          beneficiaries: form.beneficiaries,
          eligibility: form.eligibility,
          educationLevel: form.educationLevel,
          applicationDeadline: form.applicationDeadline,
          goNumber: form.goNumber,
          circularNumber: form.circularNumber,
          notificationNumber: form.notificationNumber,
          actNumber: form.actNumber,
          actYear: form.actYear,
          issueDate: form.issueDate,
          targetAudience: form.targetAudience,
          active: true,
        };

        const res = await fetch(`http://localhost:8082/api/documents/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          fetchDashboardData();
          addToLog('Document Updated', `Document "${form.title}" details were updated.`, 'info');
          return true;
        }
      }
    } catch (e) {
      console.warn('Backend update failed:', e);
    }

    // Local state fallback update
    setManualRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...form } : r)));
    setBulkRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...form } : r)));
    addToLog('Document Updated', `Document "${form.title}" was updated.`, 'info');
    return true;
  };

  const updateManualRecord = (id, updates) => {
    return updateDocumentRecord(id, updates);
  };

  const deleteManualRecord = async (id) => {
    try {
      const token = localStorage.getItem('infoseva_access_token');
      if (!token) return;
      const res = await fetch(`http://localhost:8082/api/documents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        // Refresh dashboard statistics and documents
        fetchDashboardData();
        addToLog('Document Deleted', `Document ID ${id} was deleted from the system.`, 'delete');
      }
    } catch (e) { console.error('Failed to delete document', e); }
  };

  // ── Bulk Upload ───────────────────────────────────────────────────────────


  // ── API Sources ───────────────────────────────────────────────────────────

  // ── Content Gaps ──────────────────────────────────────────────────────────

  const markGapAsAdded = (id) => {
    // Only used to instantly hide it locally, actual delete happens on success
    setContentGaps((prev) => prev.filter((g) => g.id !== id));
    addToLog('Content Gap Resolved', 'Content gap resolved — document added to Knowledge Base.', 'gap');
  };

  const deleteContentGap = async (id) => {
    try {
      const token = localStorage.getItem('infoseva_access_token');
      if (!token) return false;
      const res = await fetch(`http://localhost:8082/api/analytics/content-gaps/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setContentGaps((prev) => prev.filter((g) => g.id !== id));
        fetchDashboardData();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to delete content gap', e);
      return false;
    }
  };

  // ── Notifications ─────────────────────────────────────────────────────────

  const markNotificationsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadNotificationCount(0);
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  };

  const markSingleRead = async (id) => {
    try {
      // Find if it was unread to decrement the counter
      const notif = notifications.find(n => n.id === id);
      if (notif && !notif.read) {
        await markAsRead(id);
        setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
        setUnreadNotificationCount(prev => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error('Failed to mark as read', e);
    }
  };

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const addToLog = (action, detail, type = 'info') => {
    const now = new Date();
    const formatted =
      now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ', ' +
      now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setActivityLog((prev) => [{ id: `l${Date.now()}`, action, detail, time: formatted, type }, ...prev]);
  };

  const addNotification = (text, route = '/datamanager', type = 'info') => {
    setNotifications((prev) => [
      { id: `n${Date.now()}`, text, time: 'Just now', read: false, route, type },
      ...prev,
    ]);
  };



  return (
    <DataManagerContext.Provider
      value={{
        dashboardStats, refreshDashboardData: fetchDashboardData,
        reviewQueue, approveReviewItem, rejectReviewItem, editReviewItem,
        bulkApproveItems, bulkRejectItems,
        contentGaps, markGapAsAdded, deleteContentGap,
        manualRecords, addManualUpload, updateManualRecord, updateDocumentRecord, deleteManualRecord,
        bulkRecords,
        activityLog,
        notifications, unreadNotificationCount, markNotificationsRead, markSingleRead,
        deleteNotification, clearAllNotifications, fetchNotifications, fetchUnreadNotificationCount,
      }}
    >
      {children}
    </DataManagerContext.Provider>
  );
}

export function useDataManager() {
  const ctx = useContext(DataManagerContext);
  if (!ctx) throw new Error('useDataManager must be used inside DataManagerProvider');
  return ctx;
}
