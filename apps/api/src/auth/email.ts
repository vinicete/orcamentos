import type { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export type SendEmail = (to: string, subject: string, html: string) => Promise<void>;

export function createEmailSender(config: ConfigService): SendEmail {
  const apiKey = config.get<string>('RESEND_API_KEY');
  const from = config.get<string>('EMAIL_FROM', 'noreply@orcamento.jeenyuhs.com.br');
  const resend = apiKey ? new Resend(apiKey) : null;

  return async (to, subject, html) => {
    if (!resend) {
      // Sem chave, loga o link em vez de só avisar — dá pra testar o fluxo local sem conta no Resend.
      console.warn(`RESEND_API_KEY não configurado — e-mail para ${to} ("${subject}"):\n${html}`);
      return;
    }
    const { error } = await resend.emails.send({ from, to, subject, html });
    if (error)
      console.error(`Falha ao enviar e-mail via Resend ("${subject}", para ${to}):`, error);
  };
}

export function verificationEmailHtml(url: string): string {
  return `<p>Confirme seu e-mail pra ativar sua conta no Orçamento:</p><p><a href="${url}">${url}</a></p>`;
}

export function resetPasswordEmailHtml(url: string): string {
  return `<p>Clique no link abaixo pra redefinir sua senha do Orçamento:</p><p><a href="${url}">${url}</a></p><p>Se não foi você quem pediu, ignore este e-mail.</p>`;
}
