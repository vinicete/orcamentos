# Plano — Autenticação multiusuário (Better Auth)

Complemento do [PLANO_IMPLEMENTACAO.md](PLANO_IMPLEMENTACAO.md). Entra depois da Fase 12 (deploy),
como Fase 13, e substitui a auth de usuário único da Fase 1.

Decisão tomada: **Better Auth auto-hospedado dentro da API (NestJS)**, com adapter Prisma — em vez
de serviço gerenciado (Clerk) ou de estender a auth atual à mão. Motivo: entrega cadastro,
verificação de e-mail, reset de senha, sessões revogáveis e rate limit já testados, sem terceirizar
a identidade dos usuários nem criar dependência externa pro login funcionar; e mantém a API como
fonte única da verdade (diferente de rodar o Better Auth no Next.js).

Toda a API abaixo foi conferida na documentação oficial antes de escrever este plano (adapter
Prisma, `toNodeHandler`, `crossSubDomainCookies`, `databaseHooks`, `sendResetPassword`,
`emailVerification`, `rateLimit`, hash padrão) — não é de memória.

## 0. O que existe hoje e o que muda

| Hoje (Fase 1) | Depois |
|---|---|
| Usuário único criado por script de seed | Cadastro público (ou por convite — ver §1) |
| JWT access+refresh assinado, sem estado | Sessão em banco, revogável de verdade |
| "Sair" só apaga o cookie local; token segue válido até expirar | "Sair" invalida a sessão no servidor |
| Sem verificação de e-mail | Verificação obrigatória antes do primeiro login |
| Sem recuperação de senha | Fluxo de reset por e-mail, token de uso único |
| Sem rate limit | Rate limit nativo do Better Auth |
| Categorias padrão só no seed | Criadas automaticamente pra cada novo usuário |
| `passwordHash` na tabela `User` (bcrypt) | Credencial na tabela `account` (scrypt) |

## 1. Decisões que preciso de você antes de começar

1. **Cadastro aberto ou fechado?** Aberto significa qualquer pessoa da internet criando conta no seu
   Postgres do Railway (free tier tem limite de armazenamento, e você passa a guardar dado
   financeiro de terceiros). Alternativas: código de convite, ou allowlist de e-mails.
2. **Login com Google já na primeira rodada?** É `socialProviders` nativo (sem plugin), mas exige
   criar credencial OAuth no Google Cloud. Pode entrar depois sem retrabalho.
3. **Sua senha atual:** o hash padrão do Better Auth é **scrypt**, o seu é **bcrypt** — não são
   compatíveis. Como existe só um usuário (você), o simples é redefinir sua senha pelo novo fluxo.
   Existe alternativa (`password.hash`/`password.verify` customizados, mantendo bcrypt), mas carregar
   bcrypt pra sempre por causa de um único registro não vale a complexidade.

## 2. Migração do modelo `User` — o ponto central

O Better Auth exige 4 tabelas: `user`, `session`, `account`, `verification`. A boa notícia é que ele
permite mapear a tabela de usuário pra um modelo existente (`modelName`/`fields`), então **o plano é
adotar o `User` atual como a tabela de usuário dele**, em vez de criar uma nova e migrar dados:

```prisma
model User {
  id            String    @id @default(uuid())  // mantido — FKs continuam válidas
  email         String    @unique               // mantido
  createdAt     DateTime  @default(now())       // mantido
  name          String                          // novo (exigido)
  emailVerified Boolean   @default(false)       // novo (exigido)
  image         String?                         // novo (exigido, opcional)
  updatedAt     DateTime  @updatedAt            // novo (exigido)
  // passwordHash: removido — credencial passa pra tabela `account`
  categories    Category[]
  fixedItems    FixedItem[]
  expenses      Expense[]
  sessions      Session[]
  accounts      Account[]
}
```

**Por que isso importa**: mantendo `id` como chave primária, as três foreign keys existentes
(`Category.userId`, `FixedItem.userId`, `Expense.userId`) continuam apontando pro lugar certo — seus
361 lançamentos históricos não precisam de migração de dados nenhuma. É o que torna essa abordagem
barata.

## 3. Fases

### Fase 13.1 — Fundação (nenhuma mudança visível no app)

- Instalar `better-auth`; criar a instância (`apps/api/src/auth/better-auth.ts`) com
  `prismaAdapter(prisma, { provider: 'postgresql' })`.
- Config: `emailAndPassword.enabled`, `basePath: '/api/auth'`, `trustedOrigins` (domínio do front),
  `advanced.crossSubDomainCookies` ligado só quando `AUTH_COOKIE_DOMAIN` está definida (produção),
  `advanced.cookiePrefix: 'orcamento'` (nome de cookie explícito — o `proxy.ts` do front depende
  dele, melhor não ficar à mercê do default). Sem `session.cookieCache` (ver risco 5).
- Gerar o schema das tabelas novas e criar a migration Prisma; ajustar o `User` conforme §2.
- Montar o handler no Express do NestJS via `toNodeHandler`.
- Variáveis novas: `BETTER_AUTH_SECRET` (mín. 32 chars), `BETTER_AUTH_URL`.

**Verificação**: `POST /api/auth/sign-up/email` e `/sign-in/email` respondendo via curl, cookie de
sessão emitido com `Domain` e `SameSite` corretos, linha aparecendo nas tabelas `user`/`session`/
`account`.

### Fase 13.2 — Guards e isolamento multiusuário (a fase mais importante)

- `SessionGuard` novo, chamando `auth.api.getSession({ headers })` e **adaptando o resultado pro
  mesmo formato `JwtPayload` (`{ sub, email }`) que os controllers já consomem** — assim os 5
  controllers (`categories`, `fixed-items`, `expenses`, `dashboard`, `auth`) não mudam nenhuma linha.
- **Auditoria de isolamento**: hoje tudo é escopado por `userId`, mas isso nunca foi exercitado de
  verdade — sempre existiu um usuário só. Revisar cada query de cada service (`findAll`, `findOne`,
  `update`, `remove`, agregações do dashboard, `ensureMonth`) e escrever uma suíte de testes com
  **dois** usuários provando que A não lê, edita nem apaga nada de B, em todos os endpoints.

**Por que essa é a fase crítica**: um filtro `userId` esquecido em qualquer query = um usuário vendo
o extrato financeiro de outro. É o maior risco da feature inteira, e é invisível enquanto existir só
uma conta. Vale mais atenção que todas as telas novas somadas.

### Fase 13.3 — Bootstrap de novo usuário

- Mover `DEFAULT_CATEGORIES` do `prisma/seed.ts` pra um módulo compartilhado (fonte única entre seed
  e cadastro).
- `databaseHooks.user.create.after` → criar as 12 categorias padrão do usuário novo.
- **Decidir**: criar também os dois itens fixos de rollup (teto de adicionais e fatura do cartão)?
  Sem o item de teto, `computeSummary` devolve `additionalCeiling: 0` e a barra de adicionais do rail
  nasce quebrada pro usuário novo. Recomendo criar ambos com `defaultBudget: 0`.

**Verificação**: cadastro novo → abrir o app e confirmar que Lançamentos, Dashboard e Tendências
funcionam com conta vazia (sem erro, estados vazios corretos — a Fase 11 já cobriu esses estados).

### Fase 13.4 — E-mail (Resend + DNS)

- Resend (free 3k/mês), remetente `noreply@orcamento.jeenyuhs.com.br` — você já é dono do domínio.
- Registros SPF/DKIM no painel do registro.br (mesmo lugar dos CNAMEs do deploy; conta com atraso de
  propagação, então vale começar essa parte antes de precisar dela).
- Ligar `emailVerification.sendVerificationEmail`, `emailAndPassword.sendResetPassword` e
  `revokeSessionsOnPasswordReset: true`.

**Verificação**: e-mail real chegando numa caixa real (não só log), link de verificação e de reset
funcionando, token recusado na segunda tentativa.

### Fase 13.5 — Frontend

- `authClient` (`better-auth/react`) com `baseURL` apontando pra `NEXT_PUBLIC_API_URL`.
- Reescrever `/login` sobre `authClient.signIn.email`; telas novas: `/registrar`,
  `/esqueci-senha`, `/redefinir-senha`, `/verificar-email` — todas no padrão ds-modernist já
  estabelecido (mesmo split de duas colunas do login atual).
- `proxy.ts`: trocar a checagem `cookies.has('access_token')` pelo cookie de sessão do Better Auth
  (`orcamento.session_token`, por causa do `cookiePrefix` definido na 13.1).
- `SignOutButton` → `authClient.signOut()`.
- Limpar `login`/`logout`/`refresh`/`me` do `ApiClient` em `packages/shared`.

**Verificação**: fluxo completo no navegador e no celular (cadastro → e-mail → verificação → login →
uso → sair → esqueci senha → reset → login).

### Fase 13.6 — Limpeza e deploy

- Remover `AuthModule` antigo, estratégias Passport, `@nestjs/jwt`, `bcrypt`, guards antigos; dropar
  `passwordHash` numa migration.
- Variáveis no Railway (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `AUTH_COOKIE_DOMAIN`,
  `RESEND_API_KEY`) e na Vercel.
- Conferir o rate limit por IP em produção (risco 9).
- Teste de ponta a ponta em produção criando uma segunda conta real.

### Fase 13.7 (opcional) — Login com Google

`socialProviders.google` + credencial no Google Cloud. Independente do resto.

## 4. Riscos conhecidos

| # | Risco | Mitigação |
|---|---|---|
| 1 | **Body parser do NestJS conflita com o handler.** O Better Auth precisa ler o corpo da requisição cru; o NestJS registra body parser global por padrão, o que consome o stream antes. | Criar o app com `bodyParser: false` e aplicar parsing só fora da rota de auth, ou montar o handler antes. É o maior risco de integração — resolver primeiro, na 13.1. |
| 2 | **Isolamento entre usuários nunca foi testado** | Fase 13.2 inteira dedicada a isso, com testes de dois usuários |
| 3 | Cookie muda de nome → `proxy.ts` quebra e ninguém entra no app | `cookiePrefix` explícito e trocar os dois no mesmo commit |
| 4 | Config de cookie entre subdomínios (deu trabalho no deploy) | `crossSubDomainCookies.domain` = mesmo domínio pai já usado hoje; conferir em produção, não só local |
| 5 | Validar sessão passa a bater no banco a cada request | Aceito. O `session.cookieCache` evitaria a consulta, mas testado na 13.1: com ele, cookies copiados continuam válidos por até 5 min depois de sair. Revogação imediata vale mais que uma consulta num banco na mesma região |
| 6 | Sua senha atual não migra (bcrypt ≠ scrypt) | Redefinir sua senha pelo novo fluxo (§1.3) |
| 7 | Rate limit é em memória — não vale entre instâncias | Irrelevante hoje (uma instância no Railway); anotar caso escale |
| 9 | Rate limit por IP atrás do proxy do Railway: sem `trustedProxies`, o `X-Forwarded-For` só é aceito com exatamente um IP; senão todos caem num balde compartilhado | Na 13.6, conferir o cabeçalho real em produção e o aviso "falling back to a single shared per-path bucket" nos logs; ajustar `advanced.ipAddress` se preciso |
| 8 | Nome do pacote da CLI divergiu na doc (`auth@latest` vs `@better-auth/cli`) | Confirmar na hora da instalação, não assumir |

## 5. Ordem sugerida

13.1 → 13.2 → 13.3 dão uma base multiusuário correta e testada **sem nenhuma tela nova** (dá pra
validar tudo por curl, como fizemos nas Fases 1–4). 13.4 antes da 13.5 porque as telas de
verificação/reset não têm como ser testadas de verdade sem e-mail funcionando. 13.6 fecha. A 13.7 é
independente e pode entrar quando você quiser.
