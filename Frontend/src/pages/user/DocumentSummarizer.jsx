import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Loader, CheckCircle, Calendar, Building2,
  Phone, Send, Sparkles, ArrowLeft, X, RotateCcw, AlertCircle,
} from 'lucide-react';
import { PageHeader, BackNavigation } from '../../components/common';
import toast from 'react-hot-toast';

const AI_SERVICE_URL = 'http://localhost:8000/api/v1';

// ── Inline markdown renderer (same pattern as AIAssistant) ───────────────────
function FormattedMessage({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-2 space-y-1 pl-4 list-disc text-gray-700">
          {listItems.map((item, i) => <li key={i} className="leading-relaxed text-[13px]">{renderInline(item)}</li>)}
        </ul>
      );
      listItems = [];
    }
  };

  const renderInline = (str) => {
    const parts = [];
    const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
    let match, last = 0, key = 0;
    while ((match = regex.exec(str)) !== null) {
      if (match.index > last) parts.push(str.substring(last, match.index));
      if (match[2]) parts.push(<strong key={key++} className="font-bold text-gray-900">{match[2]}</strong>);
      else if (match[3]) parts.push(<em key={key++} className="italic">{match[3]}</em>);
      last = regex.lastIndex;
    }
    if (last < str.length) parts.push(str.substring(last));
    return parts.length ? parts : str;
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) { flushList(); elements.push(<div key={`b-${i}`} className="h-1.5" />); return; }
    const hm = trimmed.match(/^#{1,4}\s+(.+)$/);
    if (hm) { flushList(); elements.push(<h4 key={`h-${i}`} className="font-bold text-gray-900 text-sm mt-2 mb-1">{renderInline(hm[1])}</h4>); return; }
    if (/^[-•*]\s/.test(trimmed)) { listItems.push(trimmed.replace(/^[-•*]\s/, '')); return; }
    flushList();
    elements.push(<p key={`p-${i}`} className="leading-relaxed text-[13px] text-gray-700">{renderInline(trimmed)}</p>);
  });
  flushList();
  return <div className="space-y-1">{elements}</div>;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DocumentSummarizer() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [extractedText, setExtractedText] = useState(''); // kept in memory for Q&A
  const [error, setError] = useState('');

  // Chat state
  const [chatQ, setChatQ] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const fileRef = useRef();
  const chatEndRef = useRef();

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatLoading]);

  // Loading steps animation
  const LOADING_STEPS = [
    'Reading PDF file...',
    'Extracting document text...',
    'Generating AI summary with Gemini...',
    'Structuring results...',
  ];

  useEffect(() => {
    if (!loading) { setLoadingStep(0); return; }
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 900);
    return () => clearInterval(interval);
  }, [loading]);

  // ── Upload & summarize ─────────────────────────────────────────────────────
  const handleFile = async (f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files are supported.');
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      toast.error('File size must be under 20 MB.');
      return;
    }

    setFile(f);
    setResult(null);
    setChatMessages([]);
    setChatQ('');
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', f);

      const response = await fetch(`${AI_SERVICE_URL}/summarize/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();

      // Estimate pages from file size (rough: ~50KB per page for typical PDF)
      const estimatedPages = Math.max(1, Math.round(f.size / 51200));

      setResult({
        title: data.title || f.name.replace('.pdf', '').replace(/[_-]/g, ' '),
        pages: estimatedPages,
        summary: data.summary || '',
        highlights: Array.isArray(data.highlights) ? data.highlights : [],
        simplified: data.simplified || '',
        dates: Array.isArray(data.dates) ? data.dates : [],
        departments: Array.isArray(data.departments) ? data.departments : [],
        contacts: Array.isArray(data.contacts) ? data.contacts : [],
      });

      // We can't get text back from the upload endpoint directly,
      // but we keep the file object so Q&A can re-read it if needed.
      // Store the file reference to re-extract for Q&A context.
      setExtractedText(`[File: ${f.name}] — Document analyzed by AI. Summary and highlights available.`);
      toast.success('Document summarized successfully!');
    } catch (err) {
      console.error('Summarization error:', err);
      const msg = err.message || 'Failed to summarize document.';
      setError(msg);
      toast.error(msg);
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setChatMessages([]);
    setChatQ('');
    setError('');
    setExtractedText('');
  };

  // ── Chat Q&A — calls real /summarize/ask endpoint ─────────────────────────
  const sendChatMessage = async (questionOverride) => {
    const question = (questionOverride || chatQ).trim();
    if (!question || !result) return;
    setChatQ('');
    setChatMessages(prev => [...prev, { role: 'user', text: question }]);
    setChatLoading(true);

    try {
      // Build context: summary + highlights + simplified + dates + departments
      const docContext = [
        `Title: ${result.title}`,
        `Summary: ${result.summary}`,
        result.highlights.length > 0 ? `Key Highlights:\n${result.highlights.map((h, i) => `${i + 1}. ${h}`).join('\n')}` : '',
        result.simplified ? `Plain Language Explanation: ${result.simplified}` : '',
        result.dates.length > 0 ? `Important Dates:\n${result.dates.join('\n')}` : '',
        result.departments.length > 0 ? `Departments: ${result.departments.join(', ')}` : '',
      ].filter(Boolean).join('\n\n');

      const response = await fetch(`${AI_SERVICE_URL}/summarize/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          documentText: docContext,
          documentTitle: result.title,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'AI service error');
      }

      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'ai', text: data.answer || 'No answer generated.' }]);
    } catch (err) {
      console.error('Document Q&A error:', err);
      setChatMessages(prev => [...prev, {
        role: 'ai',
        text: 'I was unable to connect to the AI service. Please make sure the AI service is running on port 8000.',
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Quick question presets based on common government document queries
  const QUICK_QUESTIONS = [
    'What is this document about?',
    'Who is eligible?',
    'What are the key benefits?',
    'What are the important dates?',
    'What documents are required?',
  ];

  return (
    <div className="space-y-5">
      <BackNavigation dashboardPath="/user" />

      <PageHeader
        title="Document Summarizer"
        subtitle="Upload any government PDF and get an instant AI-powered breakdown — summary, highlights, plain-language explanation and Q&A."
      />

      {/* ── Upload Zone ─────────────────────────────────────────────────── */}
      {!result && !loading && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
            dragging
              ? 'border-gov-blue bg-gov-blue-50'
              : 'border-gray-200 hover:border-gov-blue hover:bg-gov-blue-50/50'
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".pdf"
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
          />
          <div className="w-16 h-16 bg-gov-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Upload size={28} className="text-gov-blue" />
          </div>
          <h3 className="font-semibold text-gray-700 mb-1">Drop your PDF here</h3>
          <p className="text-sm text-gray-400 mb-4">
            Supports PDF — up to 20 MB. Powered by Google Gemini 2.5 Flash.
          </p>
          <span className="btn-primary text-sm inline-flex items-center gap-2">
            <Upload size={15} /> Choose PDF File
          </span>
          <p className="text-xs text-gray-300 mt-4">
            Your document is processed securely and not stored permanently.
          </p>
        </div>
      )}

      {/* ── Error State ──────────────────────────────────────────────────── */}
      {error && !loading && !result && (
        <div className="card p-6 border border-red-100 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700 text-sm">Summarization Failed</p>
            <p className="text-xs text-red-500 mt-1">{error}</p>
            <button
              onClick={() => { setError(''); setFile(null); }}
              className="mt-3 text-xs text-gov-blue hover:underline font-semibold flex items-center gap-1"
            >
              <RotateCcw size={12} /> Try again
            </button>
          </div>
        </div>
      )}

      {/* ── Processing ──────────────────────────────────────────────────── */}
      {loading && (
        <div className="card p-10 flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gov-blue-50 rounded-full flex items-center justify-center">
            <Loader size={30} className="text-gov-blue animate-spin" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-800 mb-1">Processing "{file?.name}"</p>
            <p className="text-xs text-gray-400 mb-4">This may take 15–30 seconds for large documents</p>
            <div className="mt-3 space-y-1.5 text-sm text-gray-400">
              {LOADING_STEPS.map((s, i) => (
                <motion.p
                  key={s}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: i <= loadingStep ? 1 : 0.3 }}
                  className="flex items-center gap-2 justify-center"
                >
                  {i <= loadingStep
                    ? <CheckCircle size={13} className="text-gov-blue" />
                    : <span className="w-3 h-3 rounded-full border border-gray-300 inline-block" />
                  }
                  {s}
                </motion.p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Results + Inline Chat ───────────────────────────────────────── */}
      {result && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Document header card */}
          <div className="card p-5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText size={22} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">{result.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  ~{result.pages} {result.pages === 1 ? 'page' : 'pages'} · {file?.name}
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 mt-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Analysed by Gemini 2.5 Flash
                </span>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 flex-shrink-0"
            >
              <X size={13} /> Upload another
            </button>
          </div>

          {/* Summary grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* AI Summary — full width */}
            <div className="card p-5 md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-gov-blue rounded-lg flex items-center justify-center">
                  <Sparkles size={14} className="text-white" />
                </div>
                <span className="font-semibold text-sm text-gov-blue">AI Summary</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{result.summary}</p>
            </div>

            {/* Key Highlights */}
            {result.highlights.length > 0 && (
              <div className="card p-5">
                <h4 className="font-semibold text-sm text-gray-800 mb-3">Key Highlights</h4>
                <ul className="space-y-2">
                  {result.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                      <span className="w-5 h-5 bg-gov-blue-50 text-gov-blue rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Plain Language */}
            {result.simplified && (
              <div className="card p-5 bg-green-50 border border-green-100">
                <h4 className="font-semibold text-sm text-gray-800 mb-3 flex items-center gap-2">
                  <Sparkles size={14} className="text-green-600" /> Plain Language Explanation
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">{result.simplified}</p>
              </div>
            )}

            {/* Important Dates */}
            {result.dates.length > 0 && (
              <div className="card p-5">
                <h4 className="font-semibold text-sm text-gray-800 mb-3 flex items-center gap-2">
                  <Calendar size={14} className="text-gov-blue" /> Important Dates
                </h4>
                <ul className="space-y-2">
                  {result.dates.map((d, i) => (
                    <li key={i} className="text-xs text-gray-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-gov-saffron rounded-full flex-shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Departments & Contacts */}
            {(result.departments.length > 0 || result.contacts.length > 0) && (
              <div className="card p-5">
                <h4 className="font-semibold text-sm text-gray-800 mb-3 flex items-center gap-2">
                  <Building2 size={14} className="text-gov-blue" /> Departments &amp; Contacts
                </h4>
                {result.departments.map((d, i) => (
                  <p key={i} className="text-xs text-gray-700 mb-1">{d}</p>
                ))}
                {result.contacts.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {result.contacts.map((c, i) => (
                      <p key={i} className="text-xs text-gov-blue flex items-center gap-1.5">
                        <Phone size={11} /> {c}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── AI Chat Section ──────────────────────────────────────────── */}
          <div className="card overflow-hidden">
            {/* Chat header */}
            <div className="px-5 py-4 border-b border-gray-100 bg-gov-blue-50/50 flex items-center gap-3">
              <div className="w-9 h-9 bg-gov-blue rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gov-blue">Ask Questions About This Document</p>
                <p className="text-xs text-gray-500">
                  Answers are generated by Gemini based on this document's content.
                </p>
              </div>
              {chatMessages.length > 0 && (
                <button
                  onClick={() => { setChatMessages([]); setChatQ(''); }}
                  className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                >
                  <RotateCcw size={12} /> Clear chat
                </button>
              )}
            </div>

            {/* Messages area */}
            <div
              className="flex flex-col overflow-y-auto p-5 gap-4 bg-gray-50/50"
              style={{ minHeight: '260px', maxHeight: '420px' }}
            >
              {/* Empty state + quick questions */}
              {chatMessages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                  <Sparkles size={28} className="text-gov-blue/30 mb-3" />
                  <p className="text-gray-500 text-sm font-medium mb-1">
                    Ask anything about this document
                  </p>
                  <p className="text-xs text-gray-400 mb-4">
                    Powered by Gemini 2.5 Flash — grounded in this document only.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {QUICK_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendChatMessage(q)}
                        className="text-xs bg-white border border-gov-blue/20 text-gov-blue px-3 py-1.5 rounded-full font-medium hover:bg-gov-blue hover:text-white transition-colors shadow-sm"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message list */}
              {chatMessages.map((msg, i) => (
                <AnimatePresence key={i}>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-2.5'}`}
                  >
                    {msg.role === 'ai' && (
                      <div className="w-7 h-7 bg-gov-blue rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Sparkles size={13} className="text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-gov-blue text-white rounded-tr-none'
                          : 'bg-white border border-gray-100 text-gray-700 rounded-tl-none'
                      }`}
                    >
                      {msg.role === 'ai' && (
                        <div className="text-xs font-bold text-gov-blue mb-1">InfoSeva AI</div>
                      )}
                      {msg.role === 'ai'
                        ? <FormattedMessage text={msg.text} />
                        : <p className="leading-relaxed text-[13px]">{msg.text}</p>
                      }
                    </div>
                  </motion.div>
                </AnimatePresence>
              ))}

              {/* Typing indicator */}
              {chatLoading && (
                <div className="flex justify-start gap-2.5">
                  <div className="w-7 h-7 bg-gov-blue rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles size={13} className="text-white" />
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                    <div className="flex gap-1 items-center h-4">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-1.5 h-1.5 bg-gov-blue/40 rounded-full"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ delay: i * 0.15, repeat: Infinity, duration: 0.6 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input bar */}
            <div className="border-t border-gray-100 p-3 bg-white flex gap-2">
              <input
                className="flex-1 input-field text-sm"
                placeholder="Ask a question about this document..."
                value={chatQ}
                onChange={(e) => setChatQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
              />
              <button
                onClick={() => sendChatMessage()}
                disabled={!chatQ.trim() || chatLoading}
                className="btn-primary px-4 py-2 flex items-center gap-1.5 text-sm disabled:opacity-50"
              >
                <Send size={14} /> Send
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
