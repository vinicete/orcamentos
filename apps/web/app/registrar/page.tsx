'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { AuthLink } from '@/components/auth/AuthLink';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';
import { authErrorMessage } from '@/lib/auth-errors';

export default function RegistrarPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const { error: authError } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: `${window.location.origin}/login?verificado=1`,
    });
    if (authError) {
      setError(authErrorMessage(authError.code, 'Não foi possível criar a conta.'));
      setLoading(false);
      return;
    }
    router.push(`/verificar-email?email=${encodeURIComponent(email)}`);
  }

  return (
    <AuthShell label="Criar conta" title="Comece seu orçamento.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
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
          <Label htmlFor="password">Senha (mín. 8 caracteres)</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-accent-700">{error}</p>}
        <Button type="submit" disabled={loading} className="mt-1 justify-start">
          {loading ? 'CRIANDO…' : 'CRIAR CONTA →'}
        </Button>
        <AuthLink href="/login">Já tenho conta</AuthLink>
      </form>
    </AuthShell>
  );
}
