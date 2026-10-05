export const stats = [
  { label: 'Government Documents', value: '2,84,563', icon: 'FileText', trend: '+12%' },
  { label: 'Government Schemes', value: '1,247', icon: 'BookOpen', trend: '+5%' },
  { label: 'RTI Responses', value: '98,432', icon: 'MessageSquare', trend: '+18%' },
  { label: 'Departments Covered', value: '834', icon: 'Building2', trend: '+3%' },
];

export const latestUpdates = [
  {
    id: 1,
    type: 'Circular',
    title: 'Implementation Guidelines for PM Kisan Samman Nidhi — Revised Norms 2025',
    department: 'Ministry of Agriculture & Farmers Welfare',
    date: '2025-06-15',
    category: 'Agriculture',
    badge: 'New',
  },
  {
    id: 2,
    type: 'Government Order',
    title: 'Digital Health Mission: Ayushman Bharat PMJAY Enrollment Expansion Notification',
    department: 'Ministry of Health & Family Welfare',
    date: '2025-06-12',
    category: 'Health',
    badge: 'Updated',
  },
  {
    id: 3,
    type: 'Scheme',
    title: 'Pradhan Mantri Awas Yojana — Urban 2.0: Application Window Open for FY 2025-26',
    department: 'Ministry of Housing & Urban Affairs',
    date: '2025-06-10',
    category: 'Housing',
    badge: 'Scheme',
  },
  {
    id: 4,
    type: 'Circular',
    title: 'Revised Guidelines for Passport Seva Kendra — Appointment Booking Modernisation',
    department: 'Ministry of External Affairs',
    date: '2025-06-08',
    category: 'Services',
    badge: null,
  },
  {
    id: 5,
    type: 'Act',
    title: 'Digital Personal Data Protection Rules 2025 — Draft for Public Comment',
    department: 'Ministry of Electronics & IT',
    date: '2025-06-05',
    category: 'Technology',
    badge: 'Draft',
  },
];

export const searchResults = [
  {
    id: 1,
    title: 'PM Kisan Samman Nidhi — Eligibility Criteria and Application Procedure',
    department: 'Ministry of Agriculture',
    category: 'Scheme',
    date: '2025-04-01',
    summary: 'Financial benefit of ₹6,000 per year for small and marginal farmers, disbursed in three equal installments. Beneficiaries must own cultivable land up to 2 hectares.',
    type: 'Scheme',
    route: '/user/schemes/pm-kisan-samman-nidhi',
    portalUrl: 'https://pmkisan.gov.in',
  },
  {
    id: 2,
    title: 'Right to Information Act 2005 — Complete Act with Amendments',
    department: 'Ministry of Personnel, PG & Pensions',
    category: 'Act & Rules',
    date: '2005-06-15',
    summary: 'The RTI Act mandates timely response to citizen requests for government information, empowering transparency and accountability in public institutions.',
    type: 'Act',
    route: '/user/documents/101',
    portalUrl: 'https://rti.gov.in',
  },
  {
    id: 3,
    title: 'Voter ID Card — How to Apply, Required Documents, and Status Check',
    department: 'Election Commission of India',
    category: 'Citizen Service',
    date: '2025-01-10',
    summary: 'Step-by-step procedure to apply for a new Voter ID (EPIC) card, update address, or correct personal details using Form 6, 6A, or 8.',
    type: 'Procedure',
    route: '/user/government-services',
    portalUrl: 'https://voters.eci.gov.in',
  },
  {
    id: 4,
    title: 'Pradhan Mantri Jan Dhan Yojana — Account Opening and Benefits',
    department: 'Ministry of Finance',
    category: 'Financial Scheme',
    date: '2024-08-28',
    summary: 'National financial inclusion mission providing basic savings bank accounts with overdraft facility, accidental insurance cover, and life insurance cover.',
    type: 'Scheme',
    route: '/user/schemes/pradhan-mantri-mudra-yojana',
    portalUrl: 'https://pmjdy.gov.in',
  },
];

export const rtiResults = [
  {
    id: 1,
    question: 'What is the status of road construction under PMGSY in Tamil Nadu?',
    department: 'Ministry of Rural Development',
    dateFiled: '2024-11-15',
    dateReceived: '2024-12-08',
    status: 'Responded',
    summary: 'The department disclosed that 2,347 km of rural roads were sanctioned under PMGSY Phase III in Tamil Nadu with completion target of March 2026. Funds of ₹4,200 crore allocated.',
    rtiNumber: 'RTI/MRD/TN/2024/4521',
  },
  {
    id: 2,
    question: 'Details of beneficiaries receiving scholarships under NSP in 2023-24',
    department: 'Ministry of Education',
    dateFiled: '2024-09-20',
    dateReceived: '2024-10-14',
    status: 'Responded',
    summary: 'Total 1.2 crore students received scholarships worth ₹3,800 crore under NSP in 2023-24. State-wise breakup and category-wise data provided.',
    rtiNumber: 'RTI/MOE/2024/8934',
  },
  {
    id: 3,
    question: 'Number of Aadhaar enrollments pending verification in Tamil Nadu districts',
    department: 'UIDAI',
    dateFiled: '2024-08-02',
    dateReceived: '2024-09-01',
    status: 'Responded',
    summary: 'As of July 2024, 84,213 Aadhaar enrollments were pending biometric verification across Tamil Nadu, with Chennai and Coimbatore districts accounting for 38% of the backlog.',
    rtiNumber: 'RTI/UIDAI/TN/2024/2211',
  },
  {
    id: 4,
    question: 'MGNREGS wage payment delays in Uttar Pradesh — reasons and compensation',
    department: 'Ministry of Rural Development',
    dateFiled: '2024-07-10',
    dateReceived: '2024-08-20',
    status: 'Responded',
    summary: 'Delayed wage payments affected 3.4 lakh workers in FY 2023-24 due to fund transfer order (FTO) processing lag. Compensation of ₹22 crore disbursed under delay compensation rules.',
    rtiNumber: 'RTI/MRD/UP/2024/6650',
  },
  {
    id: 5,
    question: 'Ayushman Bharat PM-JAY hospital empanelment status in Maharashtra',
    department: 'National Health Authority',
    dateFiled: '2024-05-18',
    dateReceived: '2024-06-25',
    status: 'Responded',
    summary: '1,842 hospitals are empanelled under PM-JAY in Maharashtra as of March 2024, of which 61% are private facilities. 42 new empanelment applications are under review.',
    rtiNumber: 'RTI/NHA/MH/2024/3387',
  },
  {
    id: 6,
    question: 'PM Awas Yojana (Urban) — number of houses sanctioned vs completed in Gujarat',
    department: 'Ministry of Housing & Urban Affairs',
    dateFiled: '2024-04-02',
    dateReceived: '2024-05-11',
    status: 'Responded',
    summary: '4.1 lakh houses sanctioned under PMAY-U in Gujarat, of which 3.3 lakh (80%) have been completed and occupied as of March 2024.',
    rtiNumber: 'RTI/MoHUA/GJ/2024/1187',
  },
  {
    id: 7,
    question: 'Ration card cancellations in Delhi over the past two years — grounds and appeals',
    department: 'Department of Food, Civil Supplies & Consumer Affairs',
    dateFiled: '2024-03-14',
    dateReceived: '2024-04-30',
    status: 'Responded',
    summary: '18,742 ration cards were cancelled in Delhi during 2022–24, primarily due to Aadhaar seeding mismatches and duplicate entries. 2,103 appeals were filed, of which 640 were reinstated.',
    rtiNumber: 'RTI/DFCS/DL/2024/0942',
  },
];

export const schemes = [
  {
    id: 1,
    slug: 'pm-kisan-samman-nidhi',
    name: 'PM Kisan Samman Nidhi',
    ministry: 'Ministry of Agriculture',
    benefit: '₹6,000/year',
    category: 'Agriculture',
    eligibility: 'Small & marginal farmers with land up to 2 hectares',
    status: 'Active',
    beneficiaries: '11.37 Crore',
    launched: '2019',
    applyLink: 'https://pmkisan.gov.in',
    description: 'PM-KISAN provides income support of ₹6,000 per year to all landholding farmer families, payable in three equal installments of ₹2,000 every four months, transferred directly to bank accounts via DBT.',
    documentsRequired: ['Aadhaar Card', 'Land ownership records (khasra/khatauni)', 'Bank passbook copy', 'Passport-size photograph'],
    howToApply: [
      'Visit the PM-KISAN portal (pmkisan.gov.in) or your nearest Common Service Centre (CSC).',
      'Register using Aadhaar number and land records.',
      'Fill in bank account details for DBT transfer.',
      'Submit for verification by the local Patwari/Revenue Officer.',
      'Track application status using your registration number.',
    ],
    faqs: [
      { q: 'Who is not eligible for PM-KISAN?', a: 'Institutional landholders, government employees (except Group D/Class IV), income-tax payees, and professionals like doctors/lawyers/CAs are excluded.' },
      { q: 'How often is the amount paid?', a: 'In three equal installments of ₹2,000 every four months, directly to the beneficiary bank account.' },
    ],
    relatedCircularId: 1,
  },
  {
    id: 2,
    slug: 'ayushman-bharat-pmjay',
    name: 'Ayushman Bharat PM-JAY',
    ministry: 'Ministry of Health',
    benefit: '₹5 Lakh/year health cover',
    category: 'Health',
    eligibility: 'Economically vulnerable families as per SECC data',
    status: 'Active',
    beneficiaries: '55 Crore',
    launched: '2018',
    applyLink: 'https://pmjay.gov.in',
    description: 'Ayushman Bharat PM-JAY offers cashless health cover of ₹5 lakh per family per year for secondary and tertiary care hospitalisation, at empanelled public and private hospitals across India.',
    documentsRequired: ['Aadhaar Card', 'Ration Card', 'SECC 2011 verification (or state health card)', 'Mobile number for OTP verification'],
    howToApply: [
      'Check eligibility at pmjay.gov.in using Aadhaar/Ration Card number.',
      'Visit the nearest Ayushman Bharat Kendra or empanelled hospital help desk.',
      'Complete e-KYC verification.',
      'Receive Ayushman Card (physical/digital) for cashless treatment.',
    ],
    faqs: [
      { q: 'Is there a premium to pay?', a: 'No, the scheme is entirely free for eligible beneficiaries.' },
      { q: 'Can I use it in any hospital?', a: 'Only at hospitals empanelled under PM-JAY; check the list on the official portal.' },
    ],
    relatedCircularId: 2,
  },
  {
    id: 3,
    slug: 'pm-awas-yojana-urban',
    name: 'PM Awas Yojana — Urban',
    ministry: 'Ministry of Housing & Urban Affairs',
    benefit: 'Housing subsidy up to ₹2.67 Lakh',
    category: 'Housing',
    eligibility: 'Families without pucca house in urban areas',
    status: 'Active',
    beneficiaries: '1.18 Crore',
    launched: '2015',
    applyLink: 'https://pmay-urban.gov.in',
    description: 'PMAY-Urban 2.0 provides interest subsidy on home loans and direct financial assistance to help economically weaker sections and low-income groups build or buy a pucca house.',
    documentsRequired: ['Aadhaar Card', 'Income Certificate', 'Proof of no existing pucca house', 'Bank account details'],
    howToApply: [
      'Apply online at pmay-urban.gov.in.',
      'Select the appropriate vertical (BLC/AHP/ISSR/CLSS).',
      'Upload income and identity proof.',
      'Await verification by the Urban Local Body (ULB).',
    ],
    faqs: [
      { q: 'What is the income limit for EWS category?', a: 'Annual household income up to ₹3 lakh qualifies under Economically Weaker Section.' },
    ],
    relatedCircularId: 3,
  },
  {
    id: 4,
    slug: 'pradhan-mantri-ujjwala-yojana',
    name: 'Pradhan Mantri Ujjwala Yojana',
    ministry: 'Ministry of Petroleum & Natural Gas',
    benefit: 'Free LPG connection',
    category: 'Energy',
    eligibility: 'Women from BPL households',
    status: 'Active',
    beneficiaries: '9.59 Crore',
    launched: '2016',
    applyLink: 'https://www.pmuy.gov.in',
    description: 'PMUY provides free LPG connections to women from Below Poverty Line (BPL) households, aiming to replace unclean cooking fuels with clean cooking gas.',
    documentsRequired: ['Aadhaar Card', 'BPL Ration Card', 'Bank passbook copy', 'Passport-size photograph'],
    howToApply: [
      'Visit your nearest LPG distributor with required documents.',
      'Fill in Form KYC (Ujjwala) available at the distributor or online.',
      'Submit for verification.',
      'Receive free connection with first cylinder and stove (on subsidy/EMI).',
    ],
    faqs: [
      { q: 'Is the refill also free?', a: 'Only the initial connection is free; subsequent refills are subsidised but not free.' },
    ],
    relatedCircularId: null,
  },
  {
    id: 5,
    slug: 'national-scholarship-portal',
    name: 'National Scholarship Portal (NSP)',
    ministry: 'Ministry of Education',
    benefit: 'Scholarships up to ₹50,000/year',
    category: 'Education',
    eligibility: 'Students from minority/SC/ST/OBC communities',
    status: 'Active',
    beneficiaries: '1.2 Crore',
    launched: '2015',
    applyLink: 'https://scholarships.gov.in',
    description: 'NSP is a one-stop platform for students to apply for over 60 central and state scholarship schemes covering pre-matric, post-matric, and merit-based awards.',
    documentsRequired: ['Aadhaar Card', 'Caste Certificate (if applicable)', 'Income Certificate', 'Previous year mark sheet', 'Bank account details'],
    howToApply: [
      'Register at scholarships.gov.in with Aadhaar-linked mobile number.',
      'Select the applicable scholarship scheme.',
      'Upload academic and income documents.',
      'Submit before the institution verification deadline.',
    ],
    faqs: [
      { q: 'Can I apply for multiple scholarships?', a: 'You can apply for multiple schemes but can typically only receive benefits under one at a time unless explicitly allowed.' },
    ],
    relatedCircularId: null,
  },
  {
    id: 6,
    slug: 'pradhan-mantri-mudra-yojana',
    name: 'Pradhan Mantri Mudra Yojana',
    ministry: 'Ministry of Finance',
    benefit: 'Loan up to ₹10 Lakh',
    category: 'Finance',
    eligibility: 'Non-corporate, non-farm small/micro enterprises',
    status: 'Active',
    beneficiaries: '40+ Crore accounts',
    launched: '2015',
    applyLink: 'https://www.mudra.org.in',
    description: 'PMMY provides collateral-free loans up to ₹10 lakh to non-corporate, non-farm small and micro enterprises under three categories: Shishu, Kishor, and Tarun.',
    documentsRequired: ['Aadhaar Card', 'PAN Card', 'Business plan/proof of business', 'Bank statements (6 months)'],
    howToApply: [
      'Approach any participating bank, NBFC, or MFI.',
      'Fill in the Mudra loan application form.',
      'Submit business and identity proof.',
      'Loan disbursed under Shishu (up to ₹50,000), Kishor (₹50,000–5 lakh), or Tarun (₹5–10 lakh).',
    ],
    faqs: [
      { q: 'Is collateral required?', a: 'No, Mudra loans are collateral-free.' },
    ],
    relatedCircularId: null,
  },
];

// Government documents / RTI reference documents — each has a sample content excerpt
export const govDocuments = [
  {
    id: 101,
    slug: 'income-certificate',
    title: 'Income Certificate',
    type: 'Document',
    department: 'Revenue Department (State Govt.)',
    category: 'Certificates',
    description: 'An Income Certificate is an official document certifying the annual income of an individual or family, issued by the Revenue/Tehsildar office. It is required for scholarships, reserved category benefits, and various welfare schemes.',
    documentsRequired: ['Aadhaar Card', 'Ration Card', 'Salary slip/Form 16 (if employed)', 'Self-declaration affidavit'],
    howToApply: [
      'Apply online via your state e-District portal, or visit the Tehsildar/Revenue office.',
      'Fill the income certificate application form.',
      'Attach identity and income proof.',
      'Village Administrative Officer (VAO) verification (rural areas).',
      'Certificate issued within 15–30 days.',
    ],
    sampleContent: `GOVERNMENT OF TAMIL NADU
REVENUE DEPARTMENT
INCOME CERTIFICATE

Certificate No: INC/2025/TN/00482913
Issued Date: 12-Feb-2025

This is to certify that Shri/Smt. _________________, S/o D/o _________________,
residing at _________________, District: _________________, has an annual family
income of Rs. 1,85,000/- (Rupees One Lakh Eighty-Five Thousand Only) from all
sources for the financial year 2024-25.

This certificate is issued for the purpose of: Educational Scholarship / Scheme Benefit.

                                                        Tehsildar
                                                   (Revenue Divisional Office)`,
    relatedSchemeId: 5,
  },
  {
    id: 102,
    slug: 'caste-certificate',
    title: 'Caste Certificate',
    type: 'Document',
    department: 'Revenue Department (State Govt.)',
    category: 'Certificates',
    description: 'A Caste Certificate certifies an individual\'s caste for availing reservation benefits in education, employment, and government schemes under SC/ST/OBC categories.',
    documentsRequired: ['Aadhaar Card', 'Parent\'s caste certificate (if available)', 'Community certificate application form', 'Residence proof'],
    howToApply: [
      'Apply at the Tahsildar office or state e-District portal.',
      'Submit parent/family caste proof and residence documents.',
      'Field verification by Revenue Inspector.',
      'Certificate issued after verification, typically 30 days.',
    ],
    sampleContent: `GOVERNMENT OF TAMIL NADU
REVENUE DEPARTMENT
COMMUNITY CERTIFICATE

Certificate No: CC/2025/TN/00119284
Issued Date: 03-Mar-2025

This is to certify that Shri/Smt. _________________ belongs to the
_________________ Community, which is recognised as a
Backward Class / Most Backward Class / SC / ST as per
Government of Tamil Nadu records.

This certificate is issued based on verification of family records and
is valid for educational and employment purposes as per applicable rules.

                                                        Tahsildar`,
    relatedSchemeId: null,
  },
  {
    id: 103,
    slug: 'ration-card',
    title: 'Ration Card',
    type: 'Document',
    department: 'Department of Food, Civil Supplies & Consumer Affairs',
    category: 'Certificates',
    description: 'A Ration Card is an official document used to purchase subsidised food grains under the Public Distribution System (PDS), and also serves as a common identity/address proof.',
    documentsRequired: ['Aadhaar Card of all family members', 'Address proof', 'Passport-size photographs', 'Bank account passbook'],
    howToApply: [
      'Apply via the state Public Distribution System (PDS) portal or Taluk Supply Office.',
      'Fill Form for new ration card (APL/BPL/AAY as applicable).',
      'Submit family details and address proof.',
      'Field verification by Food Inspector.',
      'Ration card issued/dispatched to registered address.',
    ],
    sampleContent: `GOVERNMENT OF TAMIL NADU
DEPARTMENT OF FOOD, CIVIL SUPPLIES & CONSUMER PROTECTION
FAMILY RATION CARD

Card No: TN-RC-2025-0038221
Card Type: Priority Household (PHH)

Head of Family: _________________
Address: _________________
Fair Price Shop Code: FPS-TN-4471

Members Registered: 4
Entitlement: 5 kg rice per member per month (subsidised rate)

                                                Taluk Supply Officer`,
    relatedSchemeId: null,
  },
  {
    id: 104,
    slug: 'birth-certificate',
    title: 'Birth Certificate',
    type: 'Document',
    department: 'Department of Registration (Municipal/Panchayat)',
    category: 'Certificates',
    description: 'A Birth Certificate is a vital record certifying the date, place, and details of birth — mandatory for school admission, passport, and most government scheme applications.',
    documentsRequired: ['Hospital birth record/discharge summary', 'Parents\' Aadhaar Card', 'Address proof'],
    howToApply: [
      'Register within 21 days of birth at the Municipal Corporation/Panchayat office (or hospital, if tie-up exists).',
      'For delayed registration (after 1 year), a court order/affidavit may be required.',
      'Submit hospital records and parent ID proof.',
      'Certificate issued digitally or physically within 7–15 days.',
    ],
    sampleContent: `GOVERNMENT OF TAMIL NADU
REGISTRATION OF BIRTHS AND DEATHS

Registration No: BC/2025/CHN/00219873
Date of Registration: 18-Jan-2025

This is to certify that as per the record of birth maintained under the
Registration of Births and Deaths Act, 1969, the birth of the child named
below has been duly registered:

Name of Child: _________________
Date of Birth: _________________
Place of Birth: _________________
Sex: _________________
Name of Father: _________________
Name of Mother: _________________

                                                Registrar of Births & Deaths`,
    relatedSchemeId: null,
  },
];

// Government Orders / Circulars — full detail records (linked from latestUpdates by id)
export const circularDetails = [
  {
    id: 1,
    title: 'Implementation Guidelines for PM Kisan Samman Nidhi — Revised Norms 2025',
    department: 'Ministry of Agriculture & Farmers Welfare',
    type: 'Circular',
    date: '2025-06-15',
    referenceNo: 'F.No. 1-4/2025-PM-Kisan',
    summary: 'Revised implementation guidelines streamline the e-KYC verification process for PM-KISAN beneficiaries and introduce land-seeding integration with state revenue records to reduce duplicate/ineligible payments.',
    sampleContent: `F.No. 1-4/2025-PM-Kisan
GOVERNMENT OF INDIA
MINISTRY OF AGRICULTURE & FARMERS WELFARE
DEPARTMENT OF AGRICULTURE & FARMERS WELFARE

CIRCULAR

Subject: Implementation Guidelines for PM-KISAN — Revised Norms 2025

1. All State Governments/UT Administrations are directed to complete
   Aadhaar-based e-KYC of all registered beneficiaries by 30-Sep-2025.
2. Land record seeding with the PM-KISAN portal is now mandatory before
   release of the 18th installment.
3. District Nodal Officers shall submit compliance reports on a monthly basis.

This issues with the approval of the competent authority.

                                                Joint Secretary (PM-KISAN)`,
    relatedSchemeId: 1,
  },
  {
    id: 2,
    title: 'Digital Health Mission: Ayushman Bharat PMJAY Enrollment Expansion Notification',
    department: 'Ministry of Health & Family Welfare',
    type: 'Government Order',
    date: '2025-06-12',
    referenceNo: 'Z.28015/12/2025-NHA',
    summary: 'Enrollment under PM-JAY expanded to cover all senior citizens above 70 years regardless of income category, integrated with the Ayushman Bharat Digital Mission (ABDM) health ID.',
    sampleContent: `Z.28015/12/2025-NHA
GOVERNMENT OF INDIA
MINISTRY OF HEALTH & FAMILY WELFARE
NATIONAL HEALTH AUTHORITY

NOTIFICATION

In supersession of earlier notifications, all citizens aged 70 years and
above shall be eligible for enrollment under Ayushman Bharat PM-JAY,
irrespective of socio-economic category, with immediate effect.

Enrollment shall be linked to the beneficiary's Ayushman Bharat Health
Account (ABHA) ID under the Digital Health Mission.

                                                CEO, National Health Authority`,
    relatedSchemeId: 2,
  },
  {
    id: 3,
    title: 'Pradhan Mantri Awas Yojana — Urban 2.0: Application Window Open for FY 2025-26',
    department: 'Ministry of Housing & Urban Affairs',
    type: 'Scheme',
    date: '2025-06-10',
    referenceNo: 'K-14011/2/2025-Hsg',
    summary: 'Application window for PMAY-U 2.0 opened for FY 2025-26 under all four verticals (BLC, AHP, ISSR, CLSS), with enhanced subsidy slabs for EWS/LIG categories.',
    sampleContent: `K-14011/2/2025-Hsg
GOVERNMENT OF INDIA
MINISTRY OF HOUSING & URBAN AFFAIRS

OFFICE MEMORANDUM

Subject: PMAY-Urban 2.0 — Application Window for FY 2025-26

The application window for PMAY-U 2.0 is hereby opened for FY 2025-26
across all States/UTs under the following verticals:
  (a) Beneficiary-Led Construction (BLC)
  (b) Affordable Housing in Partnership (AHP)
  (c) In-Situ Slum Redevelopment (ISSR)
  (d) Credit-Linked Subsidy Scheme (CLSS)

Urban Local Bodies shall widely publicise the scheme and facilitate
online applications through the PMAY-U portal.

                                                Joint Secretary (Housing)`,
    relatedSchemeId: 3,
  },
  {
    id: 4,
    title: 'Revised Guidelines for Passport Seva Kendra — Appointment Booking Modernisation',
    department: 'Ministry of External Affairs',
    type: 'Circular',
    date: '2025-06-08',
    referenceNo: 'Q/PSK/2025/1123',
    summary: 'Passport Seva Kendra appointment booking system upgraded with real-time slot availability and Aadhaar-based pre-verification to reduce processing time at counters.',
    sampleContent: `Q/PSK/2025/1123
GOVERNMENT OF INDIA
MINISTRY OF EXTERNAL AFFAIRS
PASSPORT SEVA KENDRA

CIRCULAR

All Regional Passport Offices are informed that the appointment booking
system on the Passport Seva portal has been upgraded to display real-time
slot availability and enable Aadhaar-based pre-verification of applicant
data prior to the PSK visit, reducing average counter processing time.

                                                Joint Secretary (CPV Division)`,
    relatedSchemeId: null,
  },
  {
    id: 5,
    title: 'Digital Personal Data Protection Rules 2025 — Draft for Public Comment',
    department: 'Ministry of Electronics & IT',
    type: 'Act',
    date: '2025-06-05',
    referenceNo: 'CS-16/1/2025-CS-MeitY',
    summary: 'Draft Rules under the Digital Personal Data Protection Act, 2023 released for public consultation, covering consent management, data fiduciary obligations, and breach notification timelines.',
    sampleContent: `CS-16/1/2025-CS-MeitY
GOVERNMENT OF INDIA
MINISTRY OF ELECTRONICS & INFORMATION TECHNOLOGY

PUBLIC NOTICE

Draft Digital Personal Data Protection Rules, 2025 are placed in the
public domain for comments under Section 40 of the DPDP Act, 2023.
Stakeholders may submit comments through the MyGov portal within 30 days
of publication of this notice.

                                                Group Coordinator (Cyber Laws)`,
    relatedSchemeId: null,
  },
];

export const departments = [
  'Ministry of Agriculture', 'Ministry of Finance', 'Ministry of Health',
  'Ministry of Education', 'Ministry of Home Affairs', 'Ministry of Defence',
  'Ministry of External Affairs', 'Ministry of Railways', 'Ministry of Road Transport',
  'Ministry of Housing & Urban Affairs', 'Ministry of Electronics & IT',
  'Ministry of Rural Development', 'Ministry of Petroleum & Natural Gas',
];

export const recentActivity = [
  { action: 'Searched for', item: 'PM Kisan Samman Nidhi eligibility', time: '2 hours ago', icon: 'Search', route: '/user/schemes/pm-kisan-samman-nidhi' },
  { action: 'Bookmarked', item: 'Ayushman Bharat PM-JAY scheme', time: '1 day ago', icon: 'Bookmark', route: '/user/schemes/ayushman-bharat-pmjay' },
  { action: 'Generated RTI draft for', item: 'Road construction status query', time: '3 days ago', icon: 'FileText', route: '/user/rti-draft' },
  { action: 'Summarized document', item: 'DPDP Rules 2025 Draft', time: '4 days ago', icon: 'FileSearch', route: '/user/circulars/5' },
];


export const trendingSearches = [
  'PM Kisan installment date 2025',
  'Aadhaar update online procedure',
  'Voter ID correction Form 8',
  'Income Tax return filing deadline',
  'Caste certificate application Tamil Nadu',
  'Passport renewal documents required',
];

export const notifications = [
  { id: 1, text: 'New Government Order published by MHA', time: '2h ago', unread: true, route: '/user/circulars/4' },
  { id: 2, text: 'Your RTI draft was saved successfully', time: '5h ago', unread: true, route: '/user/rti-draft' },
  { id: 3, text: 'PM Scholarship scheme deadline extended', time: '1d ago', unread: true, route: '/user/schemes/national-scholarship-portal' },
];

export const adminStats = [
  { label: 'Total Users', value: '1,24,832', change: '+2.4%', icon: 'Users', color: 'blue' },
  { label: 'Active Today', value: '8,423', change: '+12%', icon: 'Activity', color: 'green' },
  { label: 'RTI Drafts Generated', value: '32,841', change: '+8%', icon: 'FileText', color: 'saffron' },
  { label: 'Documents Indexed', value: '2,84,563', change: '+1.2%', icon: 'Database', color: 'purple' },
];

export const adminUsers = [
  { id: 1, name: 'Priya Sharma', email: 'priya.sharma@example.com', role: 'User', state: 'Delhi', joined: '2024-11-01', status: 'Active', searches: 142 },
  { id: 2, name: 'Arjun Patel', email: 'arjun.patel@example.com', role: 'User', state: 'Gujarat', joined: '2024-10-15', status: 'Active', searches: 89 },
  { id: 3, name: 'Meena Krishnan', email: 'meena.k@example.com', role: 'Data Manager', state: 'Tamil Nadu', joined: '2024-09-20', status: 'Active', searches: 203 },
  { id: 4, name: 'Rajesh Verma', email: 'rajesh.v@example.com', role: 'User', state: 'Uttar Pradesh', joined: '2024-12-01', status: 'Inactive', searches: 12 },
  { id: 5, name: 'Anita Nair', email: 'anita.nair@example.com', role: 'Admin', state: 'Kerala', joined: '2024-08-10', status: 'Active', searches: 456 },
];

export const savedBookmarks = [
  { id: 1, title: 'Ayushman Bharat PM-JAY', type: 'Scheme', dept: 'Ministry of Health', saved: '2 days ago' },
  { id: 2, title: 'RTI Act 2005 — Full Text', type: 'Act', dept: 'Ministry of Personnel', saved: '5 days ago' },
  { id: 3, title: 'PM Kisan Samman Nidhi Details', type: 'Scheme', dept: 'Ministry of Agriculture', saved: '1 week ago' },
];

export const savedDrafts = [
  { id: 1, subject: 'Road construction status under PMGSY in my district', dept: 'Ministry of Rural Development', created: '3 days ago', status: 'Draft' },
  { id: 2, subject: 'Number of Aadhaar enrollments pending in Tamil Nadu', dept: 'UIDAI', created: '1 week ago', status: 'Draft' },
];

export const ocrQueue = [
  { id: 1, file: 'MoH_Circular_June2025.pdf', pages: 12, status: 'Completed', time: '2m 14s', indexed: true },
  { id: 2, file: 'PMAY_Guidelines_2025.pdf', pages: 48, status: 'Processing', time: '—', indexed: false },
  { id: 3, file: 'RTI_Responses_Batch_Q1.zip', pages: 234, status: 'Queued', time: '—', indexed: false },
  { id: 4, file: 'DPDP_Rules_Draft.pdf', pages: 31, status: 'Completed', time: '4m 52s', indexed: true },
];


// ---------------------------------------------------------------------------
// Unified Search Index — combines schemes + govDocuments + circularDetails +
// searchResults into one flat, searchable list with real routes so every
// search result / suggestion click lands on its correct detail page.
// ---------------------------------------------------------------------------
function buildSearchIndex() {
  const fromSchemes = schemes.map((s) => ({
    id: `scheme-${s.id}`,
    refId: s.slug || s.id,
    title: s.name,
    department: s.ministry,
    category: 'Scheme',
    type: 'Scheme',
    date: s.launched ? `${s.launched}-01-01` : '2024-01-01',
    summary: s.description,
    route: `/user/schemes/${s.slug || s.id}`,
    tags: [s.name, s.ministry, s.category, 'scheme', 'yojana'],
  }));

  const fromDocuments = govDocuments.map((d) => ({
    id: `doc-${d.id}`,
    refId: d.slug || d.id,
    title: d.title,
    department: d.department,
    category: d.category || 'Document',
    type: 'Document',
    date: '2025-01-01',
    summary: d.description,
    route: `/user/documents/${d.slug || d.id}`,
    tags: [d.title, d.department, d.category, 'document', 'certificate'],
  }));

  const fromCirculars = circularDetails.map((c) => ({
    id: `circular-${c.id}`,
    refId: c.id,
    title: c.title,
    department: c.department,
    category: 'Circular',
    type: 'Circular',
    date: c.date,
    summary: c.summary,
    route: `/user/circulars/${c.id}`,
    tags: [c.title, c.department, 'circular', 'government order', c.referenceNo],
  }));

  const fromGeneric = searchResults.map((r) => ({
    id: `generic-${r.id}`,
    refId: r.id,
    title: r.title,
    department: r.department,
    category: r.category,
    type: r.type,
    date: r.date,
    summary: r.summary,
    route: r.route || null,
    portalUrl: r.portalUrl || null,
    tags: [r.title, r.department, r.category, r.type],
  }));

  return [...fromSchemes, ...fromDocuments, ...fromCirculars, ...fromGeneric];
}

export const searchIndex = buildSearchIndex();

/**
 * Full-text search across the unified index. Matches title, department,
 * category and tags (case-insensitive, partial word match).
 */
export function searchAll(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  return searchIndex.filter((item) =>
    item.tags.filter(Boolean).some((tag) => String(tag).toLowerCase().includes(q)) ||
    item.title.toLowerCase().includes(q) ||
    (item.department || '').toLowerCase().includes(q)
  );
}

/**
 * Google-style autocomplete suggestions. For a matched base term (e.g.
 * "ration" → "Ration Card"), generates realistic variant suggestions such
 * as "Ration Card Tamil Nadu", "Ration Card Apply", "Ration Card Status".
 */
export function getSearchSuggestions(query, limit = 8) {
  const q = (query || '').trim().toLowerCase();
  if (!q || q.length < 2) return [];

  const matches = searchIndex.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.tags.filter(Boolean).some((t) => String(t).toLowerCase().includes(q))
  );

  const seenTitles = new Set();
  const suggestions = [];

  for (const item of matches) {
    if (seenTitles.has(item.title)) continue;
    seenTitles.add(item.title);

    suggestions.push({ text: item.title, route: item.route, icon: 'result' });
    if (suggestions.length >= limit) break;

    // Realistic variant suggestions (Tamil Nadu is the default demo state)
    const variants = ['Tamil Nadu', 'Apply', 'Status', 'Download Form'];
    for (const v of variants) {
      if (suggestions.length >= limit) break;
      suggestions.push({ text: `${item.title} ${v}`, route: item.route, icon: 'trend' });
    }
  }

  return suggestions.slice(0, limit);
}

export const popularSearchTerms = [
  'Ration Card', 'PM Kisan Samman Nidhi', 'Voter ID Card', 'Income Certificate',
  'Ayushman Bharat', 'Passport Renewal', 'Caste Certificate', 'RTI Act 2005',
  'Birth Certificate', 'Aadhaar Update', 'PM Awas Yojana', 'Scholarship Portal',
];

