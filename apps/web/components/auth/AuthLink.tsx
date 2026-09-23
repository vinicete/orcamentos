import Link from 'next/link';
import type { ComponentProps } from 'react';

export function AuthLink({ className = '', ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={`text-[13px] text-accent underline underline-offset-2 hover:text-accent-700 ${className}`}
      {...props}
    />
  );
}
