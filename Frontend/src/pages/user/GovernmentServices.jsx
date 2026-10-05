import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, FileText, ArrowRight, CheckCircle,
  Sparkles, Shield, Clock, Globe,
} from 'lucide-react';
import { BackNavigation } from '../../components/common';

const APPLY_FEATURES = [
  'Find government services instantly',
  'View eligibility and required documents',
  'Step-by-step application guide',
  'AI Service Expert chat with live advice',
  'Direct links to official application portals',
  'Comprehensive real-world service FAQs',
];

const STATS = [
  { icon: Globe,    label: 'Services Available', value: '1,000+' },
  { icon: Shield,   label: 'Departments Covered', value: '80+'    },
  { icon: Sparkles, label: 'AI-Powered Guidance', value: 'Live'   },
  { icon: Clock,    label: 'Available',            value: '24 / 7' },
];

export default function GovernmentServices() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Dual Back Navigation */}
      <BackNavigation dashboardPath="/user" />

      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-hero-gradient text-white rounded-2xl p-8 relative overflow-hidden"
      >
        {/* Decorative circles */}
        <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-white/5 rounded-full" />

        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Building2 size={16} className="text-gov-saffron" />
            <span className="text-white/70 text-sm font-medium">Citizen Services</span>
          </div>
          <h2 className="font-display text-3xl font-bold mb-2">Government Services</h2>
          <p className="text-white/70 text-sm leading-relaxed max-w-lg">
            Your one-stop portal for government service guidance and AI-powered assistance.
            Find any service, check eligibility, and get step-by-step help instantly.
          </p>
        </div>

        {/* Stats row */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/15">
          {STATS.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-gov-saffron" />
              </div>
              <div>
                <p className="text-white font-bold text-base leading-none">{value}</p>
                <p className="text-white/60 text-xs mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Main feature card — full width */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-0 overflow-hidden hover:shadow-xl transition-shadow"
      >
        <div className="grid md:grid-cols-2">
          {/* Left: description + features */}
          <div className="p-8">
            <div className="w-14 h-14 bg-gov-blue-50 rounded-2xl flex items-center justify-center mb-5">
              <FileText size={26} className="text-gov-blue" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Apply and Services</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Find any government service, check your eligibility, and get AI-guided
              assistance through every step of the application process.
            </p>
            <ul className="space-y-3 mb-8">
              {APPLY_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <CheckCircle size={15} className="text-gov-blue flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/user/government-services/apply')}
              className="btn-primary px-8 py-3 flex items-center gap-2 text-sm font-semibold"
            >
              Explore Services <ArrowRight size={16} />
            </button>
          </div>

          {/* Right: visual accent panel */}
          <div className="bg-gov-blue-50 p-8 flex flex-col justify-center items-center text-center border-l border-gray-100 hidden md:flex">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-5">
              <Sparkles size={36} className="text-gov-blue" />
            </div>
            <h4 className="font-bold text-gray-800 text-lg mb-2">AI-Powered Assistance</h4>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              Our built-in AI expert guides you through eligibility checks,
              document requirements, and application steps — in plain language.
            </p>
            <div className="mt-6 space-y-2 w-full max-w-xs">
              {[
                'Instant eligibility check',
                'Document checklist',
                'Live AI chat support',
              ].map((item) => (
                <div
                  key={item}
                  className="bg-white rounded-xl px-4 py-2.5 text-sm text-gray-700 font-medium flex items-center gap-2 shadow-sm"
                >
                  <CheckCircle size={13} className="text-gov-blue flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}