# Fase 13.2 — Guards e isolamento multiusuário

Data: 2026-09-18

Segunda fase do [PLANO_AUTH.md](../PLANO_AUTH.md). Os 4 controllers de recurso (categories,
fixed-items, expenses, dashboard) passam a exigir sessão do Better Auth em vez do JWT antigo. A
auth antiga (`/auth/login`, `/refresh`, `/me`) continua no código, sem uso pelos recursos — remoção
fica pra 13.6.

## O que foi feito

- **`SessionGuard`** (`auth/guards/session.guard.ts`): chama `auth.api.getSession({ headers })` via
  `fromNodeHeaders` e popula `req.user` no mesmo formato `JwtPayload` (`{ sub, email }`) que os
  controllers já liam — nenhuma linha de lógica de negócio mudou, só a troca de
  `@UseGuards(JwtAccessGuard)` → `@UseGuards(SessionGuard)` e o import, nos 4 controllers.
- **`setup-app.ts`**: a montagem do handler do Better Auth (CORS, handler antes do body parser,
  cookie-parser, `ValidationPipe`) saiu do `main.ts` pra uma função `configureApp()` reaproveitada
  pelos testes e2e — sem isso o `TestingModule` não reproduzia o mesmo pipeline de auth do app real.
- **Auditoria de isolamento**: revisão de `findAll`/`findOne`/`update`/`remove`/`ensureMonth`
  (`categories`, `fixed-items`, `expenses`) e das agregações do dashboard — todas as queries já
  filtravam por `userId` corretamente (o app foi escrito desde o início pensando em multiusuário,
  mesmo rodando com um usuário só). Nenhum furo encontrado.
- **`test/multi-user-isolation.e2e-spec.ts`**: suíte nova com dois usuários reais (cadastro via
  `/api/auth/sign-up/email`, sessão de verdade), cobrindo os 4 recursos — usuário B não vê, edita
  nem apaga dado de A (`404`, não `403`, porque `findFirst({ id, userId })` trata "existe mas não é
  seu" igual a "não existe"); B não consegue criar item fixo/lançamento referenciando categoria ou
  item fixo de A; `ensure-month` de B não cria pendência pros itens fixos de A; dashboard
  (`summary`/`trend`) de B não soma nada de A.

## Armadilha encontrada

- Um teste inicial checava `GET /categories/:id` esperando `404` de isolamento, mas
  `CategoriesController` nunca teve essa rota (só `findOne` interno, usado por `update`/`remove`/
  validação cruzada) — o `404` viria do roteamento ausente, não da guarda de isolamento. Removido: o
  teste teria passado mesmo com um bug de isolamento real.

## Verificação

- `pnpm --filter @orcamento/api test:e2e`: 13/13 (5 antigos + 8 novos de isolamento).
- `pnpm --filter @orcamento/api test`, `pnpm lint`, `pnpm format:check`, `pnpm --filter @orcamento/api build`: limpos (fora o aviso antigo do log da fase 5).
- Requisição sem sessão em `/categories` → `401`.

## Próxima fase

13.3 — bootstrap de usuário novo (categorias padrão via `databaseHooks.user.create.after`).
