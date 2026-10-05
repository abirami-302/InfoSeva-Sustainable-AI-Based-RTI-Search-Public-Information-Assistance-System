import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  CheckCircle, Copy, Download, Save, Edit3, Loader, User, Building2,
  FileText, ClipboardList, ArrowRight, ArrowLeft, AlertCircle,
} from 'lucide-react';
import { PageHeader, BackNavigation } from '../../components/common';
import { departments } from '../../data/dummyData';

// ── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 0, label: 'Applicant Details', icon: User },
  { id: 1, label: 'Department', icon: Building2 },
  { id: 2, label: 'Information Required', icon: ClipboardList },
  { id: 3, label: 'Review & Generate', icon: FileText },
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman & Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli & Daman & Diu',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const MINISTRIES = [
  'Ministry of Agriculture & Farmers Welfare',
  'Ministry of Chemicals & Fertilizers',
  'Ministry of Civil Aviation',
  'Ministry of Commerce & Industry',
  'Ministry of Communications',
  'Ministry of Consumer Affairs, Food & Public Distribution',
  'Ministry of Cooperation',
  'Ministry of Culture',
  'Ministry of Defence',
  'Ministry of Earth Sciences',
  'Ministry of Education',
  'Ministry of Electronics & Information Technology',
  'Ministry of Environment, Forest & Climate Change',
  'Ministry of External Affairs',
  'Ministry of Finance',
  'Ministry of Fisheries, Animal Husbandry & Dairying',
  'Ministry of Food Processing Industries',
  'Ministry of Health & Family Welfare',
  'Ministry of Heavy Industries',
  'Ministry of Home Affairs',
  'Ministry of Housing & Urban Affairs',
  'Ministry of Information & Broadcasting',
  'Ministry of Jal Shakti',
  'Ministry of Labour & Employment',
  'Ministry of Law & Justice',
  'Ministry of Micro, Small & Medium Enterprises',
  'Ministry of Mines',
  'Ministry of New & Renewable Energy',
  'Ministry of Panchayati Raj',
  'Ministry of Petroleum & Natural Gas',
  'Ministry of Ports, Shipping & Waterways',
  'Ministry of Power',
  'Ministry of Railways',
  'Ministry of Road Transport & Highways',
  'Ministry of Rural Development',
  'Ministry of Science & Technology',
  'Ministry of Skill Development & Entrepreneurship',
  'Ministry of Social Justice & Empowerment',
  'Ministry of Statistics & Programme Implementation',
  'Ministry of Steel',
  'Ministry of Textiles',
  'Ministry of Tourism',
  'Ministry of Tribal Affairs',
  'Ministry of Women & Child Development',
  'Ministry of Youth Affairs & Sports',
];

const INITIAL_FORM = {
  // Step 0
  name: '', fatherName: '', gender: 'Male', category: 'General',
  address: '', city: '', state: '', pincode: '', phone: '', email: '',
  applicantType: 'Citizen',
  // Step 1
  dept: '', ministry: '', publicAuthority: '',
  // Step 2
  subject: '', details: '', period: '', format: 'certified copy', language: 'English',
};

// ── Draft Generation ─────────────────────────────────────────────────────────

function generateDraft(form) {
  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  return `To,
The Public Information Officer,
${form.publicAuthority || form.dept},
${form.ministry}

Subject: Application under Section 6(1) of the Right to Information Act, 2005 — ${form.subject}

Respected Sir/Madam,

I, ${form.name}, ${form.gender === 'Male' ? 'son' : form.gender === 'Female' ? 'daughter' : 'child'} of ${form.fatherName}, residing at ${form.address}, ${form.city}, ${form.state} — ${form.pincode}, hereby request information under Section 6(1) of the Right to Information Act, 2005.

Category: ${form.category} | Applicant Type: ${form.applicantType}

INFORMATION REQUIRED:

${form.details}

Period to which information pertains: ${form.period}

I wish to receive the information in the form of ${form.format}.
Preferred language: ${form.language}

I am enclosing the application fee of ₹10/- by way of Indian Postal Order / Court Fee Stamp as required under the Act.

If the required information is not available with your office, kindly transfer this application to the concerned Public Information Officer under Section 6(3) of the RTI Act, 2005 and inform me accordingly.

Yours faithfully,

${form.name}
${form.address}, ${form.city}, ${form.state} — ${form.pincode}
Phone: ${form.phone}
Email: ${form.email}
Date: ${today}`;
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateStep(step, form) {
  const errors = {};

  if (step === 0) {
    if (!form.name.trim()) errors.name = 'Full name is required';
    else if (form.name.trim().length < 3) errors.name = 'Name must be at least 3 characters';

    if (!form.fatherName.trim()) errors.fatherName = "Father's / Spouse's name is required";

    if (!form.phone.trim()) errors.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(form.phone.replace(/\s/g, '')))
      errors.phone = 'Enter a valid 10-digit mobile number';

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = 'Enter a valid email address';

    if (!form.address.trim()) errors.address = 'Full address is required';
    if (!form.city.trim()) errors.city = 'City / Town is required';
    if (!form.state) errors.state = 'Please select your state';

    if (!form.pincode.trim()) errors.pincode = 'PIN code is required';
    else if (!/^\d{6}$/.test(form.pincode.replace(/\s/g, '')))
      errors.pincode = 'Enter a valid 6-digit PIN code';
  }

  if (step === 1) {
    if (!form.dept) errors.dept = 'Please select a department';
    if (!form.ministry) errors.ministry = 'Please select a ministry';
  }

  if (step === 2) {
    if (!form.subject.trim()) errors.subject = 'Subject of RTI is required';
    else if (form.subject.trim().length < 10)
      errors.subject = 'Subject must be at least 10 characters';

    if (!form.details.trim()) errors.details = 'Details of information required';
    else if (form.details.trim().length < 20)
      errors.details = 'Please describe the information needed in more detail (min 20 characters)';

    if (!form.period.trim()) errors.period = 'Time period is required';
  }

  return errors;
}

// ── Field Error ───────────────────────────────────────────────────────────────

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
      <AlertCircle size={11} /> {msg}
    </p>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function GenerateRTIDraft() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState('');
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const update = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    // Clear field error on change
    if (errors[key]) setErrors((prev) => { const e = { ...prev }; delete e[key]; return e; });
  };

  // ── Navigate steps with validation ────────────────────────────────────────

  const handleNext = () => {
    const errs = validateStep(step, form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep((s) => s + 1);
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setDraft(generateDraft(form));
      setGenerated(true);
      setGenerating(false);
    }, 1800);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Download PDF (dummy — uses browser print) ──────────────────────────────

  const handleDownloadPDF = () => {
    const win = window.open('', '_blank');
    if (!win) {
      toast.error('Please allow pop-ups to download the PDF.');
      return;
    }
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>RTI Draft — ${form.subject}</title>
          <style>
            body { font-family: 'Times New Roman', serif; margin: 40px; line-height: 1.8; font-size: 13pt; color: #111; }
            pre { white-space: pre-wrap; font-family: 'Times New Roman', serif; font-size: 13pt; }
            @media print { body { margin: 30px; } button { display: none; } }
          </style>
        </head>
        <body>
          <pre>${draft.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          <br/><br/>
          <button onclick="window.print(); window.close();" style="background:#003087;color:#fff;border:none;padding:10px 24px;cursor:pointer;font-size:13pt;border-radius:4px;">
            🖨️ Print / Save as PDF
          </button>
        </body>
      </html>
    `);
    win.document.close();
    toast.success('PDF ready — use "Save as PDF" in the print dialog.');
  };

  // ── Save Draft ────────────────────────────────────────────────────────────

  const handleSaveDraft = () => {
    setSaving(true);
    setTimeout(() => {
      try {
        const existing = JSON.parse(localStorage.getItem('rtiDrafts') || '[]');
        const newDraft = {
          id: Date.now(),
          subject: form.subject || 'Untitled RTI Draft',
          dept: form.dept || form.ministry || 'Unknown Department',
          created: 'Just now',
          status: 'Draft',
          content: draft,
          form,
        };
        localStorage.setItem('rtiDrafts', JSON.stringify([newDraft, ...existing]));
        toast.success('Draft saved successfully! View it in Saved Items.');
      } catch {
        toast.error('Could not save draft. Please try again.');
      }
      setSaving(false);
    }, 600);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Dual Back Navigation */}
      <BackNavigation dashboardPath="/user" />

      <PageHeader
        title="Generate RTI Draft"
        subtitle="Fill in your details and we'll generate a professional RTI application in seconds."
      />

      {/* Stepper */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => i < step && setStep(i)}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors
                    ${generated ? 'bg-gov-green text-white' : step > i ? 'bg-gov-green text-white' : step === i ? 'bg-gov-blue text-white' : 'bg-gray-100 text-gray-400'}`}
                >
                  {generated || step > i ? <CheckCircle size={16} /> : <s.icon size={16} />}
                </div>
                <span
                  className={`text-xs font-medium hidden md:block ${step >= i ? 'text-gray-800' : 'text-gray-400'}`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${step > i || generated ? 'bg-gov-green' : 'bg-gray-200'}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Form Steps */}
      <AnimatePresence mode="wait">
        {!generated && (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="card p-6 space-y-4"
          >
            {/* ── Step 0: Applicant Details ───────────────────────────── */}
            {step === 0 && (
              <>
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <User size={16} className="text-gov-blue" /> Applicant Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">
                      Full Name *
                    </label>
                    <input
                      className={`input-field ${errors.name ? 'border-red-400' : ''}`}
                      placeholder="As per Aadhaar / official records"
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                    />
                    <FieldError msg={errors.name} />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">
                      Father's / Spouse's Name *
                    </label>
                    <input
                      className={`input-field ${errors.fatherName ? 'border-red-400' : ''}`}
                      placeholder="S/o or D/o or W/o"
                      value={form.fatherName}
                      onChange={(e) => update('fatherName', e.target.value)}
                    />
                    <FieldError msg={errors.fatherName} />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">
                      Gender *
                    </label>
                    <select
                      className="input-field"
                      value={form.gender}
                      onChange={(e) => update('gender', e.target.value)}
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Transgender</option>
                      <option>Prefer not to say</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">
                      Category *
                    </label>
                    <select
                      className="input-field"
                      value={form.category}
                      onChange={(e) => update('category', e.target.value)}
                    >
                      <option>General</option>
                      <option>OBC</option>
                      <option>SC</option>
                      <option>ST</option>
                      <option>BPL (Below Poverty Line)</option>
                      <option>EWS</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">
                      Phone Number *
                    </label>
                    <input
                      className={`input-field ${errors.phone ? 'border-red-400' : ''}`}
                      placeholder="10-digit mobile number"
                      value={form.phone}
                      maxLength={10}
                      onChange={(e) => update('phone', e.target.value.replace(/\D/g, ''))}
                    />
                    <FieldError msg={errors.phone} />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className={`input-field ${errors.email ? 'border-red-400' : ''}`}
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                    />
                    <FieldError msg={errors.email} />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">
                      Full Address *
                    </label>
                    <textarea
                      className={`input-field resize-none ${errors.address ? 'border-red-400' : ''}`}
                      rows={2}
                      placeholder="Door no., Street, Area"
                      value={form.address}
                      onChange={(e) => update('address', e.target.value)}
                    />
                    <FieldError msg={errors.address} />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">
                      City / Town *
                    </label>
                    <input
                      className={`input-field ${errors.city ? 'border-red-400' : ''}`}
                      placeholder="City"
                      value={form.city}
                      onChange={(e) => update('city', e.target.value)}
                    />
                    <FieldError msg={errors.city} />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">
                      State *
                    </label>
                    <select
                      className={`input-field ${errors.state ? 'border-red-400' : ''}`}
                      value={form.state}
                      onChange={(e) => update('state', e.target.value)}
                    >
                      <option value="">Select state...</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <FieldError msg={errors.state} />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">
                      PIN Code *
                    </label>
                    <input
                      className={`input-field ${errors.pincode ? 'border-red-400' : ''}`}
                      placeholder="6-digit PIN"
                      maxLength={6}
                      value={form.pincode}
                      onChange={(e) => update('pincode', e.target.value.replace(/\D/g, ''))}
                    />
                    <FieldError msg={errors.pincode} />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">
                      Applicant Type
                    </label>
                    <select
                      className="input-field"
                      value={form.applicantType}
                      onChange={(e) => update('applicantType', e.target.value)}
                    >
                      <option>Citizen</option>
                      <option>NGO / Civil Society</option>
                      <option>Journalist</option>
                      <option>Advocate</option>
                      <option>Researcher</option>
                      <option>Others</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* ── Step 1: Department ──────────────────────────────────── */}
            {step === 1 && (
              <>
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Building2 size={16} className="text-gov-blue" /> Department Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">
                      Department *
                    </label>
                    <select
                      className={`input-field ${errors.dept ? 'border-red-400' : ''}`}
                      value={form.dept}
                      onChange={(e) => update('dept', e.target.value)}
                    >
                      <option value="">Select department...</option>
                      {departments.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                    <FieldError msg={errors.dept} />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">
                      Ministry *
                    </label>
                    <select
                      className={`input-field ${errors.ministry ? 'border-red-400' : ''}`}
                      value={form.ministry}
                      onChange={(e) => update('ministry', e.target.value)}
                    >
                      <option value="">Select ministry...</option>
                      {MINISTRIES.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                    <FieldError msg={errors.ministry} />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">
                      Public Authority / Office (optional)
                    </label>
                    <input
                      className="input-field"
                      placeholder="e.g., Office of the District Collector, Chennai"
                      value={form.publicAuthority}
                      onChange={(e) => update('publicAuthority', e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* ── Step 2: Information Required ──────────────────────── */}
            {step === 2 && (
              <>
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <ClipboardList size={16} className="text-gov-blue" /> Information Required
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">
                      Subject of RTI *
                    </label>
                    <input
                      className={`input-field ${errors.subject ? 'border-red-400' : ''}`}
                      placeholder="Brief subject — e.g., Status of road construction under PMGSY in Madurai district"
                      value={form.subject}
                      onChange={(e) => update('subject', e.target.value)}
                    />
                    <div className="flex justify-between items-center mt-0.5">
                      <FieldError msg={errors.subject} />
                      <span className="text-xs text-gray-300">{form.subject.length}/200</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">
                      Details of Information Required *
                    </label>
                    <p className="text-xs text-gray-400 mb-1">
                      Be specific. List each piece of information you need clearly.
                    </p>
                    <textarea
                      className={`input-field resize-none ${errors.details ? 'border-red-400' : ''}`}
                      rows={5}
                      placeholder={
                        '1. Total number of roads sanctioned under PMGSY Phase III in Tamil Nadu\n2. Amount of funds released and utilised as of March 2025\n3. List of roads completed and pending with reasons for delay'
                      }
                      value={form.details}
                      onChange={(e) => update('details', e.target.value)}
                    />
                    <FieldError msg={errors.details} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">
                        Time Period *
                      </label>
                      <input
                        className={`input-field ${errors.period ? 'border-red-400' : ''}`}
                        placeholder="e.g., April 2023 to March 2025"
                        value={form.period}
                        onChange={(e) => update('period', e.target.value)}
                      />
                      <FieldError msg={errors.period} />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">
                        Format of Information
                      </label>
                      <select
                        className="input-field"
                        value={form.format}
                        onChange={(e) => update('format', e.target.value)}
                      >
                        <option value="certified copy">Certified Copy</option>
                        <option value="printout">Printout</option>
                        <option value="soft copy (email)">Soft Copy (Email)</option>
                        <option value="inspection of records">Inspection of Records</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">
                        Preferred Language
                      </label>
                      <select
                        className="input-field"
                        value={form.language}
                        onChange={(e) => update('language', e.target.value)}
                      >
                        {[
                          'English', 'Hindi', 'Tamil', 'Telugu', 'Kannada',
                          'Malayalam', 'Bengali', 'Marathi', 'Gujarati', 'Punjabi',
                          'Odia', 'Assamese', 'Urdu',
                        ].map((l) => (
                          <option key={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── Step 3: Review ─────────────────────────────────────── */}
            {step === 3 && (
              <>
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <FileText size={16} className="text-gov-blue" /> Review & Generate
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Applicant', value: `${form.name}, ${form.gender}, ${form.category}` },
                    { label: 'Contact', value: `${form.phone}${form.email ? ` · ${form.email}` : ''}` },
                    { label: 'Address', value: `${form.city}, ${form.state} — ${form.pincode}` },
                    { label: 'Department', value: form.dept || '—' },
                    { label: 'Ministry', value: form.ministry || '—' },
                    { label: 'Subject', value: form.subject || '—' },
                    { label: 'Period', value: form.period || '—' },
                    { label: 'Format', value: form.format },
                    { label: 'Language', value: form.language },
                  ].map((d) => (
                    <div key={d.label} className="flex items-start gap-3 text-sm">
                      <span className="text-gray-400 w-24 flex-shrink-0 text-xs font-medium uppercase tracking-wide pt-0.5">
                        {d.label}
                      </span>
                      <span className="text-gray-800 font-medium">{d.value}</span>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-gov-blue-50 border border-gov-blue/20 rounded-xl text-xs text-gov-blue flex gap-2">
                  <FileText size={14} className="flex-shrink-0 mt-0.5" />
                  Ready to generate a professionally formatted RTI application compliant with
                  the RTI Act, 2005.
                </div>
              </>
            )}

            {/* ── Navigation ─────────────────────────────────────────── */}
            <div className="flex justify-between pt-2 border-t border-gray-100">
              <button
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 0}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-30"
              >
                <ArrowLeft size={15} /> Previous
              </button>

              {step < 3 ? (
                <button
                  onClick={handleNext}
                  className="btn-primary flex items-center gap-1.5 text-sm"
                >
                  Next Step <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="btn-primary flex items-center gap-2 disabled:opacity-60"
                >
                  {generating ? (
                    <>
                      <Loader size={15} className="animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <FileText size={15} /> Generate RTI Draft
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Generated Draft ──────────────────────────────────────────── */}
        {generated && (
          <motion.div
            key="draft"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="card overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-green-50 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className="text-gov-green" />
                <span className="font-semibold text-gray-800 text-sm">
                  RTI Draft Generated Successfully
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setEditing(!editing)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                    editing
                      ? 'bg-gov-blue text-white border-gov-blue'
                      : 'border-gray-200 text-gray-600 hover:border-gov-blue hover:text-gov-blue'
                  }`}
                >
                  <Edit3 size={13} /> {editing ? 'Done Editing' : 'Edit'}
                </button>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gov-blue hover:text-gov-blue transition-colors"
                >
                  <Copy size={13} /> {copied ? 'Copied!' : 'Copy'}
                </button>

                <button
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gov-blue hover:text-gov-blue transition-colors disabled:opacity-60"
                >
                  {saving ? (
                    <Loader size={13} className="animate-spin" />
                  ) : (
                    <Save size={13} />
                  )}
                  {saving ? 'Saving...' : 'Save Draft'}
                </button>

                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gov-blue text-white hover:bg-gov-blue-dark transition-colors"
                >
                  <Download size={13} /> Download PDF
                </button>
              </div>
            </div>

            <div className="p-5">
              {editing ? (
                <textarea
                  className="w-full font-mono text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-xl p-4 resize-none leading-relaxed focus:outline-none focus:ring-2 focus:ring-gov-blue/30"
                  rows={28}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
              ) : (
                <pre className="whitespace-pre-wrap font-mono text-xs text-gray-700 bg-gray-50 rounded-xl p-5 leading-relaxed border border-gray-100">
                  {draft}
                </pre>
              )}
            </div>

            <div className="px-5 pb-5">
              <button
                onClick={() => {
                  setGenerated(false);
                  setStep(0);
                  setForm(INITIAL_FORM);
                  setErrors({});
                }}
                className="text-sm text-gray-400 hover:text-gray-600 underline"
              >
                Generate another RTI draft
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
