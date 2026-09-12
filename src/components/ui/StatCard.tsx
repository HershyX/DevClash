import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '../../utils';
import { Card, CardContent } from './Card';
import { Badge } from './Badge';

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

const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({
    className,
    label,
    value,
    subtitle,
    icon,
    trend,
    trendValue,
    variant = 'default',
    size = 'md',
    progress,
    children,
    ...props
  }, ref) => {
    const colorStyles = {
      default: {
        border: 'border-surface-200/80 dark:border-surface-700/60',
        bg: 'bg-white/80 dark:bg-surface-900/80',
        iconBg: 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300',
        accent: 'bg-surface-500',
      },
      primary: {
        border: 'border-brand-500/20 dark:border-brand-500/30',
        bg: 'bg-gradient-to-br from-brand-500/5 via-white dark:via-surface-900 to-transparent',
        iconBg: 'bg-brand-500/15 text-brand-600 dark:text-brand-400 ring-1 ring-brand-500/20',
        accent: 'bg-brand-500',
      },
      brand: {
        border: 'border-brand-500/20 dark:border-brand-500/30',
        bg: 'bg-gradient-to-br from-brand-500/5 via-white dark:via-surface-900 to-transparent',
        iconBg: 'bg-brand-500/15 text-brand-600 dark:text-brand-400 ring-1 ring-brand-500/20',
        accent: 'bg-brand-500',
      },
      success: {
        border: 'border-practice-500/20 dark:border-practice-500/30',
        bg: 'bg-gradient-to-br from-practice-500/5 via-white dark:via-surface-900 to-transparent',
        iconBg: 'bg-practice-500/15 text-practice-600 dark:text-practice-400 ring-1 ring-practice-500/20',
        accent: 'bg-practice-500',
      },
      practice: {
        border: 'border-practice-500/20 dark:border-practice-500/30',
        bg: 'bg-gradient-to-br from-practice-500/5 via-white dark:via-surface-900 to-transparent',
        iconBg: 'bg-practice-500/15 text-practice-600 dark:text-practice-400 ring-1 ring-practice-500/20',
        accent: 'bg-practice-500',
      },
      warning: {
        border: 'border-amber-500/20 dark:border-amber-500/30',
        bg: 'bg-gradient-to-br from-amber-500/5 via-white dark:via-surface-900 to-transparent',
        iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20',
        accent: 'bg-amber-500',
      },
      danger: {
        border: 'border-duel-500/20 dark:border-duel-500/30',
        bg: 'bg-gradient-to-br from-duel-500/5 via-white dark:via-surface-900 to-transparent',
        iconBg: 'bg-duel-500/15 text-duel-600 dark:text-duel-400 ring-1 ring-duel-500/20',
        accent: 'bg-duel-500',
      },
      adaptive: {
        border: 'border-adaptive-500/20 dark:border-adaptive-500/30',
        bg: 'bg-gradient-to-br from-adaptive-500/5 via-white dark:via-surface-900 to-transparent',
        iconBg: 'bg-adaptive-500/15 text-adaptive-600 dark:text-adaptive-400 ring-1 ring-adaptive-500/20',
        accent: 'bg-adaptive-500',
      },
    };

    const style = colorStyles[variant] || colorStyles.default;

    const trendIcons = {
      up: (
        <svg className="w-3.5 h-3.5 text-practice-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      ),
      down: (
        <svg className="w-3.5 h-3.5 text-duel-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      ),
      stable: (
        <svg className="w-3.5 h-3.5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14" />
        </svg>
      ),
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-xl border backdrop-blur-sm p-4 transition-all duration-200 hover:shadow-md dark:hover:shadow-surface-950/40 hover:-translate-y-0.5 group',
          style.border,
          style.bg,
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', style.accent)} />
              <p className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 truncate">
                {label}
              </p>
            </div>
            <p className={cn(
              'mt-1.5 font-bold tracking-tight text-surface-900 dark:text-white truncate tabular-nums',
              size === 'sm' && 'text-xl',
              size === 'md' && 'text-2xl',
              size === 'lg' && 'text-3xl'
            )}>
              {value}
            </p>
            {subtitle && (
              <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400 font-medium">
                {subtitle}
              </p>
            )}
            {(trend || trendValue !== undefined) && (
              <div className="mt-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-100/80 dark:bg-surface-800/80 text-xs">
                {trend && trendIcons[trend]}
                {trendValue !== undefined && (
                  <span className={cn(
                    'font-medium text-[11px]',
                    trend === 'up' ? 'text-practice-600 dark:text-practice-400' : trend === 'down' ? 'text-duel-600 dark:text-duel-400' : 'text-surface-600 dark:text-surface-400'
                  )}>
                    {trendValue}
                  </span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className={cn(
              'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-transform group-hover:scale-105',
              style.iconBg
            )}>
              {icon}
            </div>
          )}
        </div>
        {progress && (
          <div className="mt-3 pt-2.5 border-t border-surface-200/50 dark:border-surface-700/50">
            <div className="flex items-center justify-between text-[11px] text-surface-500 dark:text-surface-400 mb-1">
              <span>{progress.label || 'Progress'}</span>
              <span className="font-mono font-medium">{Math.min(Math.round((progress.value / (progress.max || 100)) * 100), 100)}%</span>
            </div>
            <div className="h-1.5 w-full bg-surface-200 dark:bg-surface-800 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', style.accent)}
                style={{ width: `${Math.min(Math.max((progress.value / (progress.max || 100)) * 100, 0), 100)}%` }}
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
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  };

  return (
    <div
      className={cn(
        'grid',
        columnClasses[columns],
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
}