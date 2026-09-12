import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '../../utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'duel' | 'practice' | 'adaptive' | 'student' | 'teacher' | 'personal' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot = false, removable = false, onRemove, children, ...props }, ref) => {
    const variants = {
      default: 'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300',
      success: 'bg-practice-100 text-practice-700 dark:bg-practice-900/30 dark:text-practice-400',
      warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      danger: 'bg-duel-100 text-duel-700 dark:bg-duel-900/30 dark:text-duel-400',
      info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      brand: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400',
      duel: 'bg-duel-100 text-duel-700 dark:bg-duel-900/30 dark:text-duel-400',
      practice: 'bg-practice-100 text-practice-700 dark:bg-practice-900/30 dark:text-practice-400',
      adaptive: 'bg-adaptive-100 text-adaptive-700 dark:bg-adaptive-900/30 dark:text-adaptive-400',
      student: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400',
      teacher: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      personal: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      outline: 'bg-transparent border border-surface-300 text-surface-700 dark:border-surface-600 dark:text-surface-300',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs gap-1',
      md: 'px-2.5 py-1 text-sm gap-1.5',
      lg: 'px-3 py-1.5 text-base gap-2',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-full border',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full flex-shrink-0',
              variant === 'success' && 'bg-practice-500',
              variant === 'warning' && 'bg-yellow-500',
              variant === 'danger' && 'bg-duel-500',
              variant === 'info' && 'bg-blue-500',
              variant === 'brand' && 'bg-brand-500',
              variant === 'duel' && 'bg-duel-500',
              variant === 'practice' && 'bg-practice-500',
              variant === 'adaptive' && 'bg-adaptive-500',
              variant === 'default' && 'bg-surface-500',
            )}
          />
        )}
        {children}
        {removable && (
          <button
            onClick={onRemove}
            className="ml-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label="Remove"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };