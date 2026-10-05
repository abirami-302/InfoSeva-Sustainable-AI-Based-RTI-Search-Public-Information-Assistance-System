import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Pagination, BackNavigation } from '../../components/common';
import { usePagination } from '../../hooks/usePagination';
import { useDataManager } from '../../context/DataManagerContext';
import { toCitizenServiceCards } from '../../utils/dataManagerAdapter';
import {
  Search, FileText, Clock, ExternalLink, ChevronRight,
  BadgeCheck, List, X, Send, Loader2, HelpCircle,
  ArrowLeft, AlertCircle, ChevronDown, ChevronUp,
  Sparkles
} from 'lucide-react';

// ─── Service Data ──────────────────────────────────────────────────────────────

const SERVICES = [
  {
    id: 1,
    name: 'Income Certificate',
    category: 'Revenue',
    eligibility: 'Any Indian citizen or resident requiring proof of annual household income for scholarships, fee concessions, government welfare schemes, or subsidies.',
    documents: [
      'Aadhaar Card of Applicant & Family Head',
      'Ration Card / Smart Card / Family Card',
      'Salary Slip (last 3 months) or Employer Certificate / Self-Declaration Affidavit',
      'Bank Passbook (first page with IFSC & account number)',
      'Recent Passport Size Photograph'
    ],
    steps: [
      'Access your State e-District portal (or services.india.gov.in) or visit the nearest Tahsildar / Revenue office / CSC.',
      'Register with your mobile number & Aadhaar, then select "Issue of Income Certificate".',
      'Fill in applicant details, family member occupations, and declared annual income sources.',
      'Upload required proofs (Identity, Address, Income affidavit/slip) and pay the nominal statutory fee online.',
      'Upon field verification by the Village Administrative Officer (VAO) or Revenue Inspector, download the digitally signed certificate.'
    ],
    fee: 'Rs. 20 to Rs. 60 (Statutory + Portal charge)',
    processingTime: '7 to 15 working days',
    applyLink: 'https://services.india.gov.in',
    faqs: [
      { q: 'Who is eligible to apply for an Income Certificate?', a: 'Any resident citizen or household head who needs official proof of annual income for admissions, fee waivers, welfare subsidies, or bank loans.' },
      { q: 'What is the official validity period of an Income Certificate?', a: 'In most states across India, an Income Certificate is valid for 1 financial year (or 6 months in certain state jurisdictions) from the date of issue.' },
      { q: 'Can I apply if I do not have a formal salary slip?', a: 'Yes. Self-employed citizens, daily wage earners, and farmers can submit a notarized self-declaration income affidavit along with land/bank records.' },
      { q: 'Can I download the certificate online without visiting the Tahsildar office?', a: 'Yes. Once approved by the Revenue Authorities, a digitally signed certificate with a QR code can be directly downloaded from the state e-District portal.' },
      { q: 'What should I do if my application is rejected?', a: 'You can check the specific rejection reason on the portal, rectify missing documentation or discrepancies, and submit an appeal to the Sub-Collector / Revenue Divisional Officer (RDO).' }
    ],
  },
  {
    id: 2,
    name: 'Community / Caste Certificate',
    category: 'Revenue',
    eligibility: 'Citizens belonging to Scheduled Castes (SC), Scheduled Tribes (ST), Other Backward Classes (OBC), or Most Backward Classes (MBC) as recognized in Central or State gazette lists.',
    documents: [
      'Aadhaar Card of Applicant',
      "Parent's Caste / Community Certificate or School Transfer Certificate (TC)",
      'Ration Card / Proof of Residence',
      'Applicant School / College Transfer Certificate showing recorded community',
      'Passport Size Photograph'
    ],
    steps: [
      "Log in to the State e-District portal or submit at the Revenue Taluk / Tahsildar counter or CSC center.",
      'Submit Form for Community Certificate along with ancestral community proof.',
      'Revenue Inspector (RI) and Village Administrative Officer (VAO) conduct local and field verification.',
      'The Tahsildar / Zonal Deputy Tahsildar approves and signs the digital certificate.',
      'Download the verified Community Certificate from the portal or collect the physical smart copy.'
    ],
    fee: 'Rs. 20 to Rs. 50',
    processingTime: '10 to 30 working days',
    applyLink: 'https://edistrict.gov.in',
    faqs: [
      { q: 'What is the validity of a Community / Caste Certificate?', a: 'SC and ST certificates carry lifetime validity. Central OBC Non-Creamy Layer (NCL) certificates typically need to be renewed annually based on family income criteria.' },
      { q: 'What if my parents do not have a caste certificate?', a: 'You can submit caste proof of blood relatives (uncle, paternal grandparents), school transfer records of parents indicating caste, or gazette notices accompanied by a local inquiry affidavit.' },
      { q: 'Is a state caste certificate valid for Central Government jobs (UPSC, SSC, Railways)?', a: 'Central recruitment requires the certificate in the prescribed Government of India format (OBC-NCL / SC / ST Central Format), which can be issued based on your state certificate.' },
      { q: 'How can an employer or university verify the authenticity of this certificate?', a: 'Every digital Community Certificate includes a unique barcode and certificate number that can be authenticated 24/7 on the official state revenue verification portal.' }
    ],
  },
  {
    id: 3,
    name: 'Birth Certificate',
    category: 'Municipal',
    eligibility: 'Parents or legal guardians of a newborn, or any citizen born in India requiring birth registration under the Registration of Births and Deaths (RBD) Act.',
    documents: [
      'Hospital Discharge Summary or Institutional Birth Slip',
      'Aadhaar Cards of both Parents',
      'Marriage Certificate of Parents (if available)',
      'Proof of Birth Address / Informant ID Proof'
    ],
    steps: [
      'Institutional births are reported directly by the hospital to the local Registrar within 21 days.',
      'For home births, submit Form-1 to the local Municipal Health Officer or Village Panchayat Secretary within 21 days.',
      'Provide child name, parents details, and hospital discharge summary.',
      'Pay prescribed fees (free within 21 days; nominal delayed fee applies thereafter).',
      'Download the digitally signed birth certificate with QR code from crsorgi.gov.in or the municipal portal.'
    ],
    fee: 'Free within 21 days; Rs. 5 to Rs. 50 for delayed registration with Late Permission',
    processingTime: '1 to 7 working days',
    applyLink: 'https://crsorgi.gov.in',
    faqs: [
      { q: 'Is registration free of cost?', a: 'Yes, birth registration and the first copy of the birth certificate are completely free if registered within 21 days of birth.' },
      { q: 'What happens if the birth was not registered within 21 days?', a: 'Between 21 and 30 days: registered with late fee. Between 30 days and 1 year: requires written permission from the District Registrar. After 1 year: requires an order from an Executive Magistrate (SDM).' },
      { q: 'Can I add or update the child’s name later?', a: 'Yes, the child’s name can be added to the registered birth record online or at the municipality within 1 year without fee, and up to 15 years with a nominal statutory fee.' },
      { q: 'Is the digital certificate downloaded from crsorgi.gov.in legally valid everywhere?', a: 'Yes, under the Registration of Births and Deaths Amendment Act, digital certificates with QR codes are legally recognized for school admissions, passports, voter enrollment, and government jobs.' }
    ],
  },
  {
    id: 4,
    name: 'Death Certificate',
    category: 'Municipal',
    eligibility: 'Immediate next of kin, legal heirs, or authorized family representative of the deceased.',
    documents: [
      'Hospital Death Summary / Medical Certification of Cause of Death (MCCD Form 4/4A)',
      'Aadhaar Card of Deceased & Informant',
      'Burial / Cremation Ground Receipt',
      'Address Proof of Deceased'
    ],
    steps: [
      'Report death to the Registrar of Births and Deaths within 21 days of occurrence.',
      'Submit Form-2 along with doctor certificate and cremation/burial slip.',
      'Registrar verifies the particulars in the municipal death register.',
      'Digitally signed certificate is generated and issued.',
      'Download the online certificate from the Civil Registration System portal.'
    ],
    fee: 'Free within 21 days; Rs. 10 to Rs. 50 for delayed registration',
    processingTime: '1 to 7 working days',
    applyLink: 'https://crsorgi.gov.in',
    faqs: [
      { q: 'Why is a Death Certificate mandatory?', a: 'It is required to claim life insurance, settle bank accounts, claim pensions, transfer real estate/patta title, and obtain legal heir certificates.' },
      { q: 'What if death occurred at home without medical attendance?', a: 'The local Village Administrative Officer (VAO), Panchayat Secretary, or registered medical practitioner must inspect, verify death circumstances, and issue a certification to the Registrar.' },
      { q: 'Can multiple original copies of a Death Certificate be obtained?', a: 'Yes, certified extracts/copies can be requested anytime online or at the municipal office by providing the registration number and paying nominal search fees.' }
    ],
  },
  {
    id: 5,
    name: 'Driving Licence (LL & Permanent DL)',
    category: 'Transport',
    eligibility: 'Age 16+ for gearless two-wheelers up to 50cc; Age 18+ for light motor vehicles (cars/bikes with gear); Age 20+ for transport/commercial vehicles.',
    documents: [
      'Aadhaar Card / Voter ID / Passport (Address & Identity proof)',
      'Class 10 Marksheet or Birth Certificate (Age proof)',
      'Medical Fitness Form 1 & Form 1A (certified by MBBS doctor for age 50+ or commercial)',
      'Recent Passport Size Photos',
      'Valid Learner Licence (LL) for Permanent DL application'
    ],
    steps: [
      'Apply online for Learner Licence on Sarathi Parivahan (sarathi.parivahan.gov.in) with Aadhaar e-KYC.',
      'Appear for the online/computer-based road safety and traffic sign test.',
      'Download Learner Licence immediately upon clearing the test.',
      'After 30 days (and within 6 months), book a slot for the practical driving test on the Sarathi portal.',
      'Bring your vehicle, documents, and attend the RTO track test; DL is dispatched by speed post upon passing.'
    ],
    fee: 'Learner Licence: Rs. 150-200; Driving Licence Test & Smart Card: Rs. 400-600',
    processingTime: 'Learner Licence: Same day; Permanent DL: 7 to 15 working days post test',
    applyLink: 'https://sarathi.parivahan.gov.in',
    faqs: [
      { q: 'Can I take the Learner Licence test from home?', a: 'Yes, if you choose Aadhaar authentication on Sarathi Parivahan, you can take the computer-based LL test online from home via proctored webcam in most states.' },
      { q: 'How soon can I apply for the permanent driving licence after getting an LL?', a: 'You can apply 30 days after the issue of the Learner Licence, but before its 6-month validity expires.' },
      { q: 'What is the validity of a permanent driving licence?', a: 'For non-transport vehicles, DL is valid for 20 years from the date of issue or until the holder reaches the age of 40 (whichever comes earlier), after which periodic renewal applies.' },
      { q: 'Can I carry my Driving Licence on my mobile phone?', a: 'Yes, driving licences saved in the official DigiLocker or mParivahan app are legally valid under the Motor Vehicles Act and must be accepted by traffic police.' }
    ],
  },
  {
    id: 6,
    name: 'Ration Card / Smart Family Card',
    category: 'Revenue',
    eligibility: 'Head of family who is an Indian citizen residing in the state, not enrolled in another active ration card.',
    documents: [
      'Aadhaar Cards of all family members',
      'Proof of Residence (Electricity Bill / Gas Connection / Rent Agreement / Water Bill)',
      'Passport size photo of Head of Family (usually senior female member)',
      'Income Certificate / BPL proof (for Priority Household / Antyodaya cards)'
    ],
    steps: [
      'Register on the State Food & Civil Supplies Department portal (or NFSA portal nfsa.gov.in).',
      'Select "Apply for New Smart Card / Ration Card" and choose family card type (PHH / NPHH / AAY).',
      'Enter family member Aadhaar details, gas connection details, and residential address.',
      'Upload required documents and submit the application.',
      'Supply Officer or Taluk Supply Officer (TSO) conducts verification; card is delivered or available for download.'
    ],
    fee: 'Free (or Rs. 20 to Rs. 50 nominal smart card printing fee)',
    processingTime: '15 to 30 working days',
    applyLink: 'https://nfsa.gov.in',
    faqs: [
      { q: 'Who is designated as the head of the family on a Ration Card?', a: 'Under the National Food Security Act (NFSA), the eldest woman aged 18 years or above in the household is recognized as the head of the family for ration card issuance.' },
      { q: 'What is "One Nation One Ration Card" (ONORC)?', a: 'ONORC enables migrant beneficiaries to collect their entitled foodgrains from any Fair Price Shop (FPS) anywhere in India using biometric Aadhaar authentication.' },
      { q: 'Can I add or remove a family member after card issuance?', a: 'Yes, additions (marriage/child birth) and removals (marriage/death) can be performed online on your state food portal using Aadhaar and birth/marriage/death certificates.' },
      { q: 'What is the difference between Priority (PHH) and Non-Priority (NPHH) cards?', a: 'Priority households receive subsidized foodgrains under NFSA; Non-Priority households generally receive commodities without central subsidy or use the card as identity/residence proof.' }
    ],
  },
  {
    id: 7,
    name: 'Patta Transfer / Land Title Mutation',
    category: 'Revenue',
    eligibility: 'Property buyers, legal heirs, gift deed recipients, or court decree holders holding registered title documents.',
    documents: [
      'Registered Sale Deed / Gift Deed / Settlement Deed / Partition Deed',
      'Previous Patta copy / Chitta extract',
      'Encumbrance Certificate (EC) for the property period',
      'Aadhaar Card and PAN Card of current owner/buyer',
      'Latest Property / Land Tax Receipt'
    ],
    steps: [
      'Submit mutation application on the State Land Records e-services portal (or at the Sub-Registrar / Tahsildar office).',
      'Upload deed details, survey numbers, subdivision particulars, and boundary maps.',
      'Village Administrative Officer (VAO) and Land Surveyor inspect the land boundaries.',
      'Tahsildar approves modification in the official Land Revenue Records (A-Register / Chitta).',
      'Download updated digital Patta extract online with new ownership title.'
    ],
    fee: 'Rs. 60 to Rs. 400 (varies if subdivision survey is required)',
    processingTime: '15 to 45 working days',
    applyLink: 'https://services.india.gov.in',
    faqs: [
      { q: 'What is the distinction between a Sale Deed and a Patta?', a: 'A Sale Deed is an agreement transferring ownership between buyer and seller; a Patta is the government revenue record confirming your name as owner in official state land records.' },
      { q: 'When is a land survey / subdivision mandatory for Patta transfer?', a: 'If you buy a portion of a larger land parcel with a shared survey number, a subdivision survey is required. If buying the entire plot under an existing subdivision, it is a simple name transfer.' },
      { q: 'Can Patta mutation be applied automatically during property registration?', a: 'In many states with integrated registration and revenue portals, auto-mutation is initiated immediately upon deed registration at the Sub-Registrar office.' }
    ],
  },
  {
    id: 8,
    name: 'Voter ID Card / EPIC Enrollment',
    category: 'Services',
    eligibility: 'Indian citizens who have reached or will reach 18 years of age on the qualifying date (Jan 1, Apr 1, Jul 1, Oct 1) and reside in the constituency.',
    documents: [
      'Proof of Age (Birth Certificate / Aadhaar / PAN / 10th Certificate)',
      'Proof of Current Residence (Aadhaar / Utility Bill / Bank Passbook / Passport)',
      'One recent passport size color photo',
      'EPIC number of an existing family member in the same constituency (optional but helps polling station assignment)'
    ],
    steps: [
      'Visit the Election Commission of India Voter Services Portal (voters.eci.gov.in) or EC Voter Helpline app.',
      'Fill Form 6 for new voter enrollment with personal details and assembly constituency.',
      'Upload age and address proofs and submit.',
      'Booth Level Officer (BLO) performs field verification at your residential address.',
      'EPIC number is generated; e-EPIC can be downloaded immediately, and smart card is dispatched via Speed Post free of cost.'
    ],
    fee: 'Completely Free of cost (issued by Election Commission of India)',
    processingTime: '15 to 30 working days',
    applyLink: 'https://voters.eci.gov.in',
    faqs: [
      { q: 'Can I download a digital copy of my Voter ID card?', a: 'Yes! You can download the e-EPIC (a secure, non-editable PDF with QR code) from voters.eci.gov.in, which is fully valid for voting and identity verification.' },
      { q: 'How can I change my address or constituency if I relocate?', a: 'Submit Form 8 online on the Voter Services portal for shifting of residence or correction of existing voter details.' },
      { q: 'Do I need to pay any courier or card fee for the physical Voter ID?', a: 'No. The Election Commission of India prints and dispatches the color PVC Voter ID card through India Post free of charge.' }
    ],
  },
  {
    id: 9,
    name: 'PAN Card (New Instant e-PAN / NSDL)',
    category: 'Finance',
    eligibility: 'Any individual Indian citizen or taxpayer requiring a Permanent Account Number for financial, banking, and tax purposes.',
    documents: [
      'Aadhaar Card (with active mobile linked for OTP e-KYC)',
      'For physical non-Aadhaar route: Proof of Identity, Proof of Address, Proof of Date of Birth, 2 Photos'
    ],
    steps: [
      'For Instant e-PAN (Free, 10 mins): Visit Income Tax e-Filing portal (incometax.gov.in), enter Aadhaar number, verify OTP.',
      'Instant e-PAN is generated and digitally signed within 10 minutes.',
      'For physical PVC PAN Card: Apply on Protean (NSDL) or UTIITSL portal via Form 49A.',
      'Complete online payment and e-Sign using Aadhaar OTP.',
      'Physical PAN card is delivered by India Post to your Aadhaar address within 7 to 15 days.'
    ],
    fee: 'Instant e-PAN: Free; Physical PVC PAN Card: Rs. 50 (e-KYC) to Rs. 107 (online application)',
    processingTime: 'Instant e-PAN: 10 minutes; Physical card: 7 to 15 working days',
    applyLink: 'https://www.onlineservices.nsdl.com',
    faqs: [
      { q: 'Is the free instant e-PAN as valid as the physical PAN card?', a: 'Yes. An Instant e-PAN is an authentic 10-character alphanumeric PAN issued by the Income Tax Department and has the exact same legal validity for all banking and official transactions.' },
      { q: 'Can a minor apply for a PAN card?', a: 'Yes. Parents or guardians can apply on behalf of a minor using Form 49A. The minor’s photo and signature are updated upon turning 18.' },
      { q: 'Is linking Aadhaar with PAN mandatory?', a: 'Yes, it is mandatory under Section 139AA of the Income Tax Act for all taxpayers holding a PAN.' }
    ],
  },
  {
    id: 10,
    name: 'Marriage Certificate Registration',
    category: 'Municipal',
    eligibility: 'Bridegroom aged 21 or above and Bride aged 18 or above, married under the Special Marriage Act, Hindu Marriage Act, or Anand Marriage Act.',
    documents: [
      'Proof of Marriage (Wedding Invitation Card / Temple or Church or Nikahnama Certificate)',
      'Age and Address proof of both parties (Aadhaar / Passport / 10th certificate)',
      'Joint photograph of Bride and Groom in wedding attire',
      'Affidavit of marital status and citizenship',
      'Identity and Address proof of 3 witnesses'
    ],
    steps: [
      'Apply online on the State Inspector General of Registration (IGRS) portal or visit the Sub-Registrar Office in whose jurisdiction either spouse resides.',
      'Fill in bride, groom, and marriage ceremony details, and book an appointment slot.',
      'Both spouses and 3 witnesses appear in person before the Sub-Registrar on the appointment date.',
      'Sign the marriage register in presence of the Registrar officer.',
      'Marriage Certificate is issued immediately or downloadable within 3 days.'
    ],
    fee: 'Rs. 100 to Rs. 250 (varies by state and Act)',
    processingTime: 'Same day of appointment (or within 3 to 7 working days)',
    applyLink: 'https://services.india.gov.in',
    faqs: [
      { q: 'Why is a Marriage Certificate necessary?', a: 'It is essential for spouse visa applications, passport spouse surname endorsement, joint bank accounts, health insurance claims, and life insurance nominee settlement.' },
      { q: 'Can we register a marriage several years after the wedding took place?', a: 'Yes, marriages can be registered anytime post-wedding under the applicable personal marriage act with wedding photos, invitation, and witness affidavits.' },
      { q: 'Are witnesses mandatory during marriage registration?', a: 'Yes, three adult witnesses who attended the wedding ceremony must be physically present with valid photo identity proofs.' }
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_COLOR = {
  Revenue: 'bg-blue-50 text-gov-blue',
  Municipal: 'bg-green-50 text-green-700',
  Transport: 'bg-orange-50 text-gov-saffron',
  Services: 'bg-indigo-50 text-indigo-700',
  Finance: 'bg-emerald-50 text-emerald-700',
};

async function callInfoSevaAI(prompt, serviceName) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);
  try {
    const res = await fetch('http://localhost:8000/api/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: prompt,
        language: 'English',
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    const data = await res.json();
    return data.answer || `Here is the official guidance for ${serviceName}.`;
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('InfoSeva AI call error:', err);
    throw err;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ServiceCard({ service, isSelected, onClick }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`card p-4 text-left w-full group transition-all ${isSelected ? 'border-gov-blue ring-1 ring-gov-blue' : 'hover:border-gov-blue/30'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${CATEGORY_COLOR[service.category] || 'bg-gray-100 text-gray-500'}`}>
            {service.category}
          </span>
          <p className={`text-sm font-semibold mt-2 transition-colors ${isSelected ? 'text-gov-blue' : 'text-gray-800 group-hover:text-gov-blue'}`}>
            {service.name}
          </p>
        </div>
        <ChevronRight size={16} className={`flex-shrink-0 mt-1 transition-colors ${isSelected ? 'text-gov-blue' : 'text-gray-300 group-hover:text-gov-blue'}`} />
      </div>
      <div className="flex items-center gap-3 mt-3">
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Clock size={11} /> {service.processingTime}
        </span>
      </div>
    </motion.button>
  );
}

function AIServiceExpert({ service }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hello! I am the AI Service Expert for ${service.name}. Ask me anything about eligibility, documents, fees, or the application process.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        text: `Hello! I am the AI Service Expert for ${service.name}. Ask me anything about eligibility, documents, fees, or the application process.`,
      },
    ]);
    setInput('');
  }, [service.id, service.name]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setLoading(true);
    try {
      const prompt = `Service: ${service.name} (${service.category} Department)
Eligibility: ${service.eligibility}
Documents Required: ${service.documents.join(', ')}
Application Steps: ${service.steps.join(' | ')}
Fee: ${service.fee}
Processing Time: ${service.processingTime}
Apply Portal: ${service.applyLink}

Citizen Query: "${q}"

Please provide an accurate, clear, and helpful response for this specific Indian government service. If the citizen is missing any specific document, suggest valid government alternatives.`;
      const answer = await callInfoSevaAI(prompt, service.name);
      setMessages((prev) => [...prev, { role: 'assistant', text: answer }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'I am temporarily unable to connect to the AI service. Please ensure the backend AI service is running on port 8000.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <div className="bg-gov-blue px-4 py-3 flex items-center gap-2">
        <Sparkles size={15} className="text-white" />
        <span className="text-white text-sm font-semibold">AI Service Expert</span>
        <span className="ml-auto text-[10px] text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
          {service.name}
        </span>
      </div>
      <div className="h-64 overflow-y-auto p-3 space-y-3 bg-gray-50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-gov-blue text-white' : 'bg-white border border-gray-100 text-gray-700 shadow-sm'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm flex items-center gap-2 text-xs text-gray-500">
              <Loader2 size={14} className="animate-spin text-gov-blue" />
              <span>Consulting InfoSeva AI Knowledge Base...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 p-3 border-t border-gray-100 bg-white">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ask about eligibility, documents, fee, alternatives..."
          className="input-field flex-1 py-2 text-sm"
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          className="btn-primary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

function FAQSection({ service }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="border border-gray-100 rounded-xl p-4 bg-white">
      <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3">
        <HelpCircle size={15} className="text-gov-saffron" /> Frequently Asked Questions ({service.name})
      </h4>
      <p className="text-xs text-gray-500 mb-4">
        Verified citizen answers, validity guidelines, appeal mechanisms, and document exemptions.
      </p>
      <div className="space-y-2.5">
        {service.faqs && service.faqs.length > 0 ? (
          service.faqs.map((faq, i) => (
            <div key={i} className="border border-gray-150 rounded-lg overflow-hidden transition-all bg-gray-50/50">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-3 px-3.5 py-3 text-left hover:bg-gray-100/70 transition-colors"
              >
                <span className="text-sm font-medium text-gray-800 leading-snug">{faq.q}</span>
                {open === i ? <ChevronUp size={15} className="text-gov-blue flex-shrink-0" /> : <ChevronDown size={15} className="text-gray-400 flex-shrink-0" />}
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <p className="px-3.5 pb-3.5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-2.5 bg-white">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-400">No FAQs available for this service yet.</p>
        )}
      </div>
    </div>
  );
}

function ServiceDetail({ service, onClose }) {
  const [tab, setTab] = useState('info');

  const tabs = [
    { id: 'info', label: 'Details' },
    { id: 'ai', label: 'AI Expert' },
    { id: 'faq', label: 'FAQs & Rules' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="card overflow-hidden sticky top-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between p-5 pb-3">
        <div>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${CATEGORY_COLOR[service.category] || 'bg-gray-100 text-gray-500'}`}>
            {service.category}
          </span>
          <h3 className="text-base font-bold text-gray-800 mt-1.5">{service.name}</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors ml-2">
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-100 px-5 gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`text-xs font-semibold pb-2 px-3 border-b-2 whitespace-nowrap transition-colors ${tab === t.id ? 'border-gov-blue text-gov-blue' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">

        {tab === 'info' && (
          <>
            <div className="bg-green-50 rounded-xl p-3.5 flex items-start gap-2.5">
              <BadgeCheck size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[11px] font-bold uppercase text-green-900 tracking-wider">Eligibility Criteria</p>
                <p className="text-xs text-green-800 leading-relaxed mt-0.5">{service.eligibility}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText size={13} className="text-gov-blue" /> Mandatory & Supporting Documents
              </p>
              <ul className="space-y-1.5 bg-gray-50 p-3 rounded-xl border border-gray-100">
                {service.documents.map((doc, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gov-blue flex-shrink-0" /> {doc}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <List size={13} className="text-gov-blue" /> Step-by-Step Procedure
              </p>
              <ol className="space-y-2">
                {service.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-gov-blue text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-xs text-gray-600 leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Fee</p>
                <p className="text-sm font-semibold text-gray-800">{service.fee}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Processing Time</p>
                <p className="text-sm font-semibold text-gray-800">{service.processingTime}</p>
              </div>
            </div>
            <a
              href={service.applyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              Apply on Official Portal <ExternalLink size={14} />
            </a>
          </>
        )}

        {tab === 'ai' && <AIServiceExpert service={service} />}
        {tab === 'faq' && <FAQSection service={service} />}

      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ApplyServices() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);

  const { manualRecords, bulkRecords, apiRecords } = useDataManager();
  const allServices = useMemo(() => {
    return [...SERVICES, ...toCitizenServiceCards({ manualRecords, bulkRecords, apiRecords })];
  }, [manualRecords, bulkRecords, apiRecords]);

  const filtered = query.trim()
    ? allServices.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.category.toLowerCase().includes(query.toLowerCase())
      )
    : allServices;

  const { page, setPage, pageItems: pagedServices } = usePagination(filtered, 8);

  return (
    <div className="space-y-6">
      {/* Dual Back Navigation */}
      <BackNavigation dashboardPath="/user" />

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/user/government-services')}
          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gov-blue hover:border-gov-blue transition-colors"
        >
          <ArrowLeft size={17} />
        </button>
        <div>
          <h2 className="font-bold text-gray-800 text-lg">Apply and Services</h2>
          <p className="text-xs text-gray-400">Find any service and get AI-guided step-by-step assistance</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search: Income Certificate, Driving Licence, Birth Certificate..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
          className="input-field w-full pl-11 py-3"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setSelected(null); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Grid + Detail */}
      <div className={`grid gap-5 ${selected ? 'lg:grid-cols-5' : 'lg:grid-cols-3'}`}>

        {/* Cards */}
        <div className={selected ? 'lg:col-span-2' : 'lg:col-span-3'}>
          {filtered.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {pagedServices.map((s) => (
                <ServiceCard
                  key={s.id}
                  service={s}
                  isSelected={selected?.id === s.id}
                  onClick={() => setSelected(selected?.id === s.id ? null : s)}
                />
              ))}
            </div>
          ) : (
            <div className="card p-10 text-center">
              <AlertCircle size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">No service found for "{query}"</p>
              <p className="text-xs text-gray-400 mt-1">Try: Income Certificate, Patta, Birth Certificate, Driving Licence</p>
            </div>
          )}
          {filtered.length > 0 && <Pagination page={page} totalItems={filtered.length} pageSize={8} onPageChange={setPage} />}
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selected && (
            <div className="lg:col-span-3">
              <ServiceDetail service={selected} onClose={() => setSelected(null)} />
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}