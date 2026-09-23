'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AuthLink } from '@/components/auth/AuthLink';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';

function VerifyEmail() {
  const email = useSearchParams().get('email');
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function resend() {
    if (!email) return;
    setLoading(true);
    await authClient.sendVerificationEmail({
      email,
      callbackURL: `${window.location.origin}/login?verificado=1`,
    });
    setResent(true);
    setLoading(false);
  }

  return (
    <AuthShell label="Confirmar e-mail" title="Verifique sua caixa de entrada.">
      <div className="flex flex-col gap-4">
        <p className="text-[15px]">
          {email ? (
            <>
              Enviamos um link de confirmação para <strong>{email}</strong>. Clique nele para ativar
              a conta e depois entre.
            </>
          ) : (
            'Enviamos um link de confirmação para o seu e-mail. Clique nele para ativar a conta e depois entre.'
          )}
        </p>
        {email &&
          (resent ? (
            <p className="text-sm">Novo link enviado.</p>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={resend}
              disabled={loading}
              className="justify-start"
            >
              Reenviar e-mail
            </Button>
          ))}
        <AuthLink href="/login">Ir para o login</AuthLink>
      </div>
    </AuthShell>
  );
}

export default function VerificarEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmail />
    </Suspense>
  );
}
