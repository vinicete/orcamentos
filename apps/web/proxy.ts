import { currentMonthKey } from '@orcamento/shared';
import { NextResponse, type NextRequest } from 'next/server';

// Rotas de "/(app)/*" (grupo de rotas não aparece na URL). O proxy só checa a
// presença do cookie — a validade do JWT é sempre reconferida pela API em
// cada request; isso aqui é só pra não piscar tela protegida sem sessão.
const PROTECTED_PATHS = [
  '/lancamentos',
  '/dashboard',
  '/tendencias',
  '/recorrentes',
  '/categorias',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has('access_token');

  if (pathname === '/login') {
    if (hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = '/lancamentos';
      url.searchParams.set('mes', currentMonthKey());
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected) {
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.search = '';
      return NextResponse.redirect(url);
    }
    if (!request.nextUrl.searchParams.has('mes')) {
      const url = request.nextUrl.clone();
      url.searchParams.set('mes', currentMonthKey());
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
