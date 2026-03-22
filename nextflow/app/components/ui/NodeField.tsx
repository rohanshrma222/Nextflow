'use client';
import { ReactNode } from 'react';

interface NodeFieldProps {
  label: string;
  optional?: boolean;
  required?: boolean;
  children: ReactNode;
}

export function NodeField({ label, optional, required, children }: NodeFieldProps) {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] text-[#505050] uppercase tracking-[0.6px] font-[500]">
          {label}
        </label>
        {optional && <span className="text-[9px] text-[#505050]">optional</span>}
        {required && <span className="text-[9px] text-[#f87171]">required</span>}
      </div>
      {children}
    </div>
  );
}
