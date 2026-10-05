import React, { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PageHeader, BackNavigation, Pagination } from '../../components/common';
import { TrendingUp, RefreshCw, FileText, Users, Database, BookOpen } from 'lucide-react';
import { fetchDashboardStats, fetchAllUsers } from '../../services/adminService';

const COLORS = ['#003087', '#0052CC', '#FF6B00', '#138808', '#8B5CF6', '#6B7280'];

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [monthlyGrowth, setMonthlyGrowth] = useState([]);
  const [stateData, setStateData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [schemesList, setSchemesList] = useState([]);
  const [contentGaps, setContentGaps] = useState([]);
  const [docPage, setDocPage] = useState(1);
  const [gapPage, setGapPage] = useState(1);

  const loadData = async () => {
    setLoading(true);
    const token = localStorage.getItem('infoseva_access_token') || sessionStorage.getItem('jwt_token');
    const [statsRes, usersRes, gapsRes] = await Promise.all([
      fetchDashboardStats(),
      fetchAllUsers(),
      fetch('http://localhost:8082/api/analytics/content-gaps?page=0&size=10', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      }).then(r => r.json()).catch(() => ({ data: { content: [] } }))
    ]);

    if (gapsRes?.data?.content) {
      setContentGaps(gapsRes.data.content);
    }


    const s = statsRes.data || {};
    const uList = usersRes.data || [];
    setStats(s);
    setUsersList(uList);

    // Monthly Growth from actual database users
    if (s.userRegistrationsByMonth && s.userRegistrationsByMonth.length) {
      setMonthlyGrowth(s.userRegistrationsByMonth.map(m => ({
        month: m.month,
        users: m.count,
      })));
    } else {
      setMonthlyGrowth([]);
    }

    // Real State distribution from Oracle USER_PROFILES / ADDRESSES
    const stateMap = {};
    uList.forEach(u => {
      const state = u.state || u.city || 'Tamil Nadu';
      stateMap[state] = (stateMap[state] || 0) + 1;
    });
    setStateData(Object.entries(stateMap).map(([state, users]) => ({ state, users })));

    // Real Document Category distribution from Oracle DOCUMENTS
    const docs = s.rawDocs || [];
    const catMap = {};
    docs.forEach(d => {
      const cat = d.category || 'General';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    const totalDocs = docs.length || 1;
    setCategoryData(Object.entries(catMap).map(([name, count]) => ({
      name,
      value: Math.round((count / totalDocs) * 100),
      count,
    })));

    // Real Schemes from Oracle SCHEMES table
    const schemes = s.rawSchemes || [];
    setSchemesList(schemes.slice(0, 6));

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-5">
      {/* Dual Back Navigation */}
      <BackNavigation dashboardPath="/admin/dashboard" />

      <PageHeader
        title="Platform Analytics"
        subtitle="Real database metrics, user demographics, and document reports based on timestamps."
        actions={
          <button onClick={loadData} disabled={loading} className="btn-secondary text-sm flex items-center gap-1.5">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        }
      />

      {/* KPI Row from Real Database */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, color: 'text-gov-blue' },
          { label: 'Documents Uploaded', value: stats?.documentsUploaded ?? 0, icon: Database, color: 'text-purple-600' },
          { label: 'Citizens Registered', value: stats?.citizens ?? 0, icon: Users, color: 'text-gov-saffron' },
          { label: 'Data Managers', value: stats?.dataManagers ?? 0, icon: Users, color: 'text-gov-green' },
        ].map(k => (
          <div key={k.label} className="card p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">Live Database Record</p>
          </div>
        ))}
      </div>

      {/* Real User Growth Chart based on Registration Timestamps */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">User Registration Growth by Date</h3>
          {monthlyGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyGrowth}>
                <defs>
                  <linearGradient id="gu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#003087" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#003087" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="users" stroke="#003087" fill="url(#gu)" strokeWidth={2} name="Users" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-xs text-gray-400">
              No registration history available
            </div>
          )}
        </div>

        {/* Real User Demographics by State */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">User Demographics by State</h3>
          {stateData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stateData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="state" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="users" fill="#003087" radius={[4, 4, 0, 0]} name="Users" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-xs text-gray-400">
              No demographic data available
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Document Categories Pie */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Documents by Category</h3>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={75} dataKey="value">
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto">
                {categoryData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{d.name}
                    </div>
                    <span className="font-semibold text-gray-600">{d.value}% ({d.count})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-xs text-gray-400">
              No documents uploaded yet
            </div>
          )}
        </div>

        {/* Real Document Reports Table */}
        <div className="lg:col-span-2 card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Uploaded Documents Report (By Timestamp)</h3>
          {stats?.rawDocs && stats.rawDocs.length > 0 ? (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 uppercase">
                      <th className="py-2 text-left pr-3">Title</th>
                      <th className="py-2 text-left pr-3">Category</th>
                      <th className="py-2 text-left pr-3">Upload Date</th>
                      <th className="py-2 text-left pr-3">Published / Added By</th>
                      <th className="py-2 text-right">Size</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {stats.rawDocs.slice((docPage - 1) * 5, docPage * 5).map((doc, idx) => (
                      <tr key={doc.documentId || doc.id || idx} className="hover:bg-gray-50">
                        <td className="py-2 pr-3 font-medium text-gray-800 truncate max-w-xs">{doc.title}</td>
                        <td className="py-2 pr-3 text-gray-500">{doc.category || 'General'}</td>
                        <td className="py-2 pr-3 text-gray-500">{doc.uploadDate || doc.createdAt || 'Recent'}</td>
                        <td className="py-2 pr-3 text-gray-700 font-medium truncate max-w-[150px]">
                          {doc.approvedBy || doc.createdBy || 'Data Manager'}
                        </td>
                        <td className="py-2 text-right font-mono text-gray-600">
                          {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={docPage}
                totalItems={stats.rawDocs.length}
                pageSize={5}
                onPageChange={setDocPage}
              />
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-xs text-gray-400">
              No uploaded documents in repository
            </div>
          )}
        </div>
      </div>

      {/* Real Content Gaps / Search Demand Table */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-red-500" />
            <h3 className="font-semibold text-gray-800">Unanswered Citizen Queries & Content Gaps</h3>
          </div>
          <span className="text-xs text-gray-400 font-medium">Real-time Search Demand</span>
        </div>
        {contentGaps.length > 0 ? (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 uppercase">
                    <th className="py-2 text-left pr-3">Citizen Search Query</th>
                    <th className="py-2 text-center pr-3">Searches</th>
                    <th className="py-2 text-left pr-3">Last Searched</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {contentGaps.slice((gapPage - 1) * 5, gapPage * 5).map((gap) => (
                    <tr key={gap.queryId || gap.id} className="hover:bg-gray-50">
                      <td className="py-2.5 pr-3 font-semibold text-gray-800">{gap.keyword}</td>
                      <td className="py-2.5 pr-3 text-center font-bold text-red-600">{gap.searchCount}</td>
                      <td className="py-2.5 pr-3 text-gray-500">
                        {gap.lastSearchedAt ? new Date(gap.lastSearchedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently'}
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="badge text-[10px] bg-red-50 text-red-700 border border-red-200">
                          Content Gap
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={gapPage}
              totalItems={contentGaps.length}
              pageSize={5}
              onPageChange={setGapPage}
            />
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-gray-400">
            No unanswered citizen queries logged yet
          </div>
        )}
      </div>

      {/* Real Schemes List from Database */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Active Government Schemes in Database</h3>
        {schemesList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {schemesList.map((scheme, i) => (
              <div key={scheme.id || i} className="p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen size={14} className="text-gov-blue" />
                  <p className="text-xs font-semibold text-gray-800 truncate">{scheme.title}</p>
                </div>
                <p className="text-[11px] text-gray-500 line-clamp-2">{scheme.description || 'Government assistance scheme'}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-gray-400">
            No government schemes currently indexed in database
          </div>
        )}
      </div>
    </div>
  );
}

