import { Prisma } from '@prisma/client';

/** Nome/valor já usado por outro registro do mesmo usuário (ex.: categoria duplicada). */
export function isUniqueConstraintViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}

/** Registro ainda referenciado por outra linha (ex.: categoria em uso por lançamentos). */
export function isForeignKeyConstraintViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    (err.code === 'P2003' || err.code === 'P2014')
  );
}
