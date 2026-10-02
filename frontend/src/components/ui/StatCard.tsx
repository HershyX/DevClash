import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '../../utils';

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string | number;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'brand' | 'adaptive' | 'practice';
  size?: 'sm' | 'md' | 'lg';
  progress?: { value: number; max?: number; label?: string };
}

// All dark-native styles — no light-mode colors
const colorMap: Record<string, { border: string; accent: string; accentText: string; iconBg: string; glow: string }> = {
  default:  { border:'rgba(255,255,255,0.07)', accent:'#6366f1', accentText:'#a5b4fc', iconBg:'rgba(99,102,241,0.12)',  glow:'' },
  primary:  { border:'rgba(99,102,241,0.2)',   accent:'#6366f1', accentText:'#a5b4fc', iconBg:'rgba(99,102,241,0.15)',  glow:'rgba(99,102,241,0.06)' },
  brand:    { border:'rgba(99,102,241,0.2)',   accent:'#6366f1', accentText:'#a5b4fc', iconBg:'rgba(99,102,241,0.15)',  glow:'rgba(99,102,241,0.06)' },
  success:  { border:'rgba(16,185,129,0.2)',   accent:'#10b981', accentText:'#6ee7b7', iconBg:'rgba(16,185,129,0.15)',  glow:'rgba(16,185,129,0.06)' },
  practice: { border:'rgba(6,182,212,0.2)',    accent:'#06b6d4', accentText:'#67e8f9', iconBg:'rgba(6,182,212,0.15)',   glow:'rgba(6,182,212,0.06)' },
  warning:  { border:'rgba(245,158,11,0.2)',   accent:'#f59e0b', accentText:'#fcd34d', iconBg:'rgba(245,158,11,0.15)',  glow:'rgba(245,158,11,0.06)' },
  danger:   { border:'rgba(245,158,11,0.2)',   accent:'#f59e0b', accentText:'#fcd34d', iconBg:'rgba(245,158,11,0.15)',  glow:'rgba(245,158,11,0.06)' },
  adaptive: { border:'rgba(217,70,239,0.2)',   accent:'#d946ef', accentText:'#f0abfc', iconBg:'rgba(217,70,239,0.15)',  glow:'rgba(217,70,239,0.06)' },
};

const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, label, value, subtitle, icon, trend, trendValue, variant = 'default', size = 'md', progress, children, ...props }, ref) => {
    const c = colorMap[variant] ?? colorMap.default;

    return (
      <div
        ref={ref}
        className={cn('relative rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 group overflow-hidden', className)}
        style={{
          background: c.glow ? `radial-gradient(ellipse 80% 50% at 50% 0%, ${c.glow} 0%, transparent 70%), #0d1117` : '#0d1117',
          border: `1px solid ${c.border}`,
        }}
        {...props}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Label */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.accent, boxShadow:`0 0 6px ${c.accent}` }} />
              <p className="text-[11px] font-bold uppercase tracking-wider truncate" style={{ color:'rgba(100,116,139,0.9)' }}>
                {label}
              </p>
            </div>

            {/* Value */}
            <p className={cn('font-bold tracking-tight text-white truncate tabular-nums',
              size === 'sm' && 'text-xl',
              size === 'md' && 'text-2xl',
              size === 'lg' && 'text-3xl',
            )}>
              {value}
            </p>

            {/* Subtitle */}
            {subtitle && (
              <p className="mt-0.5 text-xs font-medium" style={{ color:'rgba(100,116,139,0.8)' }}>{subtitle}</p>
            )}

            {/* Trend */}
            {(trend || trendValue !== undefined) && (
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md" style={{ background:'rgba(255,255,255,0.05)' }}>
                {trend === 'up'   && <svg className="w-3 h-3" style={{ color:'#10b981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>}
                {trend === 'down' && <svg className="w-3 h-3" style={{ color:'#f59e0b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>}
                {trend === 'stable' && <svg className="w-3 h-3" style={{ color:'rgba(100,116,139,0.8)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14"/></svg>}
                {trendValue !== undefined && (
                  <span className="text-[11px] font-semibold" style={{ color: trend === 'up' ? '#6ee7b7' : trend === 'down' ? '#fcd34d' : 'rgba(148,163,184,0.9)' }}>
                    {trendValue}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Icon */}
          {icon && (
            <div
              className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
              style={{ background: c.iconBg, border:`1px solid ${c.border}`, color: c.accentText }}
            >
              {icon}
            </div>
          )}
        </div>

        {/* Progress bar */}
        {progress && (
          <div className="mt-3 pt-2.5" style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-1.5" style={{ fontSize:11, color:'rgba(100,116,139,0.8)' }}>
              <span>{progress.label ?? 'Progress'}</span>
              <span className="font-mono font-semibold" style={{ color: c.accentText }}>
                {Math.min(Math.round((progress.value / (progress.max || 100)) * 100), 100)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width:`${Math.min(Math.max((progress.value / (progress.max || 100)) * 100, 0), 100)}%`,
                  background: c.accent,
                  boxShadow: `0 0 6px ${c.accent}80`,
                }}
              />
            </div>
          </div>
        )}

        {children && <div className="mt-3">{children}</div>}
      </div>
    );
  }
);
StatCard.displayName = 'StatCard';
export { StatCard };

export interface StatGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatGrid({ children, columns = 3, gap = 'md', className }: StatGridProps) {
  const colClass = { 1:'grid-cols-1', 2:'grid-cols-1 md:grid-cols-2', 3:'grid-cols-1 md:grid-cols-2 lg:grid-cols-3', 4:'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' };
  const gapClass = { sm:'gap-3', md:'gap-4', lg:'gap-6' };
  return <div className={cn('grid', colClass[columns], gapClass[gap], className)}>{children}</div>;
}
