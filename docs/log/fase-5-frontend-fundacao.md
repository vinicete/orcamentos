# Fase 5 — Frontend: fundação e design system

Data: 2026-09-01

Primeira fase de frontend — a partir daqui já dá pra navegar pelo app de verdade (autenticado, protegido, com o mês na URL), mesmo que as telas de conteúdo ainda sejam placeholders.

## O que foi feito

- **Scaffold do Next.js** em `apps/web` (Next 16.3, React 19.2, App Router, TypeScript) via `create-next-app`. Mesmos ajustes de convenção da Fase 1 (Nest): removi `README.md` genérico, `pnpm-workspace.yaml` duplicado que o CLI criou por engano dentro de `apps/web` (workspace já é definido na raiz), SVGs de exemplo não usados; `package.json` renomeado pra `@orcamento/web`; `tsconfig.json` passou a estender `tsconfig.base.json` da raiz, sobrescrevendo só o que o Next exige (`moduleResolution: bundler`, `jsx`, etc. — como já estava previsto na Fase 0).

- **Tailwind v4** (não v3 — é a versão atual, o `tailwind.config.ts` do trecho no plano §4.3 foi adaptado pro formato `@theme` em CSS que a v4 usa). Todos os tokens do `ds-modernist.css` portados em `app/globals.css`: paleta accent/neutral completa, `--font-weight-heading: 800`, raio zero em tudo, as 3 sombras. Fonte Archivo via `next/font/google` (self-hosted, não CDN do Google).

- **`packages/shared`** ganhou conteúdo de verdade:
  - `types.ts` — espelha o contrato da API (Fases 1-4) à mão, incluindo o detalhe de que `amount`/`budget`/`defaultBudget` chegam como **string** no JSON (campos `Decimal` do Prisma serializam assim), enquanto os campos do dashboard (agregados em JS puro) chegam como `number` de verdade.
  - `api-client.ts` — cliente HTTP tipado cobrindo os 4 módulos já existentes (auth/categories/fixed-items/expenses/dashboard), sempre `credentials:'include'`, com `ApiError` tratando o formato de erro do Nest (`message` string ou array).
  - `category-colors.ts` — paleta das 12 cores por **posição** (`Category.order`), não por nome — diferente do que o plano descrevia (`CATEGORY_COLORS` por nome), porque nome é editável pelo usuário e `order` é o campo estável.
  - `date.ts` / `format.ts` — `currentMonthKey`, `lastNMonths`, formatação pt-BR (`R$ 1.234,56`) e o parser de valor aceitando `,` e `.`.
- **Componentes de UI base** (`components/ui/`): `Button`, `Input`, `Label`, `SectionLabel` (equivalente ao `h6` do design — Tailwind reseta headings, não dá pra confiar no elemento puro). Existem porque o login e o shell já precisavam deles, e as próximas fases (6+) vão reusar em vez de reescrever `className` cru toda vez.
- **Auth + roteamento**:
  - `/login` — split de duas colunas como o design, mas com texto em pt-BR.
  - `proxy.ts` (não `middleware.ts` — ver nota abaixo) protege `/lancamentos`, `/dashboard`, `/tendencias`, `/recorrentes`, `/categorias`: sem cookie → redireciona pro login; com cookie mas sem `?mes=` na URL → adiciona o mês atual; `/login` com cookie já presente → redireciona pro app. Só confere a *presença* do cookie (a validade do JWT é sempre a API quem valida em cada request).
  - Shell (`(app)/layout.tsx`): header sticky com marca, nav das 5 seções e botão sair, mais a faixa de abas de mês — tudo com o `?mes=` preservado ao trocar de seção.
- **5 páginas placeholder** (`lancamentos`, `dashboard`, `tendencias`, `recorrentes`, `categorias`) só pra a navegação funcionar de ponta a ponta — o conteúdo de cada uma é o trabalho das Fases 6 a 10.

## Duas coisas que o próprio Next 16 me avisou durante o build (não é bug meu, é a "AGENTS.md" que ele gera)

O Next 16 grava um `AGENTS.md`/`CLAUDE.md` em `apps/web` toda vez que roda `next dev`, avisando agentes de IA que a versão instalada pode ter mudado convenções em relação ao que eles "sabem". **Mantive esses arquivos** (a própria doc do Next recomenda commitá-los — removê-los só faz ele recriar o diff no próximo `next dev`). Achei duas mudanças reais assim:

1. **`middleware.ts` foi renomeado pra `proxy.ts`** no Next 16 (mesma função, nome do arquivo e da função exportada mudam). Já implementei direto como `proxy.ts`.
2. `searchParams` nas páginas já é `Promise` (desde o Next 15) — usei `await searchParams` desde o início, então não precisei mudar nada aqui, só confirmei que bati com a convenção atual.

## Um problema de resolução de módulo (packages/shared + Next)

Segui a convenção NodeNext (`import ... from './arquivo.js'` apontando pra um `.ts`) no `packages/shared`, igual ao resto do monorepo — só que isso **quebra** quando o pacote é consumido via `transpilePackages` do Next (bundler-based resolution não entende essa reescrita `.js`→`.ts` que só `tsc`/Node ESM nativo fazem). Corrigido: `packages/shared` agora tem seu próprio `tsconfig.json` com `moduleResolution: "bundler"` (em vez de herdar `NodeNext` da base) e os imports internos sem sufixo `.js`. Isso não afeta `apps/api`, que nunca importou de `packages/shared` (os tipos de lá são conferidos à mão contra o contrato real, não importados em runtime).

## ESLint: achei uma incompatibilidade real (não só aviso de peer)

Ao configurar `eslint-config-next` (React/Next/hooks/a11y), `pnpm lint` **crashou de verdade** — `eslint-plugin-react` chama uma API do `context` que o ESLint 10 removeu (`contextOrFilename.getFilename is not a function`). Isso não é só um peer range desatualizado (como o `typescript-eslint`/TS 7 da Fase 0) — é quebra de fato. **Corrigido baixando `eslint`+`@eslint/js` da raiz de volta pra `^9`** (o `eslint-config-next` mais atual ainda declara suporte só até `^9`). Sim, o pnpm avisa que `eslint@9` "não é mais suportado" — mas rodar código quebrado em v10 é pior que um peer desatualizado em v9; registro aqui pra revisitar quando o ecossistema React/Next atualizar pra v10. Outras duas correções no `eslint.config.mjs`:
- As regras de React/Next vêm com `files` genéricos (`**/*.tsx`) — precisei reescrevê-los pra `apps/web/**/*.tsx` na hora de montar o config, senão regras de JSX vazariam pro `apps/api`.
- Desliguei `@next/next/no-html-link-for-pages`: ela assume Pages Router e tenta achar uma pasta `pages/` a partir do diretório onde o ESLint roda (a raiz do monorepo, não `apps/web`) — não se aplica aqui (App Router puro).

## Outro problema de porta nesta máquina

Confirmando o padrão da Fase 1: a porta **3000** (default do Next) também está ocupada pelo mesmo processo alheio de sempre. Fixei `apps/web` na porta **3002** (`next dev -p 3002` / `next start -p 3002`) e atualizei `WEB_ORIGIN` no `.env.example` do `apps/api` de acordo.

## Verificação

- `pnpm build` (`apps/web`) → compila limpo, 8 rotas geradas (`/`, `/login` estáticas; as 5 protegidas + `/_not-found` dinâmicas).
- `pnpm build`/`pnpm test` (`apps/api`) → sem regressão (13/13 testes, build limpo) depois da troca de versão do ESLint.
- `pnpm lint` / `pnpm format:check` (raiz) → limpos.
- **Testado de ponta a ponta via HTTP real** (subi os dois servidores + Postgres, e usei `curl` com cookie jar pra simular o navegador — não tenho automação de navegador disponível nesta sessão, então não foi um teste clicando na UI de verdade, só a camada HTTP/SSR):
  - `GET /` sem sessão → `307` pro `/login`.
  - `GET /lancamentos` sem sessão → `307` pro `/login`.
  - Login via API real (seu usuário) → `200` + cookies.
  - `GET /login` **com** sessão → `307` pro `/lancamentos?mes=2026-09` (mês atual).
  - `GET /lancamentos` sem `?mes` → `307` adicionando `?mes=2026-09`.
  - `GET /lancamentos?mes=2026-08` autenticado → `200`, HTML com os 5 itens de nav, a marca, a aba "AGO" com a classe `bg-accent` (ativa) e o placeholder certo.
  - CSS compilado baixado e conferido: `--color-accent` = `#ec3013`, `--color-divider` pré-computado pro hex certo (`#201e1d66`), `font-heading` gerando `font-weight` a partir do token, `@font-face` do Archivo presente.
  - Logout → `200`; `GET /lancamentos` depois → `307` de volta pro `/login`.
  - CORS: `Access-Control-Allow-Origin: http://localhost:3002` + `Allow-Credentials: true` confirmados na resposta real.
- **Não testei interativamente num navegador** (cliques, digitação, hidratação React) — só a camada servidor/HTTP acima. Vale abrir no navegador você mesmo pra conferir a sensação visual antes da Fase 6 (é rápido: os dois `pnpm dev` + o Postgres já documentados no quickstart da Fase 1).
- Ambiente ao final: os dois servidores de dev que eu subi foram parados; o Postgres ficou rodando (como você já tinha deixado). **Corrigi um erro meu**: copiei `apps/api/.env.example` por cima do seu `.env` já personalizado (senha/usuário do Postgres e credenciais do seed reais) sem querer — reverti pro que você tinha, mais os ajustes de porta/origem desta fase. `apps/web/.env.local` ficou criado (gitignored) pra você continuar de onde parei.

## Ação sua

- **Dê uma olhada no navegador** antes da Fase 6, se quiser confirmar a sensação visual (eu só verifiquei via HTTP/CSS compilado, não cliquei em nada).
- Nada bloqueante além disso.

## Próxima fase

Fase 6 — Frontend: lançar gasto (`TypeSegmented`, `QuickEntryRow`/`QuickEntrySheet`, autofill de orçado, hint contextual, salvar com Enter). É onde a tela de Lançamentos começa a ganhar conteúdo de verdade, e onde o `shadcn/ui` entra pela primeira vez (Sheet/Dialog pro formulário mobile). Só começo quando você der o sinal.
