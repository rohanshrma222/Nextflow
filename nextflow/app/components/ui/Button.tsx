'use client';
import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'primary' | 'run' | 'danger' | 'node';
  size?: 'sm' | 'md';
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'ghost', size = 'md', loading, icon, children, className, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-1.5 rounded-[7px] font-medium cursor-pointer transition-all duration-150 border outline-none select-none disabled:opacity-50 disabled:cursor-not-allowed';

    const sizes = {
      sm: 'px-2.5 py-1.5 text-[11px]',
      md: 'px-3 py-[6px] text-[12px]',
    };

    const variants = {
      ghost:   'bg-transparent border-[rgba(255,255,255,0.12)] text-[#a0a0a0] hover:bg-[#222] hover:text-[#f0f0f0] hover:border-[rgba(255,255,255,0.18)]',
      primary: 'bg-[#7c4dff] border-[#7c4dff] text-white hover:bg-[#6c3de8] hover:shadow-[0_0_16px_rgba(124,77,255,0.4)]',
      run:     'bg-[rgba(155,109,255,0.15)] border-[rgba(155,109,255,0.25)] text-[#9b6dff] hover:bg-[rgba(155,109,255,0.22)] hover:shadow-[0_0_12px_rgba(155,109,255,0.2)]',
      danger:  'bg-transparent border-[rgba(248,113,113,0.2)] text-[#f87171] hover:bg-[rgba(248,113,113,0.1)]',
      node:    'w-full bg-[rgba(155,109,255,0.12)] border-[rgba(155,109,255,0.18)] text-[#9b6dff] hover:bg-[rgba(155,109,255,0.2)] hover:shadow-[0_0_10px_rgba(155,109,255,0.2)] text-[11.5px] py-[7px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, sizes[size], variants[variant], className)}
        {...props}
      >
        {loading ? <span className="spinner" /> : icon}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
