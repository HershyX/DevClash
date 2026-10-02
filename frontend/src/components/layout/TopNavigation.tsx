import { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@utils';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { useAuth } from '@context/AuthContext';
import { useToast } from '@context/ToastContext';
import { apiClient } from '@services/apiClient';

interface TopNavigationProps {
  onMenuClick?: () => void;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface ApiEnvelope<T> { success: boolean; data: T; }

export function TopNavigation({ onMenuClick }: TopNavigationProps) {
  const { user, logout } = useAuth();
  const { showToast }    = useToast();
  const location         = useLocation();

  const [profileOpen, setProfileOpen]         = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications]     = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount]         = useState(0);

  if (!user) return null;

  const basePath = user.role === 'teacher' ? '/teacher' : `/${user.role}`;

  // ── Load notifications & unread count ────────────────────────────────────────
  const loadNotifications = useCallback(async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        apiClient.get<ApiEnvelope<Notification[]>>('/notifications?limit=10'),
        apiClient.get<ApiEnvelope<{ count: number }>>('/notifications/unread-count'),
      ]);
      setNotifications((listRes as any).data ?? []);
      setUnreadCount((countRes as any).data?.count ?? 0);
    } catch { /* keep previous state */ }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  // ── Socket.IO: receive push notifications in real-time ───────────────────────
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
          setNotifications((prev) => [n, ...prev.slice(0, 9)]);
          setUnreadCount((c) => c + 1);
          showToast({ type: 'info', title: n.title, message: n.message });
        });

        // battle:finished pushed to user room — refresh notifications
        sock.on('battle:finished', () => { loadNotifications(); });
      } catch { /* socket optional */ }
    })();
    return () => { sock?.disconnect(); };
  }, [loadNotifications, showToast]);

  const handleMarkAllRead = async () => {
    try {
      await apiClient.post('/notifications/mark-read', {});
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const handleOpenNotifications = () => {
    setNotificationsOpen(true);
    // Mark as read when panel opens
    if (unreadCount > 0) handleMarkAllRead();
  };

  const typeIcon: Record<string, string> = {
    battle: '⚔️', problem: '💡', adaptive: '🧠', classroom: '🏫', achievement: '🏆', system: '🔔',
  };

  const getProfileItems = () => [
    { label: 'Profile', href: `${basePath}/profile`, icon: '👤' },
  ];

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-surface-900/80 backdrop-blur-md border-b border-surface-200 dark:border-surface-700">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors" aria-label="Open menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <NavLink to="/"
            className={cn('flex items-center gap-2 font-semibold text-xl text-surface-900 dark:text-white',
              location.pathname === '/' && 'text-brand-600 dark:text-brand-400')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
              <span className="text-white font-bold">DC</span>
            </div>
            <span className="hidden sm:inline">DevClash</span>
          </NavLink>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          {/* Notification Bell */}
          <Button variant="ghost" size="sm" className="relative" onClick={handleOpenNotifications}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0018 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-duel-500 text-white text-xs font-medium flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          <div className="hidden lg:flex items-center gap-3 px-3 py-2 bg-surface-50 dark:bg-surface-800/50 rounded-lg border border-surface-200 dark:border-surface-700">
            <Badge variant={user.role as any} dot size="sm">
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </Badge>
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{user.name}</span>
          </div>

          <div className="relative">
            <button onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              aria-expanded={profileOpen} aria-haspopup="true">
              <Avatar name={user.name} size="sm" />
              <svg className="w-4 h-4 text-surface-400 hidden lg:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {profileOpen && (
              <Modal isOpen={profileOpen} onClose={() => setProfileOpen(false)} size="sm" className="max-w-sm">
                <div className="space-y-1">
                  {getProfileItems().map((item) => (
                    <NavLink key={item.href} to={item.href} onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors">
                      <span className="text-lg">{item.icon}</span>{item.label}
                    </NavLink>
                  ))}
                  <hr className="my-2 border-surface-200 dark:border-surface-700" />
                  <button onClick={() => { logout(); setProfileOpen(false); showToast({ type: 'info', title: 'Logged out', message: 'See you next time!' }); }}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-duel-600 dark:text-duel-400 hover:bg-duel-50 dark:hover:bg-duel-900/20 rounded-lg transition-colors w-full text-left">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </Modal>
            )}
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      <Modal isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} title="Notifications" size="lg">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-surface-500 dark:text-surface-400">No notifications yet</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id}
                className={cn('flex items-start gap-3 p-3 rounded-lg transition-colors',
                  !n.isRead ? 'bg-brand-50 dark:bg-brand-900/20' : 'hover:bg-surface-100 dark:hover:bg-surface-800')}>
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xl',
                  !n.isRead ? 'bg-brand-100 dark:bg-brand-900/30' : 'bg-surface-100 dark:bg-surface-800')}>
                  {typeIcon[n.type] ?? '🔔'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('font-medium text-sm', !n.isRead ? 'text-surface-900 dark:text-white' : 'text-surface-700 dark:text-surface-300')}>
                    {n.title}
                  </p>
                  <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">{n.message}</p>
                  <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                {!n.isRead && <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1" />}
              </div>
            ))
          )}
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-surface-200 dark:border-surface-700">
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
            Mark all read
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setNotificationsOpen(false)}>Close</Button>
        </div>
      </Modal>
    </header>
  );
}
