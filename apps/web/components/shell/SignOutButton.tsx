'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      await api.logout();
    } finally {
      router.push('/login');
      router.refresh();
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={onClick}
      disabled={loading}
      className="min-h-9 px-3 text-[11px] tracking-[.08em] uppercase"
    >
      Sair
    </Button>
  );
}
