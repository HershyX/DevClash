import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '../../utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'duel' | 'practice' | 'adaptive' | 'student' | 'teacher' | 'personal' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

const variants: Record<string, { bg: string; text: string; border: string; dot?: string }> = {
  default:  { bg:'rgba(30,41,59,0.8)',    text:'#94a3b8', border:'rgba(255,255,255,0.08)' },
  brand:    { bg:'rgba(99,102,241,0.15)', text:'#a5b4fc', border:'rgba(99,102,241,0.25)',  dot:'#6366f1' },
  duel:     { bg:'rgba(245,158,11,0.15)', text:'#fcd34d', border:'rgba(245,158,11,0.25)',  dot:'#f59e0b' },
  practice: { bg:'rgba(6,182,212,0.15)',  text:'#67e8f9', border:'rgba(6,182,212,0.25)',   dot:'#06b6d4' },
  adaptive: { bg:'rgba(217,70,239,0.15)', text:'#f0abfc', border:'rgba(217,70,239,0.25)',  dot:'#d946ef' },
  success:  { bg:'rgba(16,185,129,0.15)', text:'#6ee7b7', border:'rgba(16,185,129,0.25)',  dot:'#10b981' },
  warning:  { bg:'rgba(245,158,11,0.15)', text:'#fcd34d', border:'rgba(245,158,11,0.25)',  dot:'#f59e0b' },
  danger:   { bg:'rgba(239,68,68,0.15)',  text:'#fca5a5', border:'rgba(239,68,68,0.25)',   dot:'#ef4444' },
  info:     { bg:'rgba(59,130,246,0.15)', text:'#93c5fd', border:'rgba(59,130,246,0.25)',  dot:'#3b82f6' },
  student:  { bg:'rgba(99,102,241,0.15)', text:'#a5b4fc', border:'rgba(99,102,241,0.25)',  dot:'#6366f1' },
  teacher:  { bg:'rgba(217,70,239,0.15)', text:'#f0abfc', border:'rgba(217,70,239,0.25)',  dot:'#d946ef' },
  personal: { bg:'rgba(16,185,129,0.15)', text:'#6ee7b7', border:'rgba(16,185,129,0.25)',  dot:'#10b981' },
  outline:  { bg:'transparent',           text:'#94a3b8', border:'rgba(255,255,255,0.15)' },
};

const sizes = {
  sm: 'px-2 py-0.5 text-[11px] gap-1 font-semibold',
  md: 'px-2.5 py-1 text-xs gap-1.5 font-semibold',
  lg: 'px-3 py-1 text-sm gap-1.5 font-semibold',
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot = false, children, ...props }, ref) => {
    const v = variants[variant] ?? variants.default;
    return (
      <span
        ref={ref}
        className={cn('inline-flex items-center rounded-full leading-none', sizes[size], className)}
        style={{ background: v.bg, color: v.text, border: `1px solid ${v.border}` }}
        {...props}
      >
        {dot && v.dot && (
          <span
            className="rounded-full shrink-0"
            style={{ width:6, height:6, background: v.dot, boxShadow:`0 0 6px ${v.dot}` }}
          />
        )}
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';
export { Badge };
