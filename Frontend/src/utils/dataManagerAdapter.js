// src/utils/dataManagerAdapter.js
//
// Bridges the Data Manager module to the User-facing pages. Anything a Data
// Manager uploads (manual / bulk / API records) that is marked
// status === 'Published' becomes visible to citizens on the Government
// Schemes and Search pages, and is clickable through to a real detail page —
// even though there's no real backend yet, this makes the two roles behave
// like one connected system instead of two disconnected demos.

const SAMPLE_DOC_URL = '/sample-documents/infoseva-sample-document.pdf';

function publishedOnly(records = []) {
  return records.filter((r) => r.status === 'Published');
}

/**
 * Converts published Data-Manager records (category === 'Schemes') into the
 * same shape GovernmentSchemes.jsx / SchemeDetails.jsx expect from
 * data/dummyData.jsx's `schemes` array.
 */
export function toSchemeCards({ manualRecords = [], bulkRecords = [], apiRecords = [] } = {}) {
  const all = [
    ...publishedOnly(manualRecords).map((r) => ({ ...r, sourceLabel: 'Manual Upload' })),
    ...publishedOnly(bulkRecords).map((r) => ({ ...r, sourceLabel: 'Bulk Upload' })),
    ...publishedOnly(apiRecords).map((r) => ({ ...r, sourceLabel: 'API Sync' })),
  ].filter((r) => {
    const type = r.documentType || r.type;
    const cat = r.category;
    return type === 'Scheme' || type === 'Scholarship' || 
           cat === 'Schemes' || cat === 'Scholarship' || 
           ['Agriculture', 'Health', 'Housing', 'Education', 'Finance', 'Energy'].includes(cat);
  });

  return all.map((r) => {
    const meta = r.metadata || {};
    const docType = r.documentType || meta.documentType || (r.category === 'Scholarship' ? 'Scholarship' : 'Scheme');
    const isScholarship = docType === 'Scholarship';

    const pdfUrl = (r.fileName || meta.fileName) 
      ? `http://localhost:8082/api/documents/download/${r.fileName || meta.fileName}` 
      : (r.fileUrl || meta.fileUrl || null);

    return {
      id: `dm-${r.id || r.documentId}`,
      realId: r.id || r.documentId,
      name: r.title || meta.title,
      documentType: docType,
      category: (['Agriculture', 'Health', 'Housing', 'Education', 'Finance', 'Energy'].includes(r.category))
        ? r.category
        : (isScholarship ? 'Education' : 'Agriculture'),
      ministry: r.ministry || meta.ministry || r.department || meta.departmentName || 'Government of India',
      department: r.department || meta.department || meta.departmentName || 'General',
      status: 'Active',
      benefit: r.benefit || meta.benefit || (r.tags ? String(r.tags).split(',')[0].trim() : 'See scheme details'),
      beneficiaries: r.beneficiaries || meta.beneficiaries || r.stateUT || meta.stateUT || 'All India',
      educationLevel: r.educationLevel || meta.educationLevel || null,
      applicationDeadline: r.applicationDeadline || meta.applicationDeadline || null,
      launched: r.launchedYear || meta.launchedYear || (r.documentDate || r.date || meta.uploadDate || '').slice(0, 4) || '2025',
      eligibility: r.eligibility || meta.eligibility || r.description || 'Refer to the official guidelines for eligibility.',
      eligibilityQuestions: Array.isArray(r.eligibilityQuestions) && r.eligibilityQuestions.length > 0 
        ? r.eligibilityQuestions 
        : (Array.isArray(meta.eligibilityQuestions) && meta.eligibilityQuestions.length > 0 ? meta.eligibilityQuestions : undefined),
      description: r.description || meta.description || `${r.title} — official published record.`,
      documentsRequired: Array.isArray(r.documentsRequired) && r.documentsRequired.length > 0 
        ? r.documentsRequired 
        : (Array.isArray(meta.documentsRequired) && meta.documentsRequired.length > 0 
            ? meta.documentsRequired 
            : ['Aadhaar Card', 'Proof of Address', 'Bank Passbook']),
      howToApply: Array.isArray(r.howToApply) && r.howToApply.length > 0 
        ? r.howToApply 
        : (Array.isArray(meta.howToApply) && meta.howToApply.length > 0
            ? meta.howToApply
            : [
                'Visit the nearest Common Service Centre (CSC) or official portal.',
                'Fill out the application form and attach the required documents.',
                'Submit and note your application/reference number for tracking.'
              ]),
      faqs: Array.isArray(r.faqs) && r.faqs.length > 0 ? r.faqs : (Array.isArray(meta.faqs) ? meta.faqs : []),
      applyLink: r.applyLink || meta.applyLink || r.sourceUrl || meta.sourceUrl || '#',
      sampleDocumentUrl: pdfUrl,
      fileName: r.fileName || meta.fileName || null,
      sourceLabel: r.sourceLabel,
      isDataManagerSourced: true,
    };
  });
}



/**
 * Converts published Data-Manager records (category === 'Public Services' or 'Citizen Service')
 * into the service shape expected by ApplyServices.jsx.
 */
export function toCitizenServiceCards({ manualRecords = [], bulkRecords = [], apiRecords = [] } = {}) {
  const all = [
    ...publishedOnly(manualRecords).map((r) => ({ ...r, sourceLabel: 'Manual Upload' })),
    ...publishedOnly(bulkRecords).map((r) => ({ ...r, sourceLabel: 'Bulk Upload' })),
    ...publishedOnly(apiRecords).map((r) => ({ ...r, sourceLabel: 'API Sync' })),
  ].filter((r) => r.category === 'Public Services' || r.category === 'Citizen Service');

  return all.map((r) => ({
    id: `dm-svc-${r.id}`,
    name: r.title,
    category: r.department ? r.department.split(' ')[0] : 'General',
    eligibility: r.description || 'Eligible for all resident citizens.',
    documents: ['Aadhaar Card', 'Proof of Address', 'Application Form'],
    steps: [
      'Access the service details or official department portal.',
      'Submit the required application information and attachments.',
      'Track the application reference number for status.'
    ],
    fee: 'Standard Government Fee (or Free)',
    processingTime: '7 to 15 working days',
    applyLink: r.sourceUrl || 'https://services.india.gov.in',
    faqs: [
      { q: `What is ${r.title}?`, a: r.description || 'Official government public service.' }
    ],
    isDataManagerSourced: true
  }));
}
