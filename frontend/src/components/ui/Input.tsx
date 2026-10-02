import React, { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@utils';

export interface BaseInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export type InputProps = BaseInputProps &
  (
    | ({ as?: 'input' } & Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'>)
    | ({ as: 'textarea'; rows?: number } & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'>)
  );

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className,
      id,
      as = 'input',
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const baseControlClasses = cn(
      'w-full rounded-lg border px-3.5 py-2 text-sm text-white',
      'placeholder:text-surface-600',
      'bg-[rgba(255,255,255,0.04)] border-white/[0.08]',
      'focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50',
      'transition duration-150',
      error && 'border-red-500/50 focus:ring-red-500/30',
      leftIcon && 'pl-10',
      rightIcon && 'pr-10',
      className
    );

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color:'rgba(148,163,184,0.85)' }}>
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-surface-400">
              {leftIcon}
            </div>
          )}
          {as === 'textarea' ? (
            <textarea
              id={inputId}
              ref={ref as React.ForwardedRef<HTMLTextAreaElement>}
              className={baseControlClasses}
              {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input
              id={inputId}
              ref={ref as React.ForwardedRef<HTMLInputElement>}
              className={baseControlClasses}
              {...(props as InputHTMLAttributes<HTMLInputElement>)}
            />
          )}
          {rightIcon && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-surface-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-surface-500 dark:text-surface-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
