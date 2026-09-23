'use client';

import { currentMonthKey } from '@orcamento/shared';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { AuthLink } from '@/components/auth/AuthLink';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';
import { authErrorMessage } from '@/lib/auth-errors';

const NOTICES: Record<string, string> = {
  verificado: 'E-mail confirmado. Agora é só entrar.',
  senha: 'Senha redefinida. Entre com a nova senha.',
};

function LoginForm() {
  const params = useSearchParams();
  const notice = [...params.keys()].map((k) => NOTICES[k]).find(Boolean);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setUnverified(false);
    setLoading(true);
    const { error: authError } = await authClient.signIn.email({ email, password });
    if (authError) {
      setUnverified(authError.code === 'EMAIL_NOT_VERIFIED');
      setError(authErrorMessage(authError.code, 'Não foi possível entrar.'));
      setLoading(false);
      return;
    }
    // Navegação "dura" (recarrega a página), não router.push: numa troca client-side o
    // navegador não reprocessa a <meta viewport>, então o zoom que o Android aplicou
    // enquanto o teclado estava aberto no campo de senha fica "grudado" na tela seguinte
    // (bug real em produção — Fase 12; só um pinch manual do usuário resetava depois). Um
    // recarregamento de verdade força o navegador a reprocessar o viewport do zero.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/lancamentos?mes=${currentMonthKey()}`;
  }

  async function resend() {
    await authClient.sendVerificationEmail({
      email,
      callbackURL: `${window.location.origin}/login?verificado=1`,
    });
    setResent(true);
  }

  return (
    <AuthShell label="Entrar" title="Acesse sua conta.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {notice && <p className="text-sm text-text">{notice}</p>}
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
        {unverified &&
          (resent ? (
            <p className="text-sm text-text">Enviamos um novo link para o seu e-mail.</p>
          ) : (
            <button
              type="button"
              onClick={resend}
              className="cursor-pointer self-start text-[13px] text-accent underline underline-offset-2"
            >
              Reenviar e-mail de confirmação
            </button>
          ))}
        <Button type="submit" disabled={loading} className="mt-1 justify-start">
          {loading ? 'ENTRANDO…' : 'ENTRAR →'}
        </Button>
        <div className="flex flex-col gap-1.5">
          <AuthLink href="/esqueci-senha">Esqueci minha senha</AuthLink>
          <AuthLink href="/registrar">Criar conta</AuthLink>
        </div>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
