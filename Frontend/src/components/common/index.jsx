import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, TrendingUp, Search as SearchIcon, Camera, User as UserIcon } from 'lucide-react';
import { getSearchSuggestions } from '../../data/dummyData';

// Reusable pagination control. Pass current page (1-indexed), total item
// count, page size, and a setter — used across list-heavy pages.
export function Pagination({ page, totalItems, pageSize = 10, onPageChange, className = '' }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalPages <= 1) return null;

  const go = (p) => onPageChange(Math.min(Math.max(1, p), totalPages));

  const pages = [];
  const windowSize = 1;
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= windowSize) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 ${className}`}>
      <p className="text-xs text-gray-500">
        Showing <span className="font-semibold text-gray-700">{start}–{end}</span> of{' '}
        <span className="font-semibold text-gray-700">{totalItems}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => go(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-gov-blue hover:text-gov-blue disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-500 transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={15} />
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => go(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                p === page ? 'bg-gov-blue text-white' : 'border border-gray-200 text-gray-600 hover:border-gov-blue hover:text-gov-blue'
              }`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => go(page + 1)}
          disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-gov-blue hover:text-gov-blue disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-500 transition-colors"
          aria-label="Next page"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// Slice helper: paginate(items, page, pageSize)
export function paginate(items, page, pageSize = 10) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

// Ashoka Emblem as SVG (simplified official-style)
export function AshokaEmblem({ size = 48, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Base platform */}
      <rect x="10" y="65" width="60" height="6" rx="2" fill="#003087"/>
      {/* Abacus with animals (simplified) */}
      <rect x="14" y="58" width="52" height="8" rx="2" fill="#003087"/>
      {/* Lions (simplified pillars) */}
      <ellipse cx="28" cy="52" rx="7" ry="9" fill="#003087"/>
      <ellipse cx="52" cy="52" rx="7" ry="9" fill="#003087"/>
      <ellipse cx="40" cy="50" rx="7" ry="9" fill="#003087"/>
      {/* Lion heads */}
      <circle cx="28" cy="42" r="6" fill="#003087"/>
      <circle cx="52" cy="42" r="6" fill="#003087"/>
      <circle cx="40" cy="40" r="6" fill="#003087"/>
      {/* Mane details */}
      <circle cx="28" cy="42" r="4" fill="#0052CC"/>
      <circle cx="52" cy="42" r="4" fill="#0052CC"/>
      <circle cx="40" cy="40" r="4" fill="#0052CC"/>
      {/* Dharma Chakra */}
      <circle cx="40" cy="30" r="10" fill="none" stroke="#003087" strokeWidth="2.5"/>
      <circle cx="40" cy="30" r="3" fill="#003087"/>
      {[0,30,60,90,120,150,180,210,240,270,300,330,15,45,75,105,135,165,195,225,255,285,315,345].map((deg, i) => {
        const r = deg * Math.PI / 180;
        return <line key={i} x1={40 + 3*Math.cos(r)} y1={30 + 3*Math.sin(r)} x2={40 + 9*Math.cos(r)} y2={30 + 9*Math.sin(r)} stroke="#003087" strokeWidth={i < 12 ? 1.5 : 0.8}/>;
      })}
      {/* Devanagari text style base */}
      <text x="40" y="78" textAnchor="middle" fontSize="5" fill="#003087" fontFamily="serif" fontWeight="bold">सत्यमेव जयते</text>
    </svg>
  );
}

export function TricolorBar() {
  return <div className="tricolor-bar w-full" />;
}

export function Badge({ children, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    saffron: 'bg-orange-100 text-orange-800',
    red: 'bg-red-100 text-red-800',
    purple: 'bg-purple-100 text-purple-800',
    gray: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`badge ${colors[color]}`}>{children}</span>
  );
}

export function StatCard({ label, value, trend, icon: Icon, color = 'blue' }) {
  const colors = {
    blue: 'from-gov-blue-50 to-white border-gov-blue/20',
    green: 'from-green-50 to-white border-green-200',
    saffron: 'from-orange-50 to-white border-orange-200',
    purple: 'from-purple-50 to-white border-purple-200',
  };
  const iconColors = {
    blue: 'text-gov-blue bg-gov-blue-100',
    green: 'text-green-700 bg-green-100',
    saffron: 'text-orange-600 bg-orange-100',
    purple: 'text-purple-700 bg-purple-100',
  };
  return (
    <div className={`card p-5 bg-gradient-to-br ${colors[color]} border`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && <p className="text-xs text-green-600 mt-1 font-medium">{trend} this month</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${iconColors[color]}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}

export function SearchBar({ placeholder = 'Search...', value, onChange, onSearch, large = false, showSuggestions = true }) {
  const [open, setOpen] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState([]);
  const boxRef = React.useRef(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!showSuggestions) return;
    if (!value || value.trim().length < 2) { setSuggestions([]); setOpen(false); return; }
    const list = getSearchSuggestions(value, 8);
    setSuggestions(list);
    setOpen(list.length > 0);
  }, [value, showSuggestions]);

  React.useEffect(() => {
    const onClick = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const pick = (s) => {
    setOpen(false);
    if (onChange) onChange({ target: { value: s.text } });
    if (s.route) navigate(s.route);
    else if (onSearch) onSearch(s.text);
  };

  return (
    <div ref={boxRef} className={`relative flex flex-col ${large ? 'w-full max-w-3xl' : 'w-full'}`}>
      <div className="relative flex items-center">
        <input
          type="text"
          className={`w-full ${large ? 'py-4 px-6 text-base' : 'py-2.5 px-4 text-sm'} pr-12 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gov-blue/30 focus:border-gov-blue shadow-sm`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={e => e.key === 'Enter' && onSearch && onSearch()}
        />
        <button onClick={onSearch} className="absolute right-3 p-1.5 bg-gov-blue text-white rounded-lg hover:bg-gov-blue-dark transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </button>
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-xl shadow-lg z-40 overflow-hidden">
          {suggestions.map((s, i) => (
            <button key={`${s.text}-${i}`} onClick={() => pick(s)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gov-blue-50 transition-colors border-b border-gray-50 last:border-0">
              {s.icon === 'trend'
                ? <TrendingUp size={13} className="text-gray-300 flex-shrink-0" />
                : <SearchIcon size={13} className="text-gray-400 flex-shrink-0" />}
              <span className="truncate">{s.text}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="section-header">{title}</h1>
        {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-gov-blue-50 rounded-full flex items-center justify-center mb-4">
        {Icon && <Icon size={28} className="text-gov-blue" />}
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
      <p className="text-gray-400 text-sm max-w-xs mb-4">{description}</p>
      {action}
    </div>
  );
}

export function LoadingSkeleton({ lines = 3 }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array(lines).fill(0).map((_, i) => (
        <div key={i} className={`h-4 bg-gray-200 rounded ${i % 2 === 0 ? 'w-full' : 'w-3/4'}`} />
      ))}
    </div>
  );
}

export function TypeBadge({ type }) {
  const map = {
    Scheme: ['bg-green-100 text-green-800', 'Scheme'],
    Act: ['bg-purple-100 text-purple-800', 'Act'],
    Procedure: ['bg-blue-100 text-blue-700', 'Procedure'],
    Circular: ['bg-orange-100 text-orange-700', 'Circular'],
    'Government Order': ['bg-red-100 text-red-700', 'G.O.'],
    RTI: ['bg-yellow-100 text-yellow-700', 'RTI'],
    'Financial Scheme': ['bg-emerald-100 text-emerald-700', 'Finance'],
  };
  const [cls, label] = map[type] || ['bg-gray-100 text-gray-600', type];
  return <span className={`badge ${cls}`}>{label}</span>;
}

// ─── Profile Image Upload ────────────────────────────────────────────────────
// Reusable avatar upload used on User / Admin / Data Manager profile pages.
// No backend yet — stores the image as a local object URL / data URL only
// for the current session (nothing is persisted or uploaded anywhere).
export function ProfileImageUpload({ initialUrl = null, name = '', size = 96, onChange, editable = true }) {
  const [preview, setPreview] = React.useState(initialUrl);
  const [error, setError] = React.useState('');
  const inputRef = React.useRef(null);

  const initials = (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') || '?';

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG, or WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB.');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
      onChange && onChange(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPreview(null);
    onChange && onChange(null);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <div
          className="rounded-full overflow-hidden flex items-center justify-center bg-gov-blue-50 border-2 border-white shadow-md"
          style={{ width: size, height: size }}
        >
          {preview ? (
            <img src={preview} alt={name || 'Profile'} className="w-full h-full object-cover" />
          ) : (
            <span className="font-bold text-gov-blue" style={{ fontSize: size * 0.32 }}>{initials}</span>
          )}
        </div>
        {editable && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-label="Change profile photo"
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gov-blue text-white flex items-center justify-center shadow-lg hover:bg-gov-blue-dark transition-colors border-2 border-white"
          >
            <Camera size={14} />
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      {editable && preview && (
        <button type="button" onClick={removePhoto} className="text-xs text-red-500 hover:underline">
          Remove photo
        </button>
      )}
      {error && <p className="text-xs text-red-500 max-w-[180px] text-center">{error}</p>}
    </div>
  );
}

export { default as Switch } from './Switch';
export { default as BackNavigation } from './BackNavigation';
