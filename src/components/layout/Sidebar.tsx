import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@utils';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { useAuth } from '@context/AuthContext';
import type { UserRole } from '../../types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
  badge?: string | number;
  children?: NavItem[];
}

const studentNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/student', icon: '📊', roles: ['student', 'personal'] },
  { label: 'Practice', href: '/student/practice', icon: '💻', roles: ['student', 'personal'] },
  { label: 'Adaptive', href: '/student/adaptive', icon: '🧠', roles: ['student', 'personal'] },
  { label: 'Duel', href: '/student/duel', icon: '⚔️', roles: ['student', 'personal'] },
  { label: 'Leaderboard', href: '/student/leaderboard', icon: '🏆', roles: ['student', 'personal'] },
  { label: 'Profile', href: '/student/profile', icon: '👤', roles: ['student', 'personal'] },
];

const teacherNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/teacher', icon: '📊', roles: ['teacher'] },
  { label: 'Classrooms', href: '/teacher/classrooms', icon: '🏫', roles: ['teacher'] },
  { label: 'Students', href: '/teacher/students', icon: '👥', roles: ['teacher'] },
  { label: 'Analytics', href: '/teacher/analytics', icon: '📈', roles: ['teacher'] },
  { label: 'Problems', href: '/teacher/problems', icon: '📝', roles: ['teacher'] },
  { label: 'Leaderboard', href: '/teacher/leaderboard', icon: '🏆', roles: ['teacher'] },
];

const personalNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/personal', icon: '📊', roles: ['personal'] },
  { label: 'Practice', href: '/personal/practice', icon: '💻', roles: ['personal'] },
  { label: 'Adaptive', href: '/personal/adaptive', icon: '🧠', roles: ['personal'] },
  { label: 'Duel', href: '/personal/duel', icon: '⚔️', roles: ['personal'] },
  { label: 'Leaderboard', href: '/personal/leaderboard', icon: '🏆', roles: ['personal'] },
  { label: 'Profile', href: '/personal/profile', icon: '👤', roles: ['personal'] },
];

function getNavItems(role: UserRole): NavItem[] {
  switch (role) {
    case 'student':
      return studentNavItems;
    case 'teacher':
      return teacherNavItems;
    case 'personal':
      return personalNavItems;
  }
}

function NavIcon({ icon, active }: { icon: React.ReactNode; active: boolean }) {
  return (
    <span
      className={cn(
        'flex-shrink-0 w-6 h-6 flex items-center justify-center text-lg transition-transform',
        active && 'scale-110'
      )}
      aria-hidden="true"
    >
      {icon}
    </span>
  );
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const navItems = getNavItems(user.role);
  const basePath = user.role === 'teacher' ? '/teacher' : `/${user.role}`;

  const isActive = (href: string) => {
    if (href === basePath) return location.pathname === basePath;
    return location.pathname.startsWith(href);
  };

  return (
    <>
      <button
        className="fixed top-4 left-4 z-40 lg:hidden p-2 rounded-lg bg-white dark:bg-surface-900 shadow-lg border border-surface-200 dark:border-surface-700"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-30 bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-700 transition-all duration-300 flex flex-col',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-surface-200 dark:border-surface-700">
          <div className={cn('flex items-center gap-3 transition-opacity', collapsed && 'opacity-0 pointer-events-none justify-center')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">DC</span>
            </div>
            <span className="font-semibold text-xl text-surface-900 dark:text-white">
              DevClash
            </span>
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors lg:hidden"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className={cn('w-5 h-5 transition-transform', collapsed && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" role="navigation" aria-label="Main">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive: active }: { isActive: boolean }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
                active
                  ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-white',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              <NavIcon icon={item.icon} active={isActive(item.href)} />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <Badge variant="brand" size="sm">{item.badge}</Badge>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-surface-200 dark:border-surface-700">
          {!collapsed ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-2 py-2">
                <Avatar name={user.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
                    {user.email}
                  </p>
                </div>
                <Badge variant={user.role} size="sm" dot>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
              </div>
              <Button
                variant="ghost"
                fullWidth
                leftIcon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>}
                onClick={logout}
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Avatar name={user.name} size="md" />
              <Badge variant={user.role} size="sm" dot className="mx-auto">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center"
                onClick={logout}
                title="Logout"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </Button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}