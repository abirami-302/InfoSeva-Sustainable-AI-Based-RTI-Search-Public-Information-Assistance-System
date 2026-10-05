import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCheck, Trash2, ExternalLink, Info, Upload, Database, ClipboardCheck, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDataManager } from '../../context/DataManagerContext';

const TYPE_CONFIG = {
  review:  { icon: ClipboardCheck, color: 'text-orange-500', bg: 'bg-orange-50' },
  api:     { icon: Database,       color: 'text-gov-blue',   bg: 'bg-gov-blue-50' },
  upload:  { icon: Upload,         color: 'text-green-600',  bg: 'bg-green-50' },
  gap:     { icon: AlertCircle,    color: 'text-red-500',    bg: 'bg-red-50' },
  info:    { icon: Info,           color: 'text-gray-500',   bg: 'bg-gray-50' },
  delete:  { icon: Trash2,         color: 'text-red-500',    bg: 'bg-red-50' },
};

export function NotificationBell() {
  const { notifications, unreadNotificationCount, markNotificationsRead, markSingleRead, deleteNotification, clearAllNotifications } = useDataManager();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  const unread = unreadNotificationCount;

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleNotifClick = (notif) => {
    markSingleRead(notif.id);
    if (notif.route) navigate(notif.route);
    setOpen(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative text-gray-500 hover:text-gov-blue transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gov-saffron rounded-full text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 bg-white rounded-2xl shadow-2xl border border-gray-100 w-80 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Bell size={15} className="text-gov-blue" />
                <span className="text-sm font-bold text-gray-800">Notifications</span>
                {unread > 0 && (
                  <span className="bg-gov-saffron text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {unread}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button
                    onClick={markNotificationsRead}
                    className="text-xs text-gov-blue hover:underline flex items-center gap-1"
                    title="Mark all as read"
                  >
                    <CheckCheck size={12} /> Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    title="Clear all"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={28} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 font-medium">All caught up!</p>
                  <p className="text-xs text-gray-300 mt-0.5">No new notifications.</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${
                        n.read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/30 hover:bg-blue-50/50'
                      }`}
                      onClick={() => handleNotifClick(n)}
                    >
                      <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon size={14} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-snug ${n.read ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>
                          {n.text}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-gray-400">{n.time}</span>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 bg-gov-blue rounded-full" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {n.route && (
                          <span className="text-gov-blue opacity-60">
                            <ExternalLink size={11} />
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                          className="text-gray-300 hover:text-red-400 transition-colors p-0.5"
                          title="Dismiss"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50 text-center">
                <button
                  onClick={() => { navigate('/datamanager'); setOpen(false); }}
                  className="text-xs text-gov-blue font-medium hover:underline"
                >
                  View all activity
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}