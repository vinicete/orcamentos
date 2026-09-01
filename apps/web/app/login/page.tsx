'use client';

import { ApiError, currentMonthKey } from '@orcamento/shared';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { api } from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.login(email, password);
      router.push(`/lancamentos?mes=${currentMonthKey()}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar.');
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[1.1fr_1fr]">
      <div className="flex min-h-55 flex-col justify-between bg-accent px-10 py-12 text-bg">
        <div className="text-[13px] tracking-[.14em] uppercase">Orçamento pessoal</div>
        <div>
          <h1 className="mb-4 font-heading text-[40px] leading-[0.95] tracking-[-.03em] md:text-[56px]">
            UM SÓ LIVRO.
            <br />
            TODO MÊS.
          </h1>
          <p className="max-w-[34ch] text-[15px] opacity-90">
            Gastos fixos, adicionais e de cartão numa base só — o mês é só um filtro.
          </p>
        </div>
        <div className="text-[11px] tracking-[.1em] uppercase opacity-75">
          Controle de orçamento pessoal
        </div>
      </div>

      <div className="flex max-w-[460px] flex-col justify-center px-10 py-12">
        <SectionLabel className="mb-1.5 text-accent">Entrar</SectionLabel>
        <h2 className="mb-7 font-heading text-[28px]">Usuário único. Sem cadastro.</h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-accent-700">{error}</p>}
          <Button type="submit" disabled={loading} className="mt-1 justify-start">
            {loading ? 'ENTRANDO…' : 'ENTRAR →'}
          </Button>
        </form>
      </div>
    </div>
  );
}
