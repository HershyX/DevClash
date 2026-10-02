import React from 'react';
import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@utils';
import { useAuth } from '@context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserRole } from '../../types';

interface NavItem {
  label: string;
  href:  string;
  icon:  string;
  roles: UserRole[];
  color?: string;
}

// SVG icons for nav items — crisp and minimal
const icons: Record<string, React.ReactElement> = {
  dashboard: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4.5 h-4.5 w-[18px] h-[18px]">
      <rect x="2" y="2" width="7" height="7" rx="1.5" /><rect x="11" y="2" width="7" height="7" rx="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" /><rect x="11" y="11" width="7" height="7" rx="1.5" />
    </svg>
  ),
  practice: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-[18px] h-[18px]">
      <polyline points="4 15 8 9 12 12 16 5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  adaptive: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-[18px] h-[18px]">
      <path d="M10 2a8 8 0 100 16A8 8 0 0010 2z" /><path d="M10 6v4l2.5 2.5" strokeLinecap="round"/>
    </svg>
  ),
  duel: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-[18px] h-[18px]">
      <path d="M3 17L17 3M7 3H3v4M13 17h4v-4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  leaderboard: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-[18px] h-[18px]">
      <rect x="2" y="11" width="4" height="7" rx="1"/><rect x="8" y="7" width="4" height="11" rx="1"/>
      <rect x="14" y="3" width="4" height="15" rx="1"/>
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-[18px] h-[18px]">
      <circle cx="10" cy="7" r="3.5"/><path d="M2.5 18c0-4.142 3.358-7.5 7.5-7.5s7.5 3.358 7.5 7.5" strokeLinecap="round"/>
    </svg>
  ),
  classrooms: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-[18px] h-[18px]">
      <path d="M2 7l8-4 8 4-8 4-8-4z" strokeLinejoin="round"/><path d="M6 9.5v4.5l4 2 4-2V9.5" strokeLinejoin="round"/>
    </svg>
  ),
  students: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-[18px] h-[18px]">
      <circle cx="7" cy="7" r="3"/><path d="M1 18c0-3.314 2.686-6 6-6h0c3.314 0 6 2.686 6 6"/>
      <circle cx="15" cy="6" r="2.5"/><path d="M13 18c0-2.761 2.239-5 5-5" strokeLinecap="round"/>
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-[18px] h-[18px]">
      <path d="M2 14l5-5 4 4 7-8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="7" cy="9" r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="11" cy="13" r="1.2" fill="currentColor" stroke="none"/>
    </svg>
  ),
  problems: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-[18px] h-[18px]">
      <rect x="3" y="2" width="14" height="16" rx="2"/>
      <path d="M7 7h6M7 10h6M7 13h4" strokeLinecap="round"/>
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-[18px] h-[18px]">
      <path d="M13 10H3M10 7l3 3-3 3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 4H4a1 1 0 00-1 1v10a1 1 0 001 1h3" strokeLinecap="round"/>
    </svg>
  ),
};

// Per-nav accent colour
const navAccents: Record<string, string> = {
  dashboard:   'text-brand-400',
  practice:    'text-practice-400',
  adaptive:    'text-adaptive-400',
  duel:        'text-duel-400',
  leaderboard: 'text-yellow-400',
  profile:     'text-emerald-400',
  classrooms:  'text-brand-400',
  students:    'text-practice-400',
  analytics:   'text-adaptive-400',
  problems:    'text-duel-400',
};

const navBg: Record<string, string> = {
  dashboard:   'rgba(99,102,241,0.12)',
  practice:    'rgba(6,182,212,0.12)',
  adaptive:    'rgba(217,70,239,0.12)',
  duel:        'rgba(245,158,11,0.12)',
  leaderboard: 'rgba(234,179,8,0.12)',
  profile:     'rgba(16,185,129,0.12)',
  classrooms:  'rgba(99,102,241,0.12)',
  students:    'rgba(6,182,212,0.12)',
  analytics:   'rgba(217,70,239,0.12)',
  problems:    'rgba(245,158,11,0.12)',
};

const activeBorder: Record<string, string> = {
  dashboard:   'linear-gradient(180deg,#818cf8,#6366f1)',
  practice:    'linear-gradient(180deg,#22d3ee,#06b6d4)',
  adaptive:    'linear-gradient(180deg,#e879f9,#d946ef)',
  duel:        'linear-gradient(180deg,#fbbf24,#f59e0b)',
  leaderboard: 'linear-gradient(180deg,#fde047,#eab308)',
  profile:     'linear-gradient(180deg,#34d399,#10b981)',
  classrooms:  'linear-gradient(180deg,#818cf8,#6366f1)',
  students:    'linear-gradient(180deg,#22d3ee,#06b6d4)',
  analytics:   'linear-gradient(180deg,#e879f9,#d946ef)',
  problems:    'linear-gradient(180deg,#fbbf24,#f59e0b)',
};

const studentNav: NavItem[] = [
  { label:'Dashboard',  href:'/student',             icon:'dashboard',   roles:['student'] },
  { label:'Practice',   href:'/student/practice',    icon:'practice',    roles:['student'] },
  { label:'Adaptive',   href:'/student/adaptive',    icon:'adaptive',    roles:['student'] },
  { label:'Duel',       href:'/student/duel',        icon:'duel',        roles:['student'] },
  { label:'Leaderboard',href:'/student/leaderboard', icon:'leaderboard', roles:['student'] },
  { label:'Profile',    href:'/student/profile',     icon:'profile',     roles:['student'] },
];
const personalNav: NavItem[] = [
  { label:'Dashboard',  href:'/personal',             icon:'dashboard',   roles:['personal'] },
  { label:'Practice',   href:'/personal/practice',    icon:'practice',    roles:['personal'] },
  { label:'Adaptive',   href:'/personal/adaptive',    icon:'adaptive',    roles:['personal'] },
  { label:'Duel',       href:'/personal/duel',        icon:'duel',        roles:['personal'] },
  { label:'Leaderboard',href:'/personal/leaderboard', icon:'leaderboard', roles:['personal'] },
  { label:'Profile',    href:'/personal/profile',     icon:'profile',     roles:['personal'] },
];
const teacherNav: NavItem[] = [
  { label:'Dashboard',  href:'/teacher',              icon:'dashboard',   roles:['teacher'] },
  { label:'Classrooms', href:'/teacher/classrooms',   icon:'classrooms',  roles:['teacher'] },
  { label:'Students',   href:'/teacher/students',     icon:'students',    roles:['teacher'] },
  { label:'Analytics',  href:'/teacher/analytics',    icon:'analytics',   roles:['teacher'] },
  { label:'Problems',   href:'/teacher/problems',     icon:'problems',    roles:['teacher'] },
  { label:'Leaderboard',href:'/teacher/leaderboard',  icon:'leaderboard', roles:['teacher'] },
];

function getNav(role: UserRole) {
  if (role === 'teacher')  return teacherNav;
  if (role === 'personal') return personalNav;
  return studentNav;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
}

function getAvatarHue(name: string) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

export function Sidebar() {
  const { user, logout }  = useAuth();
  const location          = useLocation();
  const navigate          = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);

  if (!user) return null;

  const navItems  = getNav(user.role);
  const basePath  = user.role === 'teacher' ? '/teacher' : `/${user.role}`;
  const hue       = getAvatarHue(user.name);

  const isActive = (href: string) => {
    if (href === basePath) return location.pathname === basePath || location.pathname === `${basePath}/dashboard`;
    return location.pathname.startsWith(href);
  };

  const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  const rolePill: Record<string, string> = {
    student:  'bg-brand-500/15 text-brand-300 border-brand-500/25',
    teacher:  'bg-adaptive-500/15 text-adaptive-300 border-adaptive-500/25',
    personal: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden bg-black/60 backdrop-blur-sm"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg"
        style={{ background:'rgba(13,17,23,0.9)', border:'1px solid rgba(255,255,255,0.08)' }}
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <svg className="w-5 h-5 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>

      {/* Sidebar panel */}
      <motion.aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 flex flex-col',
          'sidebar-bg',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        style={{ width: collapsed ? 64 : 240 }}
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ type:'spring', stiffness:380, damping:38 }}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div
          className="flex items-center h-[60px] px-4 shrink-0"
          style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Glowing logo mark */}
            <div className="relative shrink-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-white"
                style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow:'0 0 16px rgba(99,102,241,0.5)' }}
              >
                DC
              </div>
              <div className="absolute -inset-1 rounded-lg bg-brand-500/20 blur-md -z-10" />
            </div>

            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  className="flex flex-col min-w-0"
                  initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-8 }}
                  transition={{ duration:0.18 }}
                >
                  <span className="font-bold text-base text-white tracking-tight leading-none">DevClash</span>
                  <span className="text-[10px] font-medium mt-0.5" style={{ color:'rgba(99,102,241,0.8)' }}>
                    Compete · Learn · Grow
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Collapse toggle (desktop only) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto hidden lg:flex shrink-0 w-6 h-6 items-center justify-center rounded hover:bg-white/5 transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg
              className={cn('w-3.5 h-3.5 text-surface-500 transition-transform', collapsed && 'rotate-180')}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item, i) => {
            const active = isActive(item.href);
            const accent = navAccents[item.icon] ?? 'text-surface-400';
            return (
              <motion.div
                key={item.href}
                initial={{ opacity:0, x:-12 }}
                animate={{ opacity:1, x:0 }}
                transition={{ delay: i * 0.04, duration:0.25 }}
              >
                <NavLink
                  to={item.href}
                  title={collapsed ? item.label : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'relative group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 overflow-hidden',
                    active
                      ? 'text-white'
                      : 'text-surface-400 hover:text-surface-100 hover:bg-white/[0.04]',
                    collapsed && 'justify-center px-2'
                  )}
                  style={active ? { background: navBg[item.icon] ?? 'rgba(99,102,241,0.12)' } : {}}
                >
                  {/* Active left indicator */}
                  {active && (
                    <span
                      className="absolute left-0 top-[20%] bottom-[20%] w-[2px] rounded-r-full"
                      style={{ background: activeBorder[item.icon] ?? 'linear-gradient(180deg,#818cf8,#6366f1)', boxShadow:'0 0 8px rgba(99,102,241,0.7)' }}
                    />
                  )}

                  {/* Icon */}
                  <span className={cn('shrink-0 transition-colors', active ? accent : 'text-surface-500 group-hover:text-surface-300')}>
                    {icons[item.icon]}
                  </span>

                  {/* Label */}
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        className="truncate"
                        initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                        transition={{ duration:0.15 }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Active glow shimmer */}
                  {active && (
                    <span className="absolute inset-0 rounded-lg pointer-events-none" style={{ background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.025),transparent)' }} />
                  )}
                </NavLink>
              </motion.div>
            );
          })}
        </nav>

        {/* Divider */}
        <div style={{ height:1, background:'rgba(255,255,255,0.05)', margin:'0 12px' }} />

        {/* User section */}
        <div className="p-3 shrink-0">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background:`linear-gradient(135deg,hsl(${hue},65%,55%),hsl(${(hue+40)%360},65%,45%))` }}
              >
                {getInitials(user.name)}
              </div>
              <button
                onClick={logout}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-500 hover:text-duel-400 hover:bg-duel-500/10 transition-all"
                title="Logout"
              >
                {icons.logout}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div
                className="flex items-center gap-3 p-2.5 rounded-lg"
                style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background:`linear-gradient(135deg,hsl(${hue},65%,55%),hsl(${(hue+40)%360},65%,45%))`, boxShadow:`0 0 12px hsl(${hue},60%,50%,0.4)` }}
                >
                  {getInitials(user.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate leading-tight">{user.name}</p>
                  <span className={cn('inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded border mt-0.5', rolePill[user.role])}>
                    {roleLabel}
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-surface-500 hover:text-duel-400 hover:bg-duel-500/10 transition-all duration-150"
              >
                {icons.logout}
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}
