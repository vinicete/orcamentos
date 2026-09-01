# Plano de Implementação — App de Orçamento (Next.js + NestJS + PostgreSQL)

Baseado no [PRD_App_de_Orcamento.md](PRD_App_de_Orcamento.md) e na planilha real (`Orçamento dos meses.xlsx`), que confirma o modelo: por mês, três tabelas lado a lado — **Gastos Fixos** (Orçado x Realizado), **Gastos Adicionais** (avulso, sem orçado por item) e **Gastos do Cartão** (avulso, orçado opcional por item) — mais uma linha "Gastos Adicionais" dentro dos Fixos que funciona como teto mensal, e uma linha "Fatura mês passado" que recebe a soma do cartão do mês anterior.

O layout, o design system e as fórmulas de agregação vêm do design feito no Claude Design — está tudo na §0, que é a referência visual e comportamental deste plano. É referência de **interface**, não de código: o protótipo do Claude Design usa um runtime próprio (React com estilo inline) que não faz sentido levar para o projeto — a implementação usa Tailwind do início ao fim (§4.3).

Duas mudanças em relação ao PRD original (que descrevia um artifact Claude de usuário único sem login): como agora é um **web app com stack própria**, (1) existe autenticação de verdade, ainda que simples e de usuário único, e (2) a persistência é um Postgres seu, não mais "armazenamento por conta Claude" — isso na prática *resolve* o risco §9 do PRD (falta de backup próprio).

## 0. Design de referência (Claude Design)

Projeto: <https://claude.ai/design/p/f572af9e-c3ff-419c-9c96-fb8adcecd8b5> — arquivo principal `Budget App.dc.html`.

| Arquivo | O que é | Vai para o código? |
|---|---|---|
| `Budget App.dc.html` | O protótipo inteiro: markup + a classe `Component` com toda a lógica de agregação | **Só referência** — usado para ler as telas, o comportamento e as fórmulas (§0.3); o markup inline e o runtime React do protótipo não são portados |
| `ds-modernist.css` | Design system "Modernist": tokens (cores, tipografia, espaço, raio, sombra) + classes de componente | **Só referência** — os valores (cores, espaçamento, raio, fonte) são portados manualmente pro `tailwind.config.ts` (§4.3); o arquivo CSS em si não é importado |
| `budget-data.js` | Seed com **361 lançamentos reais**, Fev–Set/2026, extraídos da planilha | Sim — vira script de seed do Postgres |
| `support.js` | Runtime do Claude Design (React + template `x-dc`, gerado, "do not edit") | **Não** — só faz o protótipo rodar no editor |

### 0.1 O que o design define

Um app de **tela única com três views** e um seletor de mês global — não seis rotas separadas como estava na §4 antiga:

- **Login** — split em duas colunas: painel accent com o claim "ONE LEDGER. EVERY MONTH." + form email/senha. Usuário único, sem cadastro (bate com a decisão de auth da §1).
- **Shell** — header sticky com marca `ORÇAMENTO.`, nav (Entries / Dashboard / Trends), botão Sign out, e **abas de mês** roláveis logo abaixo. O mês é estado global das três views.
- **Entries** — o coração do app: linha de lançamento rápido inline (desktop), filtros (busca por texto + segmented de tipo + select de categoria), linha de resumo (`N entries · Agosto` / total), lista com edição inline, e um **rail lateral** (≥1120px) com: total gasto x orçado + barra, teto de Adicionais + barra, cartão acumulado, e a lista de **fixos pendentes** com input de "pay" direto.
- **Dashboard** — faixa de 4 KPIs (Gasto do mês / Adicionais / Cartão / Nº de lançamentos), barras horizontais de gasto por categoria com %, "Biggest expenses" (top 7) e tabela "Fixed items · budget vs actual" com delta colorido.
- **Trends** — barras empilhadas categoria × mês (clicar numa coluna navega para aquele mês), legenda de categorias, e linha de total mensal em SVG com linha tracejada da média de 8 meses.

Comportamento responsivo definido no protótipo: `< 860px` = mobile (bottom nav de 4 células com `+` accent, e o formulário vira **bottom sheet** com campo de valor gigante e chips de categoria); `< 1120px` esconde o rail; `< 1240px` colapsa a linha de lançamento inline para 2 colunas.

### 0.2 Design tokens (`ds-modernist.css`)

| Token | Valor | Nota |
|---|---|---|
| `--color-bg` / `--color-surface` / `--color-text` | `#f3f2f2` / `#eae9e9` / `#201e1d` | |
| `--color-accent` | `#ec3013` (vermelho) + rampa 100–900 | 600/700 para hover/active |
| `--color-divider` | `#201e1d` a 40% | via `color-mix` |
| neutros | rampa `--color-neutral-100..900` | gerada em OKLCH na mesma escala de luminosidade |
| tipografia | **Archivo** (400/600/800), headings peso 800, `letter-spacing:-0.015em` | Google Fonts |
| `--radius-*` | **`0px` em todos** | o visual é inteiro em cantos retos |
| espaçamento | `--space-1..8` = 4/8/12/16/24/32px | |
| sombras | `--shadow-sm/md/lg` tintadas em `#2d2b2b` | usadas só no FAB e no dialog |

Cores de categoria (`CCOLOR` no protótipo) reaproveitam a rampa accent + neutros — ex.: Housing `#4d170e`, Food `#ec3013`, Transport `#7c1405`, Savings `#605d5d`, Other `#d7d3d3`. É uma paleta monocromática de propósito: **cor não codifica "bom/ruim"**, só identidade de categoria; o vermelho accent puro fica reservado para estouro de orçamento.

### 0.3 Fórmulas que o design fixa (portar para o `DashboardModule`)

O protótipo resolve o problema de **double counting** dos rollups, e isso vira regra de negócio no backend:

```
isRollup(e)  = tipo FIXO e descrição casa /gastos adicionais|gastos imprevis|fatura m/i
isCeiling(e) = tipo FIXO e descrição casa /gastos adicionais|gastos imprevis/i

gastoDoMes   = soma(FIXO exceto teto) + soma(ADICIONAL)
orcadoDoMes  = soma(budget de todos os FIXO)
tetoAdicional= budget da linha de teto
faturaCartao = soma(CARTAO)                 → vira "Fatura mês passado" no mês seguinte
porCategoria = soma sobre TUDO exceto rollups (regime de competência:
               a compra de cartão conta no mês em que aconteceu)
```

**Correção necessária na implementação:** o protótipo identifica teto e fatura por *regex na descrição*. Em produção isso tem que virar campo explícito no `FixedItem` — proponho `role: NORMAL | ADDITIONAL_CEILING | CARD_INVOICE` — senão renomear "Gastos Imprevisíveis" para outra coisa quebra silenciosamente o dashboard inteiro. Os dados reais já mostram os dois apelidos convivendo ("Gastos Imprevisíveis" nos meses antigos, "Gastos Adicionais" nos novos).

### 0.4 Divergências entre o design e o PRD/plano atual

| # | Ponto | Situação | Encaminhamento proposto |
|---|---|---|---|
| 1 | Telas de **categorias** e **itens recorrentes** | Não existem no design — `CATS` é constante e os fixos vêm dos dados | Manter no escopo (PRD §6.3/§7.3), desenhar seguindo o mesmo padrão de lista do Entries |
| 2 | **Busca por texto** | Está no design (campo "Search description…") | Promover de V2 (§8 do PRD) para MVP — é barato, é só um `ILIKE` |
| 3 | **Importar histórico da planilha** | O design já vem com os 361 lançamentos Fev–Set/2026 | Promover de V2 para MVP como *script de seed* (Fase 2b) — é o que torna a tela de Trends útil desde o dia 1 |
| 4 | **Idioma** | UI e categorias em inglês (Housing, Food…), dados em português (Aluguel, Fatura mês passado) | **Decidido**: pt-BR agora (categorias do PRD §6.3, layout idêntico ao design). Suporte a múltiplos idiomas fica no Backlog V2 — ver nota lá embaixo |
| 5 | **Gráficos / Recharts** | O design faz barras empilhadas com `div`s e a linha com `<svg><polyline>` — sem biblioteca | Recomendo **remover o Recharts da §1**: o default do Recharts (cantos arredondados, eixos, tooltip próprio) briga com o visual de raio 0, e o código do protótipo já resolve os dois gráficos em ~20 linhas |
| 6 | **Abas de mês fixas** | 8 meses hard-coded (Fev–Set/2026) | No app real: derivar do range de dados + navegação de ano (`‹ 2026 ›`) |
| 7 | **Persistência** | `localStorage` + botão "Reset to sheet data" | Vira API + Postgres; o botão de reset só faz sentido em dev (pode virar um `pnpm db:seed`) |
| 8 | **Campo `note`** | Existe no modelo do design (7 lançamentos usam) | Já é V2 no PRD §8 — adicionar a coluna `note String?` no Prisma desde o começo, e só expor na UI na V2 |
| 9 | **Campo `month`** | O design guarda `month: "2026-08"` junto de `date` | No backend não precisa: derivar de `date` com índice; expor `month` só no DTO |
| 10 | **Props de protótipo** | `entryStyle` (row/sheet), `typeView` (tabs/sections), `density`, `dashLayout` (rail/grid/report) | São variantes de exploração. Implementar os defaults (`row`, `tabs`, `comfortable`, `rail`); `typeView: sections` (as três tabelas lado a lado da planilha) é um bom candidato a toggle no futuro |

## 1. Decisões de arquitetura

| Decisão | Escolha | Por quê |
|---|---|---|
| Monorepo | pnpm workspaces (`apps/web`, `apps/api`, `packages/shared`) | simples, sem precisar de Nx/Turborepo para um projeto deste tamanho |
| Backend | NestJS + TypeScript | pedido pelo usuário |
| ORM | Prisma | migrations tranquilas, tipos gerados batem bem com Nest + Next |
| Frontend | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui (parcial) | pedido pelo usuário; do shadcn só os primitivos sem visual próprio (Dialog/Sheet/Select/Popover/Toast) — o resto é Tailwind puro com as classes utilitárias, sem CSS inline (ver §4.3) |
| Gráficos | ~~Recharts~~ → SVG/CSS à mão | o design entrega os dois gráficos (barra empilhada e linha) já resolvidos sem biblioteca, e no visual certo (§0.4 #5) |
| Design system | Tokens do `ds-modernist.css` portados manualmente pro `tailwind.config.ts` (cores, espaçamento, raio, fonte) | o design é referência visual, não código-fonte; construir em Tailwind evita herdar o padrão de `style="..."` inline do protótipo, que o usuário não quer no projeto |
| Banco | PostgreSQL (Docker Compose local; gerenciado em produção) | pedido pelo usuário |
| Auth | JWT (access + refresh) via Passport no Nest, cookie httpOnly; login simples email+senha, **sem cadastro público** (usuário único, criado via seed/script) | "autenticação simples" — sem necessidade de multiusuário (PRD §4/§5), mas precisa proteger dados pessoais expostos num web app real |
| `packages/shared` | tipos (enums `TipoLancamento`, DTOs) compartilhados entre web e api | evita duplicar o contrato da API em dois lugares |

Pontos que assumo por padrão e você pode redirecionar: Prisma em vez de TypeORM, REST em vez de GraphQL (não há necessidade de queries flexíveis aqui), e deploy sugerido de API+Postgres num único provider tipo Railway/Fly.io + frontend na Vercel (mais barato/simples que gerenciar infra própria). Deploy é o item 12 do plano — dá para decidir isso mais perto da hora.

## 2. Modelo de dados (Prisma)

```prisma
enum TipoLancamento {
  FIXO
  ADICIONAL
  CARTAO
}

// Distingue as linhas de rollup dos fixos comuns, sem depender de regex na descrição (§0.3)
enum FixedItemRole {
  NORMAL
  ADDITIONAL_CEILING  // a linha "Gastos Adicionais" / "Gastos Imprevisíveis": teto mensal dos avulsos
  CARD_INVOICE        // a linha "Fatura mês passado": recebe a soma do cartão do mês anterior
}

enum StatusLancamento {
  PENDENTE   // criado automaticamente no início do mês para itens fixos, aguardando valor realizado
  REALIZADO
}

model User {
  id           String      @id @default(uuid())
  email        String      @unique
  passwordHash String
  createdAt    DateTime    @default(now())
  categories   Category[]
  fixedItems   FixedItem[]
  expenses     Expense[]
}

model Category {
  id         String      @id @default(uuid())
  userId     String
  user       User        @relation(fields: [userId], references: [id])
  name       String
  order      Int         @default(0)
  expenses   Expense[]
  fixedItems FixedItem[]

  @@unique([userId, name])
}

// Cadastro do item recorrente (Aluguel, Energia, Internet, Facul, Guardar, "Gastos Adicionais" como teto...)
model FixedItem {
  id            String    @id @default(uuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  name          String
  defaultBudget Decimal
  role          FixedItemRole @default(NORMAL) // teto de adicionais / fatura do cartão — ver §0.3
  categoryId    String?
  category      Category? @relation(fields: [categoryId], references: [id])
  active        Boolean   @default(true)
  expenses      Expense[]
}

// O lançamento em si — linha da tabela de Fixos, Adicionais ou Cartão
model Expense {
  id          String            @id @default(uuid())
  userId      String
  user        User              @relation(fields: [userId], references: [id])
  date        DateTime
  description String
  amount      Decimal
  budget      Decimal?          // usado em FIXO (sempre) e CARTAO (opcional); nulo em ADICIONAL
  type        TipoLancamento
  status      StatusLancamento  @default(REALIZADO)
  categoryId  String
  category    Category          @relation(fields: [categoryId], references: [id])
  fixedItemId String?           // vínculo com o item recorrente, quando type = FIXO
  fixedItem   FixedItem?        @relation(fields: [fixedItemId], references: [id])
  note        String?           // presente no modelo do design; só exposto na UI na V2 (§0.4 #8)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  @@index([userId, date])
  @@index([userId, type])
}
```

`status = PENDENTE` é o mecanismo que implementa o §7.3 do PRD ("itens fixos aparecem automaticamente como pendentes de realizado" no início do mês) sem precisar de um job/cron: ao entrar num mês novo, a API gera um `Expense` por `FixedItem` ativo com `status=PENDENTE` e `amount=0`, e o usuário só edita o valor.

## 3. API (Nest) — módulos e endpoints

- **AuthModule**: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
- **CategoriesModule**: CRUD em `/categories` + seed das categorias padrão do §6.3 na criação do usuário
- **FixedItemsModule**: CRUD em `/fixed-items`
- **ExpensesModule**:
  - `GET /expenses?month=2026-08&type=FIXO&categoryId=&from=&to=&q=` (filtros do §7.6 + busca por descrição, promovida do V2 — §0.4 #2)
  - `POST /expenses`, `PATCH /expenses/:id`, `DELETE /expenses/:id`
  - `POST /expenses/ensure-month/:yyyy-mm` — idempotente, cria os `PENDENTE` de itens fixos que ainda não existem naquele mês
- **DashboardModule**:
  - `GET /dashboard/summary?month=` → total gasto x orçado, teto de adicionais, fatura em formação, gasto por categoria, top N gastos, fixos pendentes — exatamente os números do rail e dos KPIs, com as fórmulas da §0.3 (§7.4)
  - `GET /dashboard/trend?months=12` → série categoria x mês (barra empilhada) e total x mês (linha) (§7.5)

Todas as rotas autenticadas e escopadas por `userId` do JWT (mesmo sendo um usuário só, mantém a app pronta para não vazar dado se algo mudar depois).

## 4. Frontend (Next.js) — telas

Estrutura vinda do design (§0): **três views sob um mesmo shell**, com o mês como estado global — não uma rota por funcionalidade.

- `/login` — split de duas colunas (painel accent + form). Único ponto de entrada sem sessão.
- `/(app)` — shell com header sticky (marca, nav, sign out) + abas de mês. Dentro dele:
  - `/(app)/lancamentos` (**default**) — lançamento rápido inline + filtros + lista editável + rail lateral
  - `/(app)/dashboard` — KPIs, gasto por categoria, maiores gastos, fixos orçado x realizado
  - `/(app)/tendencias` — barras empilhadas categoria × mês + linha de total mensal
- `/(app)/recorrentes` e `/(app)/categorias` — gestão; não estão no design, seguem o mesmo padrão de lista (ver divergência #1 da §0.4)

O mês selecionado vive na URL (`?mes=2026-08`) para o estado sobreviver a refresh e ser compartilhável entre as três views.

### 4.1 Componentes (construídos do zero em Tailwind, olhando o protótipo como referência)

O design mostra a forma de cada peça, mas nenhuma delas é reutilizada como código — todas são reescritas com classes utilitárias Tailwind (`bg-accent`, `rounded-none`, `text-xs tracking-wide uppercase`, etc.), configuradas a partir dos tokens portados na §4.3. Lista de componentes a construir, batizados pelo que fazem no protótipo: `MonthTabs`, `TypeSegmented` (Fixo/Adicional/Cartão, reusado no form e no filtro), `QuickEntryRow` (desktop) e `QuickEntrySheet` (mobile) sobre o mesmo estado de rascunho, `EntryRow` (view/edição inline no mesmo nó), `MeterBar` (barra de progresso que vira accent ao estourar), `KpiStrip`, `CategoryBars`, `StackedMonthChart`, `TotalLineChart`, `PendingFixedList`.

### 4.2 Regras de UX que o design fixa

- **Tipo é a primeira escolha** e muda o form: `ADICIONAL` esconde o campo Orçado; `FIXO` mostra "Budget" obrigatório e **autofill** ao digitar um nome de item fixo já conhecido; `CARTAO` mostra "Budget (opt.)".
- A linha de hint abaixo do form é contextual e sempre visível: adicionais mostram `gasto / teto`, cartão mostra o acumulado que vira a próxima fatura, fixo explica o autofill.
- **Enter salva** — tanto no lançamento quanto na edição inline; `Escape` cancela a edição.
- Fixo pendente aparece com valor `—` em cinza e a palavra `pending` na meta; o rail deixa quitar digitando o valor direto no input, sem abrir form.
- Estouro de orçamento é o único uso do accent puro em número (delta `+R$ x` em `--color-accent-700`).
- Formatação sempre pt-BR: `R$ 1.234,56` (`toLocaleString('pt-BR')`), datas `dd/mm` na meta das linhas. O parser de valor precisa aceitar `1.234,56` e `1234.56`.

### 4.3 Tokens do design em Tailwind

O `ds-modernist.css` não entra no projeto como arquivo — é lido uma vez para extrair os valores, que viram `theme.extend` no `tailwind.config.ts`:

```ts
// tailwind.config.ts (trecho)
theme: {
  extend: {
    colors: {
      bg: '#f3f2f2', surface: '#eae9e9', text: '#201e1d',
      accent: { DEFAULT: '#ec3013', 100: '#fff2ef', /* … */ 700: '#ae1800', 900: '#4d170e' },
      neutral: { 100: '#f8f4f4', /* … */ 900: '#2d2b2b' },
    },
    fontFamily: { sans: ['Archivo', 'system-ui', 'sans-serif'] },
    fontWeight: { heading: '800' },
    borderRadius: { DEFAULT: '0px' }, // o visual inteiro é de cantos retos
    spacing: { /* 4/8/12/16/24/32 já cobertos pela escala default do Tailwind */ },
    boxShadow: { sm: '0 1px 2px rgb(45 43 43 / 0.14)', md: '0 3px 10px rgb(45 43 43 / 0.16)', lg: '0 12px 32px rgb(45 43 43 / 0.22)' },
  }
}
```

Daí em diante, todo componente é escrito com essas classes (`className="bg-accent text-bg font-heading font-bold"`) — **sem `style=""` inline** e sem depender do CSS do protótipo em runtime. As 12 cores de categoria (`CCOLOR` no design) viram uma constante `CATEGORY_COLORS` em `packages/shared`, mapeando categoria → cor Tailwind/hex, para não duplicar entre os componentes de lista, dashboard e tendências.

Sobre **shadcn/ui** (§1): usar só os primitivos sem visual forte (`Dialog`/`Sheet` para a quick-entry sheet mobile, `Select`, `Popover`, `Toast`) e restilizá-los via `className`/tema shadcn apontando pros tokens acima — nunca copiar o CSS do protótipo. Botões, inputs, chips, tabelas e barras são componentes próprios em Tailwind, seguindo a proporção e a hierarquia visual do design (peso 800 nos headings, letter-spacing largo em labels/uppercase, raio zero em tudo), não o markup dele.

### 4.4 Dark mode

Não está no design, mas fica barato **se os tokens da §4.3 forem respeitados**: nenhuma cor literal em componente, só classes que resolvem para os tokens. Abordagem: Tailwind com `darkMode: 'class'`, um segundo bloco de cores em `theme.extend` (ou CSS vars consumidas pelas mesmas chaves de cor) ativado por uma classe `dark` no `<html>`, e as classes dos componentes ganhando o par `dark:` onde a cor muda (`bg-bg dark:bg-neutral-900`, `text-text dark:text-neutral-100`).

Pontos de atenção quando for fazer:

- Inverter a direção das rampas neutras (o `neutral-700` que hoje é texto secundário sobre claro precisa clarear no escuro, não escurecer).
- O accent `#ec3013` não tem contraste suficiente como *cor de texto* sobre fundo escuro — usar os steps 400/500 pra texto/ícone e manter 500/600 pra preenchimento de barra.
- Sombras (`shadow-sm/md/lg`) somem no escuro: trocar por borda hairline + fundo um degrau mais claro no FAB e no dialog.
- As 12 cores de categoria são uma rampa vermelho→neutro monocromática; no escuro os tons 800/900 (Housing, Transport, Debt/Card) ficam indistinguíveis do fundo — precisa de um segundo mapa `CATEGORY_COLORS_DARK` deslocado pros steps 300–500.
- Persistir a preferência (claro/escuro/sistema) e aplicar a classe `dark` antes do primeiro paint (script inline no `<head>` do layout) pra não piscar branco.

Fica na **Fase 11 (Polish)** como item opcional, ou vai pro backlog V2 se quiser fechar o MVP mais rápido. Não bloqueia nada nem muda schema — só é mais barato fazer depois que os componentes em Tailwind estiverem estáveis, porque cada um escrito com cor literal em vez de token é retrabalho extra nessa hora.


## 5. Fases de implementação

**Fase 0 — Setup do projeto**
- Monorepo pnpm workspaces, ESLint/Prettier/tsconfig compartilhado
- Docker Compose com Postgres para dev local
- `.env.example` (DATABASE_URL, JWT secrets)

**Fase 1 — Backend: fundação**
- Scaffold NestJS, Prisma schema inicial + primeira migration
- AuthModule (bcrypt + JWT + Passport), script de seed do usuário único
- UsersModule mínimo

**Fase 2 — Backend: categorias e itens fixos**
- CategoriesModule (CRUD + seed das categorias padrão)
- FixedItemsModule (CRUD)

**Fase 2b — Seed do histórico**
- Script `pnpm db:seed` que carrega os 361 lançamentos de `budget-data.js` (Fev–Set/2026), criando categorias, `FixedItem`s e `Expense`s
- É o que torna Dashboard e Tendências testáveis desde a Fase 4, em vez de esperar meses de uso real

**Fase 3 — Backend: lançamentos**
- ExpensesModule (CRUD com validação por tipo: `FIXO` exige `budget`/`fixedItemId`, `ADICIONAL` não aceita `budget`, `CARTAO` aceita `budget` opcional)
- Endpoint `ensure-month` para gerar pendências de fixos

**Fase 4 — Backend: dashboard**
- `summary` e `trend` com testes unitários nas funções de agregação (é a parte com mais lógica, vale cobrir)

**Fase 5 — Frontend: fundação e design system**
- Scaffold Next.js + Tailwind, `tailwind.config.ts` com os tokens portados do design (§4.3), Archivo via `next/font`
- Cliente HTTP tipado (`packages/shared`), login e proteção de rota via middleware
- Shell: header sticky + nav das três views + `MonthTabs` com o mês na URL

**Fase 6 — Frontend: lançar gasto**
- `TypeSegmented` + estado de rascunho compartilhado entre `QuickEntryRow` (desktop) e `QuickEntrySheet` (mobile), autofill de orçado, linha de hint contextual, salvar com Enter (§4.2)

**Fase 7 — Frontend: lançamentos**
- Lista com `EntryRow` (view + edição inline no mesmo nó), filtros (busca, tipo, categoria), linha de contagem/total
- Rail lateral: total x orçado, teto de adicionais, cartão acumulado, fixos pendentes com quitação inline

**Fase 8 — Frontend: dashboard**
- `KpiStrip` (4 KPIs), barras por categoria com %, maiores gastos, tabela de fixos orçado x realizado com delta

**Fase 9 — Frontend: tendências**
- Barras empilhadas categoria × mês (coluna clicável → navega para o mês) + linha de total em SVG com média tracejada, ambas sem biblioteca de gráficos (§0.4 #5)

**Fase 10 — Frontend: recorrentes e categorias**
- Telas de gestão (não vêm do design — seguir o padrão de lista do Entries)

**Fase 11 — Polish**
- Estados vazios/loading/erro, QA em viewport de celular real (bottom nav, bottom sheet, rail escondido)
- Acessibilidade: o design usa `:focus-visible` com outline accent — validar contraste do texto neutro sobre `--color-surface`
- **Dark mode** (§4.4) — opcional aqui, ou V2

**Fase 12 — Deploy**
- Dockerfile de API, build da Vercel para o web, migrations rodando no deploy, secrets, domínio

**Backlog V2** (fica só registrado, não faz parte do MVP): alertas de orçado ultrapassado, export CSV, metas de poupança, notas por lançamento, toggle `typeView: sections` (as três tabelas da planilha lado a lado), dark mode se não entrar na Fase 11. Busca textual e importação do histórico saíram do backlog e entraram no MVP (§0.4 #2 e #3).

**Internacionalização (i18n)**: MVP é pt-BR (§0.4 #4). Categorias em si já não são um problema — são dados do usuário (linhas na tabela `Category`, editáveis por ele), não um enum fixo, então já nascem "traduzíveis" por natureza. O que falta pra multi-idioma de verdade é a camada de textos fixos da UI (labels, botões, mensagens) quando o frontend existir — solução natural é algo como `next-intl`/`next-i18next` na Fase 5 em diante, fora do escopo do MVP.

## 6. Ordem sugerida de execução

Fases 0→4 (+2b) dão uma API funcional e testável via Postman/Insomnia antes de tocar em UI — permite validar o modelo de dados contra a planilha real (dá pra rodar `ensure-month` e comparar com uma aba existente) antes de investir em telas. A Fase 2b em particular vale antecipar: com os 361 lançamentos reais no banco, dá para conferir os números da §0.3 contra a planilha antes de existir qualquer tela. Fases 5→10 entregam o MVP completo do PRD, na ordem em que o design se monta (shell → lançar → listar → dashboard → tendências). 11→12 fecham para uso real no dia a dia.
