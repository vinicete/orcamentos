'use client';

import { useState, type FormEvent } from 'react';
import { AuthLink } from '@/components/auth/AuthLink';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setSent(true);
    setLoading(false);
  }

  return (
    <AuthShell label="Recuperar acesso" title="Esqueci minha senha.">
      {sent ? (
        <div className="flex flex-col gap-4">
          <p className="text-[15px]">
            Se existir uma conta com esse e-mail, enviamos um link para redefinir a senha. Ele vale
            por 1 hora.
          </p>
          <AuthLink href="/login">Voltar ao login</AuthLink>
        </div>
      ) : (
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
          <Button type="submit" disabled={loading} className="mt-1 justify-start">
            {loading ? 'ENVIANDO…' : 'ENVIAR LINK →'}
          </Button>
          <AuthLink href="/login">Voltar ao login</AuthLink>
        </form>
      )}
    </AuthShell>
  );
}
