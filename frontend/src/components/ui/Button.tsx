import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false,
     leftIcon, rightIcon, fullWidth = false, disabled, children, ...props }, ref) => {

    const base = [
      'inline-flex items-center justify-center font-semibold rounded-lg',
      'transition-all duration-200 focus:outline-none',
      'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
      'relative overflow-hidden select-none',
    ].join(' ');

    const variants: Record<string, string> = {
      primary: [
        'bg-gradient-to-br from-brand-500 to-brand-600 text-white',
        'hover:from-brand-400 hover:to-brand-500',
        'shadow-[0_0_20px_rgba(99,102,241,0.35)]',
        'hover:shadow-[0_0_32px_rgba(99,102,241,0.55)] hover:-translate-y-px',
        'active:translate-y-0 active:shadow-none',
        'focus:ring-2 focus:ring-brand-400/50 focus:ring-offset-2 focus:ring-offset-surface-950',
      ].join(' '),

      secondary: [
        'text-white',
        'hover:-translate-y-px active:translate-y-0',
        'focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-surface-950',
      ].join(' '),

      outline: [
        'bg-transparent text-surface-300',
        'border border-white/10 hover:border-white/20 hover:bg-white/[0.04] hover:text-white',
        'active:bg-white/[0.06]',
        'focus:ring-2 focus:ring-white/15 focus:ring-offset-1 focus:ring-offset-surface-950',
      ].join(' '),

      ghost: [
        'bg-transparent text-surface-400',
        'hover:bg-white/[0.05] hover:text-surface-100',
        'active:bg-white/[0.08]',
        'focus:ring-2 focus:ring-white/10',
      ].join(' '),

      danger: [
        'bg-gradient-to-br from-danger-500 to-danger-600 text-white',
        'hover:from-danger-400 hover:to-danger-500',
        'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
        'hover:shadow-[0_0_32px_rgba(239,68,68,0.5)] hover:-translate-y-px',
        'active:translate-y-0',
        'focus:ring-2 focus:ring-danger-400/50 focus:ring-offset-2 focus:ring-offset-surface-950',
      ].join(' '),
    };

    // Secondary needs inline style for glass effect
    const isSecondary = variant === 'secondary';

    const sizes: Record<string, string> = {
      sm: 'px-3 py-1.5 text-sm gap-1.5 h-8',
      md: 'px-4 py-2 text-sm gap-2 h-9',
      lg: 'px-5 py-2.5 text-base gap-2.5 h-11',
      xl: 'px-7 py-3 text-lg gap-3 h-13',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
        style={isSecondary ? {
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.1)',
        } : undefined}
        disabled={disabled || loading}
        {...props}
      >
        {/* Shimmer layer on primary */}
        {variant === 'primary' && (
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
        )}

        {loading ? (
          <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        ) : leftIcon ? (
          <span className="shrink-0 flex items-center">{leftIcon}</span>
        ) : null}

        {children && <span className="truncate">{children}</span>}

        {!loading && rightIcon && (
          <span className="shrink-0 flex items-center">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
export { Button };
