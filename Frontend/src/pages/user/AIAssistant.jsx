import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bot, Send, ChevronRight, RotateCcw, ArrowLeft, Loader,
  ArrowRight, Sparkles, BookOpen, FileText, HelpCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AshokaEmblem, BackNavigation } from '../../components/common';
import { useAuth } from '../../context/AuthContext';

// Helper component to render AI assistant response without raw hashtags or markdown clutter
function FormattedMessage({ text }) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let currentList = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-2 space-y-1.5 pl-4 list-disc text-gray-700">
          {currentList.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInlineStyles(item)}
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  const renderInlineStyles = (str) => {
    // Process **bold** and *italic*
    const parts = [];
    let keyIdx = 0;

    // Replace bold **text** or *text*
    const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.substring(lastIndex, match.index));
      }
      if (match[2]) {
        // Bold
        parts.push(<strong key={keyIdx++} className="font-bold text-gray-900">{match[2]}</strong>);
      } else if (match[3]) {
        // Italic
        parts.push(<em key={keyIdx++} className="italic text-gray-800">{match[3]}</em>);
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < str.length) {
      parts.push(str.substring(lastIndex));
    }
    return parts.length > 0 ? parts : str;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      elements.push(<div key={`blank-${index}`} className="h-2" />);
      return;
    }

    // Check for Markdown headers (### Header, ## Header, # Header)
    const headerMatch = trimmed.match(/^#{1,4}\s+(.+)$/);
    if (headerMatch) {
      flushList();
      elements.push(
        <h4 key={`h-${index}`} className="font-bold text-gray-900 text-sm mt-3 mb-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-gov-blue rounded-full" />
          {renderInlineStyles(headerMatch[1])}
        </h4>
      );
      return;
    }

    // Check for bullet lists (*, -, •, or 1.)
    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);

    if (bulletMatch) {
      currentList.push(bulletMatch[1]);
    } else if (numberedMatch) {
      flushList();
      elements.push(
        <div key={`num-${index}`} className="flex items-start gap-2 my-1 text-gray-700 leading-relaxed">
          <span className="font-bold text-gov-blue text-xs shrink-0 w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center mt-0.5">
            {numberedMatch[1]}
          </span>
          <div className="flex-1">{renderInlineStyles(numberedMatch[2])}</div>
        </div>
      );
    } else {
      flushList();
      elements.push(
        <p key={`p-${index}`} className="text-gray-700 leading-relaxed my-1">
          {renderInlineStyles(trimmed)}
        </p>
      );
    }
  });

  flushList();

  return <div className="space-y-0.5 text-xs sm:text-sm">{elements}</div>;
}

const MENU = {
  root: {
    label: 'How can I assist you today? Pick a topic or type any question below:',
    options: [
      { id: 'info', label: '📄 Public Information & Documents', desc: 'Browse verified government circulars, orders, and acts' },
      { id: 'schemes', label: '🏛️ Government Welfare Schemes', desc: 'Check eligibility and procedures for central & state schemes' },
      { id: 'rti', label: '📬 RTI Application Guidance', desc: 'Search previous RTI responses or draft a professional application' },
      { id: 'services', label: '🔖 Citizen Public Services', desc: 'Step-by-step guidance for certificates, Aadhaar, PAN, voter card' },
      { id: 'dept', label: '🏢 Department Contacts & Helplines', desc: 'Official government department portals and contact info' },
      { id: 'docs', label: '📑 Document Summariser & OCR', desc: 'Understand lengthy official PDFs or extract scanned text' },
    ],
  },
  info: {
    label: 'What type of government document or record are you seeking?',
    options: [
      {
        id: 'info_docs',
        label: 'Official Documents & Circulars',
        desc: 'Explore published guidelines, notifications, and gazette records.',
        reply: 'InfoSeva provides indexed government documents, circulars, and notifications across ministries.\n\nYou can search documents by title, keyword, or department, view verified summaries, and download the official PDFs.',
        action: { label: 'Go to Search Information', nav: '/user/search' }
      },
      {
        id: 'info_acts',
        label: 'Acts, Rules & Legislation',
        desc: 'Full text of Indian central and state legislation.',
        reply: 'Looking for statutory acts or legislative rules?\n\nKey documents including the Right to Information Act, Digital Personal Data Protection Act, and administrative rules are catalogued with searchable summaries.',
        action: { label: 'Open Search Information', nav: '/user/search' }
      },
      {
        id: 'info_orders',
        label: 'Government Orders & Notifications',
        desc: 'Latest executive orders, notifications, and amendments.',
        reply: 'Official Government Orders (GOs) and department notifications are accessible in the search catalogue with verification details.',
        action: { label: 'Search Government Orders', nav: '/user/search' }
      },
      {
        id: 'info_procedure',
        label: 'Citizen Service Procedures',
        desc: 'Standard operating procedures for public services.',
        reply: 'Citizen service workflows explain eligibility, required forms, office locations, and turnaround times.',
        action: { label: 'Search Procedures', nav: '/user/search' }
      },
    ],
  },
  schemes: {
    label: 'Which welfare category would you like to explore?',
    options: [
      {
        id: 'sc_agri',
        label: '🌾 Agriculture & Farmers',
        desc: 'PM-KISAN, crop insurance, subsidies, and Kisan Credit Card.',
        reply: 'Agricultural welfare schemes support landholding and marginal farmers with direct income transfers, subsidized inputs, and credit assistance.\n\n• **PM-KISAN**: ₹6,000/year income support in 3 installments.\n• **PM Fasal Bima Yojana**: Comprehensive crop insurance cover.\n• **Kisan Credit Card (KCC)**: Collateral-free concessional institutional credit.',
        action: { label: 'Browse Agriculture Schemes', nav: '/user/schemes' }
      },
      {
        id: 'sc_health',
        label: '🏥 Healthcare & Insurance',
        desc: 'Ayushman Bharat PM-JAY and national health insurance.',
        reply: 'Healthcare programs ensure cashless secondary and tertiary medical treatment.\n\n• **Ayushman Bharat (PM-JAY)**: Up to ₹5 Lakh/family/year for hospitalized treatment at empanelled hospitals.\n• **Ayushman Vay Vandana**: Expanded health coverage for all senior citizens aged 70+ regardless of income.',
        action: { label: 'View Health Schemes', nav: '/user/schemes' }
      },
      {
        id: 'sc_edu',
        label: '📚 Education & Scholarships',
        desc: 'Pre-matric, post-matric, and merit scholarship schemes.',
        reply: 'Educational scholarship initiatives provide direct financial grants for school and college students.\n\n• **National Scholarship Portal (NSP)**: Central platform for central & state scholarships.\n• **Post-Matric Scholarships**: Tuition fee reimbursement and maintenance allowance for SC/ST/OBC students.',
        action: { label: 'View Education Schemes', nav: '/user/schemes' }
      },
      {
        id: 'sc_housing',
        label: '🏠 Housing & Urban Affairs',
        desc: 'Pradhan Mantri Awas Yojana (PMAY-Urban & Gramin).',
        reply: 'Housing welfare assistance delivers pucca houses and interest subsidies.\n\n• **PMAY-Urban 2.0**: Financial assistance and interest subsidy up to ₹2.67 Lakh for EWS/LIG families.\n• **PMAY-Gramin**: Financial assistance for rural homeless families.',
        action: { label: 'View Housing Schemes', nav: '/user/schemes' }
      },
      {
        id: 'sc_finance',
        label: '💰 Finance & Micro-credit',
        desc: 'PM Mudra Yojana, Jan Dhan, and Stand-Up India.',
        reply: 'Financial inclusion programs deliver collateral-free enterprise loans and banking services.\n\n• **PM Mudra Yojana**: Small business loans up to ₹10 Lakh across Shishu, Kishor, and Tarun categories.\n• **PM Jan Dhan Yojana**: Zero-balance savings accounts with accidental insurance and overdraft facilities.',
        action: { label: 'View Finance Schemes', nav: '/user/schemes' }
      },
      {
        id: 'sc_all',
        label: '🏛️ Browse All Schemes Directory',
        desc: 'Full catalog with eligibility checker and direct application links.',
        reply: 'You can explore all central and state welfare schemes, test your eligibility interactively with instant yes/no questionnaires, and access direct official application links.',
        action: { label: 'Open Schemes Directory', nav: '/user/schemes' }
      },
    ],
  },
  rti: {
    label: 'How can I guide your Right to Information request?',
    options: [
      {
        id: 'rti_search',
        label: '🔍 Search Past RTI Responses',
        desc: 'Explore previous public disclosures and answers.',
        reply: 'Searching past RTI replies can give you instant answers without filing a fresh RTI application.\n\nYou can search through thousands of previously disclosed questions, file dates, and ministry responses.',
        action: { label: 'Search RTI Archive', nav: '/user/rti' }
      },
      {
        id: 'rti_draft',
        label: '✍️ Draft a New RTI Application',
        desc: 'Generate professional, legally sound RTI application drafts.',
        reply: 'Our AI RTI Draft Generator helps you compose structured, legally precise RTI queries adhering to Section 6(1) of the RTI Act, 2005.\n\nSimply specify your topic, department, and questions, and your draft will be formatted automatically.',
        action: { label: 'Open RTI Generator', nav: '/user/rti-draft' }
      },
      {
        id: 'rti_info',
        label: 'ℹ️ Learn the RTI Rules & Timeline',
        desc: 'Filing fees, statutory timelines, and appellate stages.',
        reply: 'Key provisions of the **Right to Information Act, 2005**:\n\n• **Filing Fee**: ₹10/- (Exempt for BPL card holders).\n• **Statutory Timeline**: 30 days from receipt of application (48 hours if concerning life or liberty).\n• **First Appeal**: Can be filed with the First Appellate Authority within 30 days if no response is received.\n• **Online Portal**: rtionline.gov.in (for Central Government ministries).',
      },
      {
        id: 'rti_fee',
        label: '💳 Payment Modes & Exemptions',
        desc: 'How to pay RTI fees and valid documentation.',
        reply: 'Valid RTI application payment methods:\n\n• **Online**: Internet banking, debit/credit cards, UPI on official state/central RTI portals.\n• **Offline**: Indian Postal Order (IPO), Demand Draft (DD), or Court Fee Stamp drawn in favor of Accounts Officer.\n• **Exemption**: Below Poverty Line (BPL) citizens need only attach a copy of their valid BPL Ration Card to waive the fee.',
      },
    ],
  },
  services: {
    label: 'Which citizen service or document do you need assistance with?',
    options: [
      {
        id: 'svc_passport',
        label: '🛂 Passport Application & Renewal',
        desc: 'Fresh passport, tatkaal, and address changes.',
        reply: 'To apply for an Indian Passport:\n\n1. Register at the official portal: **passportindia.gov.in**\n2. Complete the online form and pay the appointment fee.\n3. Mandatory documents: Proof of Date of Birth, Photo ID proof, Proof of Address.\n4. Visit the designated Passport Seva Kendra (PSK) for biometric capture and document verification.',
        action: { label: 'Search Passport Guidelines', nav: '/user/search' }
      },
      {
        id: 'svc_voter',
        label: '🗳️ Voter ID & EPIC Card',
        desc: 'Form 6 for new enrollment, Form 8 for modifications.',
        reply: 'Voter Registration Procedure:\n\n• **Form 6**: New voter registration for citizens aged 18+.\n• **Form 8**: Correction of entries or address transposition.\n• **Official Portal**: **voters.eci.gov.in**\n• Required: Age proof, residence proof, and passport-size photograph.',
        action: { label: 'Search Voter ID Procedures', nav: '/user/search' }
      },
      {
        id: 'svc_certificates',
        label: '📋 Income, Caste & Community Certificates',
        desc: 'Revenue department certificates for admissions and scholarships.',
        reply: 'State Revenue / e-District Certificates:\n\n• **Income Certificate**: Certifies family annual income, issued by Tehsildar (valid 1 year).\n• **Community / Caste Certificate**: Permanent certificate establishing reserved category (SC/ST/OBC/MBC).\n• Issued via state e-District portals or local Taluk offices with revenue verification.',
        action: { label: 'Explore Certificate Guidelines', nav: '/user/search' }
      },
      {
        id: 'svc_ration',
        label: '🏪 Ration Card & PDS Welfare',
        desc: 'New ration card, adding family members, smart cards.',
        reply: 'Ration cards provide subsidized food grains and act as legal identity documents:\n\n• **NFSA Categories**: Priority Household (PHH) and Antyodaya Anna Yojana (AAY).\n• Apply via state civil supplies portals or local Taluk Supply Offices.\n• Required: Family Aadhaar copies, residence proof, and income certificate.',
        action: { label: 'Search Ration Card Details', nav: '/user/search' }
      },
    ],
  },
  dept: {
    label: 'Which ministry or department details are you looking for?',
    options: [
      {
        id: 'dept_agri',
        label: '🌾 Ministry of Agriculture & Farmers Welfare',
        desc: 'Krishi Bhawan, New Delhi',
        reply: 'Ministry of Agriculture & Farmers Welfare:\n\n• **Portal**: agricoop.nic.in\n• **Farmer Helpline**: 1800-180-1551 (Kisan Call Centre)\n• **Headquarters**: Krishi Bhawan, New Delhi - 110001\n• **Major Schemes**: PM-KISAN, PMFBY, Soil Health Card Scheme.',
      },
      {
        id: 'dept_health',
        label: '🏥 Ministry of Health & Family Welfare',
        desc: 'Nirman Bhawan, New Delhi',
        reply: 'Ministry of Health & Family Welfare:\n\n• **Portal**: mohfw.gov.in\n• **Toll-Free Help Desk**: 1800-180-1104\n• **National Health Authority**: pmjay.gov.in\n• **Headquarters**: Nirman Bhawan, New Delhi - 110011',
      },
      {
        id: 'dept_edu',
        label: '📚 Ministry of Education',
        desc: 'Shastri Bhawan, New Delhi',
        reply: 'Ministry of Education:\n\n• **Portal**: education.gov.in\n• **National Scholarship Portal**: scholarships.gov.in\n• **Helpline**: 1800-11-2001\n• **Headquarters**: Shastri Bhawan, New Delhi - 110001',
      },
      {
        id: 'dept_all',
        label: '🔍 Search All Government Departments',
        desc: 'Find circulars, orders, and contact details by department.',
        reply: 'You can search across all central and state departments in the InfoSeva Search Catalogue to filter official orders, contacts, and schemes.',
        action: { label: 'Search by Department', nav: '/user/search' }
      },
    ],
  },
  docs: {
    label: 'How would you like help with your document?',
    options: [
      {
        id: 'doc_sum',
        label: '📄 Summarise a Government Document',
        desc: 'Generate clear, plain-language bullet points from complex gazettes.',
        reply: 'InfoSeva Document Intelligence can parse lengthy official PDFs, circulars, and notifications into plain, citizen-friendly summaries with key clauses and timelines.',
        action: { label: 'Open Document Summariser', nav: '/user/docs' }
      },
      {
        id: 'doc_scan',
        label: '💬 Ask Questions About an Uploaded File',
        desc: 'Interactive chat on any uploaded document.',
        reply: 'You can upload any official PDF or notification and ask specific questions (such as "What are the eligibility criteria?" or "What is the application deadline?").',
        action: { label: 'Go to Document Assistant', nav: '/user/docs' }
      },
      {
        id: 'doc_ocr',
        label: '🔍 Extract Text from Scanned Records',
        desc: 'AI-assisted OCR extraction from historical records.',
        reply: 'Extract text from scanned forms, gazette notices, or image PDFs with high accuracy.',
        action: { label: 'Access Document Tools', nav: '/user/docs' }
      },
    ],
  },
};

export default function AIAssistant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [currentMenu, setCurrentMenu] = useState('root');
  const [path, setPath] = useState([]);
  const [freeText, setFreeText] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const addBotMsg = (content, action = null, delay = 500) => {
    setTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'bot', content, action }]);
      setTyping(false);
    }, delay);
  };

  const handleOption = (opt) => {
    // Record user choice in chat history
    setMessages(prev => [...prev, { role: 'user', content: opt.label }]);

    if (opt.reply) {
      // Show full helpful reply in-chat with an optional action button (NO auto-redirect)
      addBotMsg(opt.reply, opt.action || (opt.nav ? { label: `Go to ${opt.label}`, nav: opt.nav } : null));
      setPath(prev => [...prev, currentMenu]);
      setCurrentMenu(null);
    } else if (opt.nav) {
      // Avoid immediate auto-redirect! Offer in-chat response and navigation button
      const replyText = `Here is information on **${opt.label}**.\n\nYou can explore the full records and guidelines on the dedicated page whenever you are ready.`;
      addBotMsg(replyText, { label: `Open ${opt.label}`, nav: opt.nav });
      setPath(prev => [...prev, currentMenu]);
      setCurrentMenu(null);
    } else if (MENU[opt.id]) {
      // Submenu transition
      setPath(prev => [...prev, currentMenu]);
      setCurrentMenu(opt.id);
      addBotMsg(MENU[opt.id].label);
    }
  };

  const handleBack = () => {
    const prev = path[path.length - 1] || 'root';
    setPath(p => p.slice(0, -1));
    setCurrentMenu(prev);
    addBotMsg(MENU[prev]?.label || 'How can I help you today?');
  };

  const handleReset = () => {
    setMessages([]);
    setCurrentMenu('root');
    setPath([]);
  };

  const [conversationId, setConversationId] = useState(null);

  const handleFreeText = async () => {
    if (!freeText.trim() || typing) return;
    const q = freeText.trim();
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setFreeText('');
    setTyping(true);

    try {
      const res = await fetch("http://localhost:8000/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: q,
          conversationId: conversationId || undefined,
          userId: user?.id ? String(user.id) : undefined,
          language: "English"
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.conversationId) setConversationId(data.conversationId);

        const answerText = data.answer || "I could not find specific government documents matching your query.";
        const citationsList = data.citations || [];

        // Check if query implies navigation
        let suggestedAction = null;
        const lowerQ = q.toLowerCase();
        if (lowerQ.includes('scheme') || lowerQ.includes('yojana')) {
          suggestedAction = { label: 'Explore Schemes Directory', nav: '/user/schemes' };
        } else if (lowerQ.includes('rti') || lowerQ.includes('right to information')) {
          suggestedAction = { label: 'Go to RTI Section', nav: '/user/rti' };
        } else if (lowerQ.includes('circular') || lowerQ.includes('order') || lowerQ.includes('document')) {
          suggestedAction = { label: 'Search Government Documents', nav: '/user/search' };
        }

        setMessages(prev => [
          ...prev,
          {
            role: 'bot',
            content: answerText,
            citations: citationsList,
            action: suggestedAction
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'bot',
            content: "I am unable to connect to the AI knowledge base at this moment. Please try again shortly."
          }
        ]);
      }
    } catch (err) {
      console.error("AI Assistant Chat Error:", err);
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          content: "Network error: Unable to reach the InfoSeva AI service. Please ensure the backend AI microservice is running on port 8000."
        }
      ]);
    } finally {
      setTyping(false);
      setCurrentMenu(null);
    }
  };

  const menu = MENU[currentMenu];

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Dual Back Navigation */}
      <BackNavigation dashboardPath="/user" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gov-blue-dark font-display flex items-center gap-2">
            <span>AI Assistant</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-gov-blue flex items-center gap-1">
              <Sparkles size={11} /> Smart Guide
            </span>
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Real-time public assistance for government schemes, services, and official documents
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gov-blue border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gov-blue/50 transition-colors bg-white shadow-sm"
          title="Restart Conversation"
        >
          <RotateCcw size={13} /> Restart Chat
        </button>
      </div>

      <div className="card flex flex-col overflow-hidden shadow-md border border-gray-200" style={{ height: '620px' }}>
        {/* Chat header */}
        <div className="bg-hero-gradient px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
              <AshokaEmblem size={30} />
            </div>
            <div>
              <div className="text-white font-bold text-sm">InfoSeva AI Public Assistant</div>
              <div className="flex items-center gap-1.5 text-white/70 text-xs">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                Active · Government Information Guide
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-white/80 text-xs bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
            <HelpCircle size={13} /> Ask in your own words
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-gray-50/70">
          {/* Welcome Greeting */}
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 bg-gov-blue text-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bot size={16} />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 max-w-md shadow-sm">
                  <p className="text-sm text-gray-900 font-bold mb-1 flex items-center gap-1.5">
                    Welcome to InfoSeva AI Assistant 🙏
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Hello {user?.name?.split(' ')[0] || 'Citizen'}! I can help you find eligible welfare schemes, guide you through citizen service applications, explain government circulars, and answer your RTI questions.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Message History */}
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'items-start gap-3'}`}
            >
              {msg.role === 'bot' && (
                <div className="w-8 h-8 bg-gov-blue text-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                  <Bot size={16} />
                </div>
              )}

              <div
                className={`max-w-xl rounded-2xl px-4 py-3.5 text-sm shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-gov-blue text-white rounded-tr-none'
                    : 'bg-white border border-gray-200/90 text-gray-800 rounded-tl-none'
                }`}
              >
                {msg.role === 'user' ? (
                  <div className="font-medium leading-relaxed">{msg.content}</div>
                ) : (
                  <FormattedMessage text={msg.content} />
                )}

                {/* Grounded Source Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-gray-100 space-y-1.5">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <BookOpen size={11} /> Verified Source Documents:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.citations.map((c, cIdx) => (
                        <div
                          key={cIdx}
                          className="text-[11px] bg-blue-50/80 text-gov-blue border border-blue-200/80 rounded-md px-2 py-1 flex items-center gap-1 font-medium"
                        >
                          <FileText size={11} />
                          <span className="truncate max-w-[200px]">{c.title || 'Government Record'}</span>
                          {c.department && <span className="text-gray-400 text-[10px]">· {c.department}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optional Action Button (Citizen-friendly redirect choice) */}
                {msg.action && (
                  <div className="mt-3 pt-2.5 border-t border-gray-100">
                    <button
                      onClick={() => navigate(msg.action.nav)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gov-blue text-white px-3.5 py-1.5 rounded-lg hover:bg-gov-blue-dark transition-colors shadow-sm"
                    >
                      {msg.action.label} <ArrowRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Typing Indicator */}
          {typing && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gov-blue text-white rounded-full flex items-center justify-center shadow-sm">
                <Bot size={16} />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2 text-xs text-gray-500">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 bg-gov-blue rounded-full"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ delay: i * 0.15, repeat: Infinity, duration: 0.6 }}
                    />
                  ))}
                </div>
                <span>Analyzing government records…</span>
              </div>
            </div>
          )}

          {/* Guided Topic Options */}
          {!typing && menu && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 pt-1">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-8 h-8 bg-gov-blue text-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bot size={16} />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-2.5 shadow-sm text-xs font-semibold text-gray-800">
                  {menu.label}
                </div>
              </div>

              <div className="pl-11 grid sm:grid-cols-2 gap-2">
                {menu.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleOption(opt)}
                    className="text-left bg-white border border-gray-200 hover:border-gov-blue hover:bg-gov-blue-50/60 rounded-xl p-3 text-xs transition-all group flex items-start justify-between gap-2 shadow-sm"
                  >
                    <div>
                      <div className="font-semibold text-gray-900 group-hover:text-gov-blue">{opt.label}</div>
                      {opt.desc && <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">{opt.desc}</div>}
                    </div>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-gov-blue flex-shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>

              {path.length > 0 && (
                <div className="pl-11 pt-1">
                  <button
                    onClick={handleBack}
                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gov-blue transition-colors font-medium"
                  >
                    <ArrowLeft size={13} /> Back to Previous Topics
                  </button>
                </div>
              )}
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-gray-200 p-3.5 bg-white">
          <div className="flex items-center gap-2">
            <input
              className="flex-1 input-field text-sm py-2.5 px-4 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-gov-blue/20"
              placeholder="Ask anything (e.g., 'How to apply for PM Kisan?' or 'RTI timeline')..."
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFreeText()}
              disabled={typing}
            />
            <button
              onClick={handleFreeText}
              disabled={!freeText.trim() || typing}
              className="btn-primary px-4 py-2.5 flex items-center gap-1.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              title="Send question"
            >
              {typing ? <Loader size={15} className="animate-spin" /> : <Send size={15} />}
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 text-center">
            InfoSeva AI answers are grounded in official government gazettes, schemes, and RTI guidelines.
          </p>
        </div>
      </div>
    </div>
  );
}

