'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { AuthLink } from '@/components/auth/AuthLink';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';
import { authErrorMessage } from '@/lib/auth-errors';

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');
  const linkError = params.get('error');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setError(null);
    setLoading(true);
    const { error: authError } = await authClient.resetPassword({ newPassword: password, token });
    if (authError) {
      setError(authErrorMessage(authError.code, 'Não foi possível redefinir a senha.'));
      setLoading(false);
      return;
    }
    router.push('/login?senha=redefinida');
  }

  if (!token || linkError) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-accent-700">
          {authErrorMessage(linkError ?? 'INVALID_TOKEN', 'Link inválido.')}
        </p>
        <AuthLink href="/esqueci-senha">Pedir um novo link</AuthLink>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="password">Nova senha (mín. 8 caracteres)</Label>
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
        {loading ? 'SALVANDO…' : 'REDEFINIR SENHA →'}
      </Button>
    </form>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <AuthShell label="Recuperar acesso" title="Defina uma nova senha.">
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
