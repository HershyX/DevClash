import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '../../utils';

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'brand' | 'duel' | 'practice' | 'adaptive';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  striped?: boolean;
}

const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className, value, max = 100, size = 'md', variant = 'default', showLabel = false, label, animated = false, striped = false, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    
    const sizeClasses = {
      sm: 'h-1.5',
      md: 'h-2.5',
      lg: 'h-4',
    };
    
    const variantClasses = {
      default: 'bg-brand-500',
      success: 'bg-practice-500',
      warning: 'bg-yellow-500',
      danger: 'bg-duel-500',
      brand: 'bg-brand-500',
      duel: 'bg-duel-500',
      practice: 'bg-practice-500',
      adaptive: 'bg-adaptive-500',
    };

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {(showLabel || label) && (
          <div className="flex items-center justify-between mb-1.5 text-sm">
            <span className="font-medium text-surface-700 dark:text-surface-300">
              {label || `${Math.round(percentage)}%`}
            </span>
            {showLabel && (
              <span className="text-surface-500 dark:text-surface-400 font-mono">
                {value} / {max}
              </span>
            )}
          </div>
        )}
        <div className={cn('relative overflow-hidden rounded-full bg-surface-200 dark:bg-surface-700', sizeClasses[size])}>
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              variantClasses[variant],
              animated && 'animate-pulse-soft',
              striped && 'bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:20px_100%] animate-[progress-stripe_1s_linear_infinite]'
            )}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-label={label || 'Progress'}
          />
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';

export { ProgressBar };

export interface CircularProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'brand' | 'duel' | 'practice' | 'adaptive';
  showValue?: boolean;
  label?: string;
}

const variantStrokeColors = {
  default: 'stroke-brand-500',
  success: 'stroke-practice-500',
  warning: 'stroke-yellow-500',
  danger: 'stroke-duel-500',
  brand: 'stroke-brand-500',
  duel: 'stroke-duel-500',
  practice: 'stroke-practice-500',
  adaptive: 'stroke-adaptive-500',
};

const trackColors = {
  default: 'stroke-surface-200 dark:stroke-surface-700',
};

export const CircularProgress = forwardRef<HTMLDivElement, CircularProgressProps>(
  ({ className, value, max = 100, size = 64, strokeWidth = 4, variant = 'default', showValue = true, label, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex items-center justify-center', className)}
        style={{ width: size, height: size }}
        {...props}
      >
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            className={trackColors.default}
            fill="none"
            strokeWidth={strokeWidth}
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className={cn(
              'transition-all duration-500 ease-out',
              variantStrokeColors[variant]
            )}
            fill="none"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        {(showValue || label) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {showValue && (
              <span className="font-bold text-surface-900 dark:text-white">
                {label ? Math.round(percentage) : `${Math.round(percentage)}%`}
              </span>
            )}
            {label && !showValue && (
              <span className="text-xs text-surface-500 dark:text-surface-400 font-medium">
                {label}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

CircularProgress.displayName = 'CircularProgress';