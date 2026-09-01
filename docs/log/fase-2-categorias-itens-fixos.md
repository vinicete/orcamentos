# Fase 2 — Backend: categorias e itens fixos

Data: 2026-09-01

## Decisão pendente resolvida

A §0.4 #4 do plano ("Decisão pendente sua" sobre idioma) foi resolvida antes de começar: **categorias e textos em pt-BR agora**, suporte a múltiplos idiomas registrado no Backlog V2 do plano (categorias já são dado do usuário, editável — o que falta pra i18n de verdade é a camada de UI fixa, quando o frontend existir).

## O que foi feito

- **`CategoriesModule`**: CRUD completo em `/categories` (todas as rotas atrás de `JwtAccessGuard`, escopadas por `userId` do token).
  - `POST` calcula `order` automaticamente (próximo disponível) quando não informado, pra novas categorias não empilharem todas em `order: 0`.
  - Nome duplicado (mesma `userId`+`name`, é `@@unique` no schema) → `409 Conflict` com mensagem clara, em vez do erro cru do Postgres.
  - Excluir uma categoria referenciada por `Expense`/`FixedItem` → `409 Conflict` ("categoria em uso").

- **`FixedItemsModule`**: CRUD completo em `/fixed-items`.
  - Ao criar/editar com `categoryId`, valida que a categoria existe **e pertence ao mesmo usuário** (reusa `CategoriesService.findOne`) — sem isso, seria possível referenciar uma categoria de outro usuário se o app deixar de ser single-user um dia (mesma lógica de "não vazar dado" que já estava no plano pra outras rotas).
  - `defaultBudget` validado como número ≥ 0.

- **Seed** (`prisma/seed.ts`) agora também garante as 12 categorias padrão do PRD §6.3 pro usuário único, via `upsert` idempotente — rodar o seed de novo não duplica nem falha.

## Um ajuste de schema que fiz durante a verificação (não estava explícito no plano)

O modelo `Expense.fixedItemId` é opcional (`String?`) porque nem todo lançamento vem de um item fixo. O Prisma, por padrão, gera a foreign key de uma relação opcional como `ON DELETE SET NULL` — ou seja, excluir um `FixedItem` com lançamentos vinculados **não falharia**, só desvincularia silenciosamente o histórico (o lançamento continua existindo, só perde a referência de qual item fixo o gerou).

Isso conflitava com a própria razão de existir do campo `FixedItem.active` (pensado exatamente pra "desativar em vez de excluir" quando há histórico). Só percebi o problema testando de verdade: inseri um `Expense` de teste direto no banco e vi o `DELETE` de um item fixo em uso retornar `204` (sucesso) quando deveria bloquear. Corrigi sobrescrevendo o default do Prisma:

```prisma
fixedItem FixedItem? @relation(fields: [fixedItemId], references: [id], onDelete: Restrict)
```

Migration nova: `20260901110942_fixed_item_restrict_on_delete`. Comportamento final, confirmado com um lançamento de teste real:
- Excluir item fixo **sem** histórico → `204`.
- Excluir item fixo **com** histórico → `409`, mensagem apontando pra usar `PATCH { active: false }` em vez de excluir.
- Excluir categoria em uso (por `Expense` ou `FixedItem`) → sempre bloqueado (`409`) — essa relação já era obrigatória no schema, então já vinha `RESTRICT` por padrão; só confirmei que continua funcionando.

## Outro problema de configuração que apareceu (não é bug de lógica)

Ao subir o servidor com os dois módulos novos, o boot falhou: `Nest can't resolve dependencies of the JwtAccessGuard... AuthModuleOptions not available in CategoriesModule`. O guard do Passport (`AuthGuard('jwt-access')`) depende de um provider que só existe onde `PassportModule.register()` foi chamado — na Fase 1 isso não apareceu porque só o `AuthModule` usava o guard, dentro de si mesmo.

Corrigido tornando `AuthModule` `@Global()` e exportando `PassportModule`/os guards — assim qualquer módulo novo (Fase 3 em diante: `ExpensesModule`, `DashboardModule`) usa `@UseGuards(JwtAccessGuard)` sem precisar reimportar nada. Registrado aqui porque é uma decisão estrutural que vale saber que existe.

## Verificação

- `pnpm build` / `pnpm lint` / `pnpm format:check` (raiz) → limpos.
- `pnpm test` (unitário) → passa.
- Testado de ponta a ponta com servidor real + Postgres via Docker:
  - `GET /categories` após seed → as 12 categorias, na ordem certa.
  - `POST /categories` → cria com `order` automático; duplicada → `409`.
  - `PATCH`/`DELETE /categories/:id` → renomeia, remove (sem uso); inexistente → `404`.
  - `POST /fixed-items` com `categoryId` válido → cria; com `categoryId` inexistente → `404`; `defaultBudget` negativo → `400`.
  - `PATCH /fixed-items/:id` (desativar) e `DELETE` (sem uso) → ok.
  - **Conflitos com dado real**: inseri um `Expense` de teste direto via SQL (não existe endpoint pra isso ainda — é Fase 3) pra confirmar que excluir categoria/item fixo em uso retorna `409` em vez de corromper referência ou dar erro cru de banco.
- Ambiente limpo depois: servidor parado, container e volume do Postgres removidos, `.env` locais apagados.

## Ação sua

Nenhuma — só a decisão de idioma, que você já deu.

## Próxima fase

Fase 3 — Backend: lançamentos (`ExpensesModule`: CRUD com validação por tipo — `FIXO` exige `budget`/`fixedItemId`, `ADICIONAL` não aceita `budget`, `CARTAO` aceita `budget` opcional — e o endpoint `ensure-month` que gera as pendências de fixos no início do mês). Só começo quando você der o sinal.
