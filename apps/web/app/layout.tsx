import type { Metadata } from 'next';
import { Archivo } from 'next/font/google';
import { ConfirmProvider } from '@/lib/confirm-context';
import './globals.css';

const archivo = Archivo({
  variable: '--font-archivo',
  subsets: ['latin'],
  weight: ['400', '600', '800'],
});

export const metadata: Metadata = {
  title: 'Orçamento',
  description: 'Controle de orçamento pessoal — fixo, adicional e cartão numa base só.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-text font-sans">
        <ConfirmProvider>{children}</ConfirmProvider>
      </body>
    </html>
  );
}
