'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState, type InputHTMLAttributes } from 'react';
import { Input } from './input';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export function PasswordInput({ className = '', ...props }: Props) {
  const [visible, setVisible] = useState(false);
  const label = visible ? 'Ocultar senha' : 'Mostrar senha';

  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className={`pr-12 ${className}`} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={label}
        aria-pressed={visible}
        title={label}
        className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-neutral-700 hover:text-text"
      >
        {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
      </button>
    </div>
  );
}
