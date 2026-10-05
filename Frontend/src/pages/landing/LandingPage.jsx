import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { Search, ChevronRight, FileText, BookOpen, MessageSquare, Building2, Bot, Scan, ArrowRight, Globe, Shield, Zap, Users, Star, ExternalLink, ChevronDown } from 'lucide-react';
import { AshokaEmblem, TricolorBar, TypeBadge } from '../../components/common';
import { stats, latestUpdates } from '../../data/dummyData';
import { useAuth } from '../../context/AuthContext';
import redFortHero from '../../assets/red fort.jpg';
const TYPING_PHRASES = [
  'Search government documents and circulars...',
  'Find applicable government schemes...',
  'Get RTI assistance and support...',
  'Check citizen service procedures...',
];

function AnimatedCounter({ target, duration = 2000 }) {
  const [count, setCount] = useState(0);
  const num = parseInt(target.replace(/[^0-9]/g, ''));
  useEffect(() => {
    let start = 0;
    const step = num / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= num) { setCount(num); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [num, duration]);
  return <>{target.replace(/[0-9,]+/, count.toLocaleString('en-IN'))}</>;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [typedText, setTypedText] = useState('');

  // Typing animation
  useEffect(() => {
    const phrase = TYPING_PHRASES[phraseIdx];
    let i = 0;
    setTypedText('');
    const t = setInterval(() => {
      i++;
      setTypedText(phrase.slice(0, i));
      if (i >= phrase.length) {
        clearInterval(t);
        setTimeout(() => setPhraseIdx((phraseIdx + 1) % TYPING_PHRASES.length), 1800);
      }
    }, 45);
    return () => clearInterval(t);
  }, [phraseIdx]);

const handleLogin = () => {
  navigate("/login");
};
  const services = [
    { icon: Search, title: 'Search Information', desc: 'Search across 2.8L+ government documents, circulars, and orders', color: 'gov-blue', path: '/user/search' },
    { icon: BookOpen, title: 'Government Schemes', desc: 'Find and check eligibility for 1,247+ central & state schemes', color: 'gov-green', path: '/user/schemes' },
    { icon: MessageSquare, title: 'RTI Assistance', desc: 'Search previous RTIs and generate professional RTI drafts', color: 'gov-saffron', path: '/user/rti' },
    { icon: Scan, title: 'Document Summarizer', desc: 'Upload PDFs and get AI-powered summaries in seconds', color: 'purple-600', path: '/user/docs' },
    { icon: Bot, title: 'AI Assistant', desc: 'Guided chatbot to help you navigate government services', color: 'blue-500', path: '/user/assistant' },
    { icon: Globe, title: 'Citizen Services', desc: 'Step-by-step procedures for passports, ration cards, and more', color: 'teal-600', path: '/user/search' },
  ];

  const iconColors = {
    'gov-blue': 'bg-gov-blue-50 text-gov-blue',
    'gov-green': 'bg-green-50 text-gov-green',
    'gov-saffron': 'bg-orange-50 text-gov-saffron',
    'purple-600': 'bg-purple-50 text-purple-600',
    'blue-500': 'bg-blue-50 text-blue-500',
    'teal-600': 'bg-teal-50 text-teal-600',
  };

  return (
    <div className="min-h-screen bg-white">
     
      <TricolorBar />

{/* ================= Navigation ================= */}

<nav className="bg-white shadow-nav sticky top-0 z-50">

  <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

    {/* Logo */}

    <div className="flex items-center gap-3">

      <AshokaEmblem size={42} />

      <div>

        <h1 className="font-display font-bold text-lg text-gov-blue">
          InfoSeva
        </h1>

        <p className="text-xs text-gray-500">
          Public Information System
        </p>

      </div>

    </div>

    {/* Navigation Links */}

    <div className="hidden md:flex items-center gap-8">

      <a
        href="#services"
        className="font-medium text-gray-600 hover:text-gov-blue transition"
      >
        Services
      </a>


      <a
        href="#about"
        className="font-medium text-gray-600 hover:text-gov-blue transition"
      >
        About InfoSeva
      </a>

      <a
        href="#updates"
        className="font-medium text-gray-600 hover:text-gov-blue transition"
      >
        Updates
      </a>

    </div>

    {/* Authentication */}

    <div className="flex items-center gap-3">

      <button
        onClick={() => navigate("/login")}
        className="btn-secondary px-6 py-2.5"
      >
        Login
      </button>

      <button
        onClick={() => navigate("/register")}
        className="btn-primary px-6 py-2.5"
      >
        Register
      </button>

    </div>

  </div>

</nav>

{/* Hero Section */}
<section className="relative overflow-hidden text-white min-h-[88vh] flex items-center">
  <div className="absolute inset-0">
    <img src={redFortHero} alt="Red Fort, Government of India" className="w-full h-full object-cover object-center" />
    <div className="absolute inset-0 bg-gradient-to-r from-gov-blue-dark/80 via-gov-blue/60 to-gov-blue-dark/80" />
    <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-gov-blue-dark/35 to-transparent" />
  </div>

  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/5 rounded-full blur-2xl" />
    <div className="absolute bottom-0 left-0 w-72 h-72 bg-gov-saffron/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
    <svg className="absolute bottom-0 right-0 w-[450px] opacity-[0.08]" viewBox="0 0 400 200" fill="white">
      <rect x="150" y="40" width="100" height="160" />
      <polygon points="200,0 130,40 270,40" />
      <rect x="50" y="80" width="300" height="120" />
      <rect x="0" y="150" width="400" height="50" />
      <rect x="90" y="110" width="30" height="90" />
      <rect x="140" y="110" width="30" height="90" />
      <rect x="230" y="110" width="30" height="90" />
      <rect x="280" y="110" width="30" height="90" />
    </svg>
  </div>

  <div className="relative z-10 max-w-5xl mx-auto px-4 py-20 text-center">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <div className="flex justify-center mb-6"><AshokaEmblem size={72} className="opacity-95" /></div>

      <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-sm mb-6">
        <Zap size={14} className="text-gov-saffron" />
        <span>AI-Powered Government Information Platform</span>
      </div>

      <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold mb-4">Info<span className="text-gov-saffron">Seva</span></h1>

      <p className="text-xl md:text-2xl text-white/90 font-medium mb-3">Sustainable AI-Based RTI Search & Public Information Assistance System</p>

      <p className="text-white/75 max-w-2xl mx-auto mb-10 leading-relaxed">Your single window to government schemes, RTIs, public documents, circulars and citizen services — powered by Artificial Intelligence.</p>
    </motion.div>

    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="max-w-3xl mx-auto mb-10">
      <div className="bg-white rounded-2xl shadow-2xl p-2 flex items-center">
        <div className="flex items-center flex-1 px-4">
          <Search size={20} className="text-gray-400 mr-3" />
          <input type="text" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} placeholder={typedText + "|"} className="w-full py-3 outline-none text-gray-800 placeholder-gray-400" />
        </div>

        <button onClick={() => handleLogin("user")} className="bg-gov-blue hover:bg-gov-blue-dark transition-colors text-white px-7 py-3 rounded-xl font-semibold">
          Search Now
        </button>
      </div>

      <p className="mt-3 text-sm text-white/70">Search across government documents, RTIs, welfare schemes, circulars and official notifications.</p>
    </motion.div>

    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex justify-center gap-4 flex-wrap">
      <button onClick={() => handleLogin("user")} className="btn-saffron flex items-center gap-2">
        Get Started Free <ArrowRight size={16} />
      </button>

      <button onClick={() => document.getElementById("services").scrollIntoView({ behavior: "smooth" })} className="bg-white/10 backdrop-blur-md border border-white/30 hover:bg-white/20 transition text-white px-6 py-2.5 rounded-lg font-semibold">
        Explore Services
      </button>
    </motion.div>
  </div>
</section>
      {/* Stats Bar */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="text-center">
              <div className="text-3xl font-bold text-gov-blue font-display">
                <AnimatedCounter target={stat.value} />
              </div>
              <div className="text-xs text-gray-500 mt-1 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-16 bg-gov-slate">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-gov-saffron uppercase tracking-widest">What We Offer</span>
            <h2 className="font-display text-3xl font-bold text-gov-blue-dark mt-2">Platform Services</h2>
            <p className="text-gray-500 text-sm mt-2 max-w-lg mx-auto">Everything a citizen needs to access public information, in one unified platform</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((svc, i) => (
              <motion.div key={svc.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }} viewport={{ once: true }}
                onClick={() => handleLogin('user')}
                className="card p-6 cursor-pointer group hover:-translate-y-1 transition-transform duration-200">
                <div className={`w-12 h-12 rounded-xl ${iconColors[svc.color]} flex items-center justify-center mb-4`}>
                  <svc.icon size={22} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-gov-blue transition-colors">{svc.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{svc.desc}</p>
                <div className="flex items-center gap-1 text-gov-blue text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore <ChevronRight size={14} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why InfoSeva */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-semibold text-gov-saffron uppercase tracking-widest">Why InfoSeva</span>
              <h2 className="font-display text-3xl font-bold text-gov-blue-dark mt-2 mb-4">
                Making Government Information Accessible to Every Citizen
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                India has thousands of government portals, documents, and services scattered across departments. InfoSeva brings them all together with AI-powered search and guidance.
              </p>
              {[
                { icon: Shield, title: 'Official & Verified Sources', desc: 'All data sourced directly from government APIs and official portals' },
                { icon: Zap, title: 'AI-Powered Summaries', desc: 'Complex government language simplified in seconds using advanced AI' },
                { icon: Users, title: 'Built for Every Citizen', desc: 'Multilingual support and guided interfaces for all literacy levels' },
                { icon: Star, title: 'Reduce Duplicate RTIs', desc: 'Search existing RTI responses before filing a new one, saving time' },
              ].map(item => (
                <div key={item.title} className="flex gap-4 mb-5">
                  <div className="w-10 h-10 bg-gov-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon size={18} className="text-gov-blue" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">{item.title}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="relative">
              {/* Illustration - digital India themed */}
              <div className="bg-hero-gradient rounded-2xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <AshokaEmblem size={40} />
                    <div>
                      <div className="font-bold">Digital India</div>
                      <div className="text-xs text-white/60">Empowering Citizens</div>
                    </div>
                  </div>
                  {['Search Government Data', 'Discover Eligible Schemes', 'File RTI Applications', 'Get AI Assistance'].map((item, i) => (
                    <motion.div key={item} initial={{ x: -20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.15 }} viewport={{ once: true }}
                      className="flex items-center gap-3 mb-3 bg-white/10 rounded-lg px-4 py-2.5 text-sm">
                      <div className="w-6 h-6 bg-gov-saffron rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {i + 1}
                      </div>
                      {item}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Updates */}
      <section id="updates" className="py-16 bg-gov-slate">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-semibold text-gov-saffron uppercase tracking-widest">Live Updates</span>
              <h2 className="font-display text-2xl font-bold text-gov-blue-dark mt-1">Latest Government Updates</h2>
            </div>
            <button onClick={() => handleLogin('user')} className="btn-secondary flex items-center gap-1.5 text-sm">
              View All <ExternalLink size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {latestUpdates.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }} viewport={{ once: true }}
                className="card p-4 flex items-start gap-4 group cursor-pointer hover:-translate-y-0.5 transition-transform">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <TypeBadge type={item.type} />
                    {item.badge && (
                      <span className={`badge text-xs ${item.badge === 'New' ? 'bg-green-100 text-green-700' : item.badge === 'Updated' ? 'bg-blue-100 text-blue-700' : item.badge === 'Draft' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800 group-hover:text-gov-blue transition-colors line-clamp-2">{item.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{item.department} · {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-gov-blue transition-colors flex-shrink-0 mt-1" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-hero-gradient py-16 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display text-3xl font-bold mb-3">Start Accessing Public Information Today</h2>
            <p className="text-white/70 text-sm mb-8">Join 1.2 lakh+ citizens using InfoSeva to navigate government services with ease.</p>
            <button onClick={() => handleLogin('user')} className="btn-saffron text-base px-8 py-3 flex items-center gap-2 mx-auto">
              Get Started — It's Free <ArrowRight size={18} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gov-blue-dark text-white">
        <TricolorBar />
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AshokaEmblem size={32} />
              <span className="font-display font-bold text-lg">InfoSeva</span>
            </div>
            <p className="text-white/50 text-xs leading-relaxed">An initiative to make government information accessible to every Indian citizen through AI.</p>
          </div>
          {[
            { title: 'Services', links: ['Search Information', 'Government Schemes', 'RTI Assistance', 'Document Summarizer', 'AI Assistant'] },
            { title: 'For Citizens', links: ['How to File RTI', 'Scheme Eligibility', 'Citizen Services', 'Language Support', 'Help & FAQ'] },
            { title: 'Platform', links: ['About InfoSeva', 'Data Sources', 'Privacy Policy', 'Accessibility', 'Contact Us'] },
          ].map(col => (
            <div key={col.title}>
              <h4 className="font-semibold text-sm mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(link => (
                  <li key={link}><a href="#" className="text-white/50 text-xs hover:text-white transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-white/40">
          <p>© 2025 InfoSeva — Government of India Initiative | Designed for Digital India | सत्यमेव जयते</p>
        </div>
      </footer>
    </div>
  );
}


