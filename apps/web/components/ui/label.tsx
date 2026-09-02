import type { LabelHTMLAttributes } from 'react';

export function Label({ className = '', ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`mb-1.5 block text-[11px] tracking-[.08em] text-neutral-700 uppercase ${className}`}
      {...props}
    />
  );
}
