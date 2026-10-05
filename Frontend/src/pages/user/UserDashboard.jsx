import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, FileText, BookOpen, TrendingUp, Clock,
  Bookmark, ArrowRight, Zap, Star, Award, AlertCircle, Bell
} from 'lucide-react';
import { StatCard, TypeBadge } from '../../components/common';
import { latestUpdates as fallbackUpdates, recentActivity as fallbackActivity, trendingSearches as fallbackTrending } from '../../data/dummyData';
import { useAuth } from '../../context/AuthContext';
import { useDataManager } from '../../context/DataManagerContext';
import { toSchemeCards } from '../../utils/dataManagerAdapter';
import { getNotifications, markAsRead } from '../../api/notificationsApi';

// Maps a latestUpdates item to the correct detail route
function getUpdateRoute(item) {
  if (item.type === 'Scheme') return `/user/schemes/${item.slug || item.id}`;
  return `/user/circulars/${item.id}`;
}

// Maps a recentActivity icon string to a Lucide icon component
const ACTIVITY_ICON_MAP = { Search, Bookmark, FileText, FileSearch: Search };

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { manualRecords, bulkRecords, apiRecords } = useDataManager();

  // Dynamic States
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [realUpdates, setRealUpdates] = useState([]);
  const [realTrending, setRealTrending] = useState([]);
  const [realActivity, setRealActivity] = useState([]);
  const [realRecommendations, setRealRecommendations] = useState([]);
  const [citizenNotifications, setCitizenNotifications] = useState([]);

  // Fetch dynamic citizen dashboard data from infoseva-service
  useEffect(() => {
    let cancelled = false;
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('infoseva_access_token') || sessionStorage.getItem('jwt_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // 1. Try fetching citizen dashboard summary
        const res = await fetch('http://localhost:8082/api/dashboard/citizen', { headers });
        if (res.ok) {
          const json = await res.json();
          if (!cancelled && json.data) {
            setDashboardData(json.data);
            if (json.data.latestUpdates && json.data.latestUpdates.length > 0) {
              setRealUpdates(json.data.latestUpdates.map(u => ({
                id: u.id,
                title: u.title,
                type: u.type || 'Circular',
                department: u.departmentName || 'Government of India',
                date: u.date || new Date().toISOString(),
                route: u.route || `/user/circulars/${u.id}`
              })));
            }
            if (json.data.trendingSearches && json.data.trendingSearches.length > 0) {
              setRealTrending(json.data.trendingSearches);
            }
            if (json.data.recentActivity && json.data.recentActivity.length > 0) {
              setRealActivity(json.data.recentActivity);
            }
          }
        }

        // 2. Fetch rule-based recommendations from recommendation engine
        try {
          const recUserId = user?.id || 'me';
          const profParam = user?.profession ? `&profession=${encodeURIComponent(user.profession)}` : '';
          const recRes = await fetch(`http://localhost:8082/api/recommendations/${recUserId}?limit=6${profParam}`, { headers });
          if (recRes.ok) {
            const recJson = await recRes.json();
            if (!cancelled && recJson.data && recJson.data.length > 0) {
              setRealRecommendations(recJson.data);
            }
          }
        } catch (e) {
          console.warn('Could not fetch recommendations, using baseline', e);
        }

        // 3. Fetch real notifications for this citizen
        try {
          const notifs = await getNotifications();
          if (!cancelled && notifs) {
            setCitizenNotifications(notifs);
          }
        } catch (e) {
          console.warn('Could not fetch citizen notifications', e);
        }
      } catch (err) {
        console.warn('Could not fetch citizen dashboard, fallback to real documents/local cache', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDashboard();

    // Poll for notifications every 6 seconds so when Data Manager approves a document live, it shows up automatically
    const pollInterval = setInterval(async () => {
      try {
        const notifs = await getNotifications();
        if (!cancelled && notifs) {
          setCitizenNotifications(notifs);
        }
      } catch (ignored) {}
    }, 6000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
  }, [user]);

  // Merge Real Documents from Data Manager Context into Updates
  const displayUpdates = useMemo(() => {
    const publishedManuals = (manualRecords || []).filter(r => r.status === 'Published');
    if (publishedManuals.length > 0) {
      const mapped = publishedManuals.map(d => ({
        id: d.id,
        title: d.title,
        type: d.documentType === 'GO' ? 'Government Order' : (d.documentType === 'Circular' ? 'Circular' : (d.documentType === 'Scheme' ? 'Scheme' : 'Notification')),
        department: d.department || d.ministry || 'Government of India',
        date: d.date || d.issueDate || new Date().toISOString(),
        slug: d.slug,
        route: d.documentType === 'Scheme' ? `/user/schemes/dm-${d.id}` : `/user/documents/${d.id}`
      }));
      return [...mapped, ...realUpdates, ...fallbackUpdates].slice(0, 4);
    }
    if (realUpdates.length > 0) return realUpdates.slice(0, 4);
    return fallbackUpdates.slice(0, 4);
  }, [manualRecords, realUpdates]);

  // Trending Searches: combine real backend trending with popular terms
  const displayTrending = useMemo(() => {
    if (realTrending && realTrending.length > 0) return realTrending.slice(0, 6);
    return fallbackTrending.slice(0, 6);
  }, [realTrending]);

  // Recent Activity: combine real user bookmarks/activities and backend activity
  const displayActivity = useMemo(() => {
    const localBookmarks = (() => {
      try {
        return JSON.parse(localStorage.getItem('userBookmarks') || '[]');
      } catch {
        return [];
      }
    })();

    const bookmarkActivities = localBookmarks.slice(0, 3).map(b => ({
      action: 'Bookmarked',
      item: b.title,
      time: b.saved || 'Recently',
      icon: 'Bookmark',
      route: b.route || `/user/documents/${b.id}`
    }));

    if (bookmarkActivities.length > 0) {
      return [...bookmarkActivities, ...realActivity, ...fallbackActivity].slice(0, 4);
    }
    if (realActivity.length > 0) return realActivity.slice(0, 4);
    return fallbackActivity.slice(0, 4);
  }, [realActivity]);

  // Dynamic Statistics
  const dynamicStats = useMemo(() => {
    const totalDocs = dashboardData?.totalDocuments || (manualRecords?.length ? 284563 + manualRecords.length : 284563);
    const activeSchemes = dashboardData?.activeSchemes || (toSchemeCards({ manualRecords, bulkRecords, apiRecords })?.length || 1247);

    return [
      { label: 'Government Documents', value: Number(totalDocs).toLocaleString('en-IN'), icon: 'FileText', trend: '+12%' },
      { label: 'Government Schemes', value: Number(activeSchemes).toLocaleString('en-IN'), icon: 'BookOpen', trend: '+5%' },
    ];
  }, [dashboardData, manualRecords, bulkRecords, apiRecords]);

  // Personalized Recommendations based on scored results + user profession
  const recommendations = useMemo(() => {
    if (realRecommendations && realRecommendations.length > 0) {
      return realRecommendations.map(r => {
        const cat = (r.category || '').toLowerCase();
        const ttl = (r.title || '').toLowerCase();
        const isScholarship = cat.includes('scholar') || ttl.includes('scholar') || cat.includes('educat');
        const isScheme = r.type === 'Scheme' || cat.includes('scheme') || cat.includes('agri');
        const isOrder = r.type === 'Government Order' || cat.includes('order') || cat.includes('circular');

        const tagColor = isScholarship ? 'text-gov-saffron' : (isScheme ? 'text-gov-blue' : (isOrder ? 'text-red-500' : 'text-purple-600'));
        const borderColor = isScholarship ? 'border-orange-100 bg-orange-50' : (isScheme ? 'border-blue-100 bg-blue-50' : (isOrder ? 'border-red-100 bg-red-50' : 'border-purple-100 bg-purple-50'));
        const icon = isScholarship ? Award : (isScheme ? BookOpen : (isOrder ? AlertCircle : FileText));

        return {
          type: r.type || (isScholarship ? 'Scholarship' : (isScheme ? 'Scheme' : 'Document')),
          tagColor,
          borderColor,
          icon,
          title: r.title,
          desc: r.matchReasons && r.matchReasons.length > 0 ? r.matchReasons.join(' • ') : (r.description || r.title),
          btnText: 'View Details',
          btnColor: tagColor,
          route: r.route || `/user/documents/${r.id}`,
          score: r.score
        };
      });
    }

    const prof = (user?.profession || '').toUpperCase();

    if (prof.includes('STUDENT') || prof.includes('TEACHER')) {
      return [
        {
          type: 'Scholarship',
          tagColor: 'text-gov-saffron',
          borderColor: 'border-orange-100 bg-orange-50',
          icon: Award,
          title: 'National Merit Scholarship & Education Support',
          desc: 'Eligible based on your profile (Student/Education category)',
          btnText: 'View Details',
          btnColor: 'text-gov-saffron',
          route: '/user/schemes/national-scholarship-portal'
        },
        {
          type: 'Scheme',
          tagColor: 'text-gov-blue',
          borderColor: 'border-blue-100 bg-blue-50',
          icon: BookOpen,
          title: 'Higher Education Free Coaching & Digital Library',
          desc: 'Access verified government study resources & entrance prep',
          btnText: 'Explore Scheme',
          btnColor: 'text-gov-blue',
          route: '/user/schemes'
        },
        {
          type: 'Circular',
          tagColor: 'text-purple-600',
          borderColor: 'border-purple-100 bg-purple-50',
          icon: FileText,
          title: 'University Examination & Fee Reimbursement Norms',
          desc: 'Ministry of Education guideline for academic year 2025-26',
          btnText: 'Read Circular',
          btnColor: 'text-purple-600',
          route: '/user/updates'
        }
      ];
    } else if (prof.includes('FARMER')) {
      return [
        {
          type: 'Scheme',
          tagColor: 'text-gov-blue',
          borderColor: 'border-blue-100 bg-blue-50',
          icon: BookOpen,
          title: 'PM Kisan Samman Nidhi',
          desc: 'Eligible based on your profile (Farmer category - ₹6,000/year)',
          btnText: 'Check Eligibility',
          btnColor: 'text-gov-blue',
          route: '/user/schemes/pm-kisan-samman-nidhi'
        },
        {
          type: 'Scheme',
          tagColor: 'text-green-700',
          borderColor: 'border-green-100 bg-green-50',
          icon: Star,
          title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
          desc: 'Comprehensive crop insurance against drought, floods and pests',
          btnText: 'Check Subsidy',
          btnColor: 'text-green-700',
          route: '/user/schemes'
        },
        {
          type: 'Government Order',
          tagColor: 'text-red-500',
          borderColor: 'border-red-100 bg-red-50',
          icon: AlertCircle,
          title: 'Agricultural Equipment & Solar Pump Subsidies 2025',
          desc: 'Subsidy guidelines released by Ministry of Agriculture',
          btnText: 'Read Order',
          btnColor: 'text-red-500',
          route: '/user/updates'
        }
      ];
    } else {
      // General citizen recommendations
      return [
        {
          type: 'Scheme',
          tagColor: 'text-gov-blue',
          borderColor: 'border-blue-100 bg-blue-50',
          icon: BookOpen,
          title: 'Ayushman Bharat PM-JAY Health Coverage',
          desc: '₹5 Lakh free annual health insurance for your entire family',
          btnText: 'Check Eligibility',
          btnColor: 'text-gov-blue',
          route: '/user/schemes/ayushman-bharat-pmjay'
        },
        {
          type: 'Citizen Service',
          tagColor: 'text-gov-saffron',
          borderColor: 'border-orange-100 bg-orange-50',
          icon: Award,
          title: 'Digital Income & Residence Certificate Services',
          desc: 'Online issuance with e-District digital signature verification',
          btnText: 'Apply Online',
          btnColor: 'text-gov-saffron',
          route: '/user/government-services'
        },
        {
          type: 'Important Order',
          tagColor: 'text-red-500',
          borderColor: 'border-red-100 bg-red-50',
          icon: AlertCircle,
          title: 'RTI Rules & Citizen Transparency Directives',
          desc: 'Updated appellate timelines under the Right to Information Act',
          btnText: 'Read Now',
          btnColor: 'text-red-500',
          route: '/user/rti'
        }
      ];
    }
  }, [user, realRecommendations]);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-hero-gradient text-white rounded-2xl p-6 flex items-center justify-between overflow-hidden relative"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-gov-saffron" />
            <span className="text-white/70 text-sm">Citizen Portal</span>
          </div>
          <h2 className="font-display text-2xl font-bold">
            Welcome back, {user?.name?.split(' ')[0] || 'Citizen'}
          </h2>
          <p className="text-white/70 text-sm mt-1">
            {user?.profession ? `Tailored alerts & schemes for your profile (${user.profession}).` : "Here's what's new in government information today."}
          </p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => navigate('/user/search')}
              className="btn-saffron text-sm flex items-center gap-1.5"
            >
              Search Now <ArrowRight size={14} />
            </button>
            <button
              onClick={() => navigate('/user/government-services')}
              className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors flex items-center gap-1.5"
            >
              <Search size={14} /> Find Services
            </button>
          </div>
        </div>
        <div className="hidden md:block relative z-10 text-right">
          <div className="text-4xl font-display font-bold text-white/10">InfoSeva</div>
          <div className="text-white/50 text-xs">Official Public Services</div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {dynamicStats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <StatCard
              label={s.label}
              value={s.value}
              trend={s.trend}
              color={['blue', 'saffron'][i]}
            />
          </motion.div>
        ))}
      </div>

      {/* Personalized Recommendations */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Star size={16} className="text-gov-saffron" /> Recommended for You
          </h3>
          <span className="text-xs text-gray-500 bg-gov-blue-50 text-gov-blue px-2.5 py-1 rounded-full font-medium">
            {user?.profession ? `Matched to ${user.profession}` : 'Citizen Recommendations'}
          </span>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {recommendations.map((rec, idx) => {
            const IconComponent = rec.icon;
            return (
              <div key={idx} className={`rounded-xl border p-4 ${rec.borderColor} flex flex-col justify-between`}>
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <IconComponent size={15} className={rec.tagColor} />
                      <span className={`text-xs font-semibold uppercase tracking-wide ${rec.tagColor}`}>
                        {rec.type}
                      </span>
                    </div>
                    {rec.score !== undefined && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/90 border border-gray-200 text-gray-700 shadow-2xs">
                        ★ {rec.score} pts
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-800 leading-snug">
                    {rec.title}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {rec.desc}
                  </p>
                </div>
                <button
                  onClick={() => navigate(rec.route)}
                  className={`mt-3 text-xs font-semibold hover:underline flex items-center gap-1 ${rec.btnColor}`}
                >
                  {rec.btnText} <ArrowRight size={11} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Notifications — Real-time domain matching alerts from Data Manager */}
      <div className="card p-5 border border-gov-blue/20 bg-gradient-to-r from-blue-50/40 via-white to-orange-50/20">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gov-blue/10 flex items-center justify-center text-gov-blue">
              <Bell size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                Recent Notifications
                {citizenNotifications.filter(n => n.unread).length > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-gov-saffron text-white shadow-xs">
                    {citizenNotifications.filter(n => n.unread).length} New
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-500">
                {user?.profession
                  ? `Matched automatically to your area of interest (${user.profession})`
                  : 'Direct administrative alerts and approved citizen services'}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Domain Match
          </span>
        </div>

        {citizenNotifications.length === 0 ? (
          <div className="py-6 px-4 text-center rounded-xl bg-white/70 border border-dashed border-gray-200">
            <p className="text-xs text-gray-500 font-medium">No recent notifications right now.</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              When a Data Manager approves documents matching your interest ({user?.profession || 'Citizen'}), alerts will arrive here live.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {citizenNotifications.slice(0, 4).map((n) => (
              <div
                key={n.id}
                onClick={async () => {
                  if (n.unread) {
                    await markAsRead(n.id);
                    setCitizenNotifications(prev => prev.map(item => item.id === n.id ? { ...item, unread: false, isRead: true } : item));
                  }
                  if (n.route) navigate(n.route);
                }}
                className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer group ${
                  n.unread
                    ? 'bg-white border-gov-blue/30 shadow-xs hover:border-gov-blue'
                    : 'bg-gray-50/70 border-gray-100 hover:bg-white'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.unread ? 'bg-gov-saffron ring-4 ring-orange-100' : 'bg-gray-300'}`} />
                  <div className="min-w-0">
                    <p className={`text-xs leading-snug line-clamp-2 ${n.unread ? 'font-bold text-gray-900 group-hover:text-gov-blue' : 'font-medium text-gray-700'}`}>
                      {n.text || n.message || n.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                      <span>{n.time || 'Recently'}</span>
                      {n.type && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">
                            {n.type.replace(/_/g, ' ')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs font-semibold text-gov-blue group-hover:underline flex-shrink-0 self-center"
                >
                  View <ArrowRight size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Recent Activity */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Clock size={16} className="text-gov-blue" /> Recent Activity
            </h3>
          </div>
          <div className="space-y-2">
            {displayActivity.map((act, i) => {
              const IconComp = ACTIVITY_ICON_MAP[act.icon] || Search;
              return (
                <button
                  key={i}
                  onClick={() => act.route && navigate(act.route)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gov-blue-50 transition-colors text-left group"
                >
                  <div className="w-8 h-8 bg-gov-blue-50 group-hover:bg-gov-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <IconComp size={15} className="text-gov-blue" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-700">
                      <span className="text-gray-400">{act.action} </span>
                      <span className="font-medium group-hover:text-gov-blue transition-colors">
                        {act.item}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{act.time}</p>
                  </div>
                  <ArrowRight
                    size={13}
                    className="text-gray-200 group-hover:text-gov-blue transition-colors flex-shrink-0 mt-1"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Trending Searches */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-gov-saffron" />
            Trending Searches
          </h3>
          <div className="space-y-1.5">
            {displayTrending.map((term, i) => (
              <button
                key={term}
                onClick={() => navigate(`/user/search?q=${encodeURIComponent(term)}`)}
                className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 hover:bg-gov-blue-50 hover:text-gov-blue transition-colors group text-left"
              >
                <span className="text-xs font-bold text-gray-300 w-5">{i + 1}</span>
                <span className="text-sm text-gray-700 group-hover:text-gov-blue transition-colors flex-1">
                  {term}
                </span>
                <Search size={12} className="text-gray-200 group-hover:text-gov-blue flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Latest Government Updates */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Latest Government Updates</h3>
          <button
            onClick={() => navigate('/user/updates')}
            className="text-gov-blue text-sm font-medium hover:underline flex items-center gap-1"
          >
            View all <ArrowRight size={13} />
          </button>
        </div>
        <div className="space-y-1">
          {displayUpdates.map((item, idx) => (
            <button
              key={`${item.id}-${idx}`}
              onClick={() => navigate(item.route || getUpdateRoute(item))}
              className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gov-blue-50 transition-colors cursor-pointer group text-left"
            >
              <TypeBadge type={item.type} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 group-hover:text-gov-blue transition-colors truncate">
                  {item.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{item.department}</p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {item.date ? new Date(item.date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                }) : 'New'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}