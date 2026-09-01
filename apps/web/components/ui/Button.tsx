import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-accent text-bg hover:bg-accent-600 active:bg-accent-700',
  secondary: 'border border-divider text-text hover:bg-text/7',
  ghost: 'text-accent hover:bg-accent/10',
};

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 px-4 text-sm font-heading font-bold disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
