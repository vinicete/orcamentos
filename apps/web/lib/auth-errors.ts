const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'E-mail ou senha incorretos.',
  EMAIL_NOT_VERIFIED: 'Confirme seu e-mail antes de entrar.',
  USER_ALREADY_EXISTS: 'Já existe uma conta com esse e-mail.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'Já existe uma conta com esse e-mail.',
  PASSWORD_TOO_SHORT: 'A senha precisa ter pelo menos 8 caracteres.',
  PASSWORD_TOO_LONG: 'A senha é longa demais.',
  INVALID_TOKEN: 'Link inválido ou já utilizado. Peça um novo.',
  TOKEN_EXPIRED: 'Link expirado. Peça um novo.',
};

export function authErrorMessage(code: string | undefined, fallback: string): string {
  return (code && MESSAGES[code]) || fallback;
}
