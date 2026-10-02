import { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@utils';
import { useAuth } from '@context/AuthContext';
import { useToast } from '@context/ToastContext';
import { apiClient } from '@services/apiClient';
import { motion, AnimatePresence } from 'framer-motion';

interface TopNavigationProps { onMenuClick?: () => void; }

interface Notification {
  id: string; type: string; title: string;
  message: string; isRead: boolean; createdAt: string;
}

interface ApiEnvelope<T> { success: boolean; data: T; }

const typeIcon: Record<string, string> = {
  battle:'⚔️', problem:'💡', adaptive:'🧠',
  classroom:'🏫', achievement:'🏆', system:'🔔',
};

const typeColor: Record<string, string> = {
  battle:     'rgba(245,158,11,0.12)',
  problem:    'rgba(6,182,212,0.12)',
  adaptive:   'rgba(217,70,239,0.12)',
  classroom:  'rgba(99,102,241,0.12)',
  achievement:'rgba(16,185,129,0.12)',
  system:     'rgba(100,116,139,0.12)',
};

function getInitials(name: string) {
  return name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
}
function getHue(name: string) {
  let h = 0; for (const c of name) h = (h*31+c.charCodeAt(0))%360; return h;
}

const roleBadge: Record<string, { text: string; bg: string; color: string }> = {
  student:  { text:'Student',  bg:'rgba(99,102,241,0.15)',  color:'#a5b4fc' },
  teacher:  { text:'Teacher',  bg:'rgba(217,70,239,0.15)',  color:'#f0abfc' },
  personal: { text:'Personal', bg:'rgba(16,185,129,0.15)',  color:'#6ee7b7' },
};

export function TopNavigation({ onMenuClick }: TopNavigationProps) {
  const { user, logout }  = useAuth();
  const { showToast }     = useToast();
  const navigate          = useNavigate();

  const [notifOpen, setNotifOpen]           = useState(false);
  const [profileOpen, setProfileOpen]       = useState(false);
  const [notifications, setNotifications]   = useState<Notification[]>([]);
  const [unread, setUnread]                 = useState(0);

  if (!user) return null;

  const basePath = user.role === 'teacher' ? '/teacher' : `/${user.role}`;
  const hue      = getHue(user.name);
  const rb       = roleBadge[user.role];

  // ── Load notifications ─────────────────────────────────────────────────
  const loadNotifs = useCallback(async () => {
    try {
      const [list, cnt] = await Promise.all([
        apiClient.get<ApiEnvelope<Notification[]>>('/notifications?limit=12'),
        apiClient.get<ApiEnvelope<{count:number}>>('/notifications/unread-count'),
      ]);
      setNotifications((list as any).data ?? []);
      setUnread((cnt as any).data?.count ?? 0);
    } catch { /* silently fail */ }
  }, []);

  useEffect(() => { loadNotifs(); }, [loadNotifs]);

  // ── Socket.IO push ─────────────────────────────────────────────────────
  useEffect(() => {
    let sock: any = null;
    (async () => {
      try {
        const { io } = await import('socket.io-client');
        const token = localStorage.getItem('devclash_token');
        if (!token) return;
        const url = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api').replace(/\/api$/, '');
        sock = (io as any)(url, { auth: { token }, autoConnect: true });
        sock.on('notification:new', (n: Notification) => {
          setNotifications(p => [n, ...p.slice(0,11)]);
          setUnread(c => c + 1);
          showToast({ type:'info', title: n.title, message: n.message });
        });
        sock.on('battle:finished', () => loadNotifs());
      } catch { /* socket optional */ }
    })();
    return () => sock?.disconnect();
  }, [loadNotifs, showToast]);

  const markRead = async () => {
    try {
      await apiClient.post('/notifications/mark-read', {});
      setNotifications(p => p.map(n => ({...n, isRead:true})));
      setUnread(0);
    } catch { /* ignore */ }
  };

  const openNotifs = () => { setNotifOpen(true); if (unread > 0) markRead(); };

  return (
    <>
      <header
        className="sticky top-0 z-20 topnav-bg"
        style={{ height:56 }}
      >
        <div className="flex items-center justify-between h-full px-4 lg:px-5">

          {/* Left: mobile menu + logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuClick}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-surface-400 hover:text-white hover:bg-white/5 transition-all"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>

            <NavLink to={`${basePath}/dashboard`} className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white"
                style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow:'0 0 12px rgba(99,102,241,0.45)' }}
              >
                DC
              </div>
              <span className="hidden sm:block font-bold text-sm text-white tracking-tight">DevClash</span>
            </NavLink>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1.5">

            {/* Role pill */}
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: rb.bg, color: rb.color, border:`1px solid ${rb.color}28` }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse-soft" style={{ background: rb.color }} />
              {rb.text}
            </div>

            {/* Notification bell */}
            <button
              onClick={openNotifs}
              className="relative w-9 h-9 flex items-center justify-center rounded-lg text-surface-400 hover:text-white hover:bg-white/5 transition-all"
              aria-label="Notifications"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              <AnimatePresence>
                {unread > 0 && (
                  <motion.span
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background:'linear-gradient(135deg,#f59e0b,#ef4444)', boxShadow:'0 0 8px rgba(245,158,11,0.6)' }}
                    initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }}
                    transition={{ type:'spring', stiffness:400, damping:20 }}
                  >
                    {unread > 9 ? '9+' : unread}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Avatar + profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(p => !p)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                  style={{ background:`linear-gradient(135deg,hsl(${hue},65%,55%),hsl(${(hue+40)%360},65%,45%))` }}
                >
                  {getInitials(user.name)}
                </div>
                <span className="hidden md:block text-sm font-medium text-surface-200 max-w-[120px] truncate">{user.name}</span>
                <svg className={cn('hidden md:block w-3.5 h-3.5 text-surface-500 transition-transform', profileOpen && 'rotate-180')}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden z-50"
                    style={{ background:'#0d1117', border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 20px 60px rgba(0,0,0,0.6)' }}
                    initial={{ opacity:0, y:-8, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:-8, scale:0.95 }}
                    transition={{ duration:0.15, ease:[0.16,1,0.3,1] }}
                  >
                    {/* Header */}
                    <div className="px-4 py-3" style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                      <p className="text-xs text-surface-500 truncate mt-0.5">{user.email}</p>
                    </div>

                    {/* Items */}
                    <div className="p-1.5 space-y-0.5">
                      <button
                        onClick={() => { navigate(`${basePath}/profile`); setProfileOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-surface-300 hover:text-white hover:bg-white/5 transition-all text-left"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" strokeLinecap="round"/>
                        </svg>
                        Profile
                      </button>
                    </div>

                    <div style={{ height:1, background:'rgba(255,255,255,0.06)', margin:'0 8px' }} />

                    <div className="p-1.5">
                      <button
                        onClick={() => { logout(); setProfileOpen(false); showToast({ type:'info', title:'Logged out', message:'See you next time!' }); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-duel-400 hover:text-duel-300 hover:bg-duel-500/10 transition-all text-left"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                        </svg>
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Click-away for profile */}
      {profileOpen && <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />}

      {/* Notifications drawer */}
      <AnimatePresence>
        {notifOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setNotifOpen(false)}
            />
            <motion.aside
              className="fixed right-0 top-0 bottom-0 z-50 w-80 flex flex-col"
              style={{ background:'#0d1117', borderLeft:'1px solid rgba(255,255,255,0.07)' }}
              initial={{ x:320, opacity:0 }} animate={{ x:0, opacity:1 }} exit={{ x:320, opacity:0 }}
              transition={{ type:'spring', stiffness:380, damping:38 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-white">Notifications</span>
                  {unread > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background:'rgba(245,158,11,0.2)', color:'#fbbf24' }}>
                      {unread} new
                    </span>
                  )}
                </div>
                <button onClick={() => setNotifOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-surface-500 hover:text-white hover:bg-white/5 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-16">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background:'rgba(255,255,255,0.04)' }}>🔔</div>
                    <p className="text-sm text-surface-500">No notifications yet</p>
                  </div>
                ) : notifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 p-3 rounded-xl transition-all"
                    style={{
                      background: !n.isRead ? (typeColor[n.type] ?? 'rgba(99,102,241,0.08)') : 'transparent',
                      border: !n.isRead ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
                    }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background:'rgba(255,255,255,0.04)' }}>
                      {typeIcon[n.type] ?? '🔔'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-semibold leading-snug', !n.isRead ? 'text-white' : 'text-surface-300')}>
                        {n.title}
                      </p>
                      <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-surface-600 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!n.isRead && <span className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background:'#6366f1', boxShadow:'0 0 6px rgba(99,102,241,0.8)' }} />}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-4 py-3" style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                <button
                  onClick={markRead}
                  disabled={unread === 0}
                  className="w-full py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                  style={{ background:'rgba(99,102,241,0.12)', color:'#a5b4fc', border:'1px solid rgba(99,102,241,0.2)' }}
                >
                  Mark all as read
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
