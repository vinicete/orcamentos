import type { InputHTMLAttributes } from 'react';

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`min-h-11 w-full border border-divider bg-surface px-3 py-2.5 text-[15px] text-text ${className}`}
      {...props}
    />
  );
}
