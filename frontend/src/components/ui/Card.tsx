import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '../../utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated' | 'outlined' | 'glow';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  glowColor?: 'brand' | 'duel' | 'practice' | 'adaptive';
}

const glowColors = {
  brand:    'hover:shadow-[0_8px_32px_rgba(99,102,241,0.25)] hover:border-brand-500/30',
  duel:     'hover:shadow-[0_8px_32px_rgba(245,158,11,0.25)] hover:border-duel-500/30',
  practice: 'hover:shadow-[0_8px_32px_rgba(6,182,212,0.25)]  hover:border-practice-500/30',
  adaptive: 'hover:shadow-[0_8px_32px_rgba(217,70,239,0.25)] hover:border-adaptive-500/30',
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', hover = false, glowColor = 'brand', children, ...props }, ref) => {

    const variants = {
      default: 'bg-[#0d1117] border border-white/[0.07]',
      glass:   'bg-[rgba(13,17,23,0.65)] backdrop-blur-xl border border-white/[0.08]',
      elevated:'bg-[#131c2e] border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.4)]',
      outlined:'bg-transparent border-2 border-white/10',
      glow:    'bg-[#0d1117] border border-white/[0.07] shadow-[0_0_0_1px_rgba(99,102,241,0.15)]',
    };

    const paddings = {
      none: '',
      sm:   'p-4',
      md:   'p-5',
      lg:   'p-7',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl transition-all duration-200',
          variants[variant],
          paddings[padding],
          hover && [
            'cursor-pointer hover:-translate-y-0.5',
            glowColors[glowColor],
          ],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export interface CardHeaderProps  extends HTMLAttributes<HTMLDivElement> {}
export interface CardTitleProps   extends HTMLAttributes<HTMLHeadingElement> {}
export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}
export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}
export interface CardFooterProps  extends HTMLAttributes<HTMLDivElement> {}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mb-4', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-base font-semibold text-white leading-snug', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-surface-400 mt-1', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mt-5 pt-4 border-t border-white/[0.06] flex items-center', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
