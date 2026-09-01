import { PrismaClient, type FixedItemRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import rawExpenses from './seed-data/budget-data.json' with { type: 'json' };

const prisma = new PrismaClient();

// Lista inicial do PRD §6.3 — editável pelo usuário no app depois de criada.
const DEFAULT_CATEGORIES = [
  'Moradia',
  'Alimentação',
  'Transporte',
  'Saúde',
  'Educação',
  'Lazer',
  'Compras/Pessoal',
  'Assinaturas',
  'Poupança/Investimento',
  'Dívidas/Fatura',
  'Família/Presentes',
  'Outros',
];

// `budget-data.js` do design (Claude Design) veio em inglês — mapeia pras
// categorias em pt-BR já seedadas acima (docs/PLANO_IMPLEMENTACAO.md §0.4 #4).
const CATEGORY_PT: Record<string, string> = {
  Housing: 'Moradia',
  Food: 'Alimentação',
  Transport: 'Transporte',
  Health: 'Saúde',
  Education: 'Educação',
  Leisure: 'Lazer',
  Shopping: 'Compras/Pessoal',
  Subscriptions: 'Assinaturas',
  Savings: 'Poupança/Investimento',
  'Debt/Card': 'Dívidas/Fatura',
  'Family/Gifts': 'Família/Presentes',
  Other: 'Outros',
};

const TYPE_MAP = { fixed: 'FIXO', additional: 'ADICIONAL', card: 'CARTAO' } as const;
const STATUS_MAP = { done: 'REALIZADO', pending: 'PENDENTE' } as const;

// Mesma regra do §0.3 do plano — identifica as linhas de rollup pelo nome,
// já que é assim que a planilha original (e o protótipo) as reconhece.
function roleFor(name: string): FixedItemRole {
  if (/gastos adicionais|gastos imprevis/i.test(name)) return 'ADDITIONAL_CEILING';
  if (/fatura m/i.test(name)) return 'CARD_INVOICE';
  return 'NORMAL';
}

interface RawExpense {
  id: string;
  month: string;
  date: string;
  desc: string;
  amount: number;
  budget: number | null;
  type: keyof typeof TYPE_MAP;
  category: string;
  status: keyof typeof STATUS_MAP;
  note: string | null;
}

const HISTORY: RawExpense[] = rawExpenses as RawExpense[];
const HISTORY_START = new Date('2026-02-01');
const HISTORY_END = new Date('2026-10-01'); // exclusivo

async function seedUserAndCategories() {
  const email = process.env.SEED_USER_EMAIL;
  const password = process.env.SEED_USER_PASSWORD;
  if (!email || !password) {
    throw new Error('Defina SEED_USER_EMAIL e SEED_USER_PASSWORD no .env antes de rodar o seed.');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  for (const [index, name] of DEFAULT_CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { userId_name: { userId: user.id, name } },
      update: {},
      create: { userId: user.id, name, order: index },
    });
  }

  console.log(`Usuário pronto: ${user.email} (${user.id})`);
  console.log(`Categorias padrão garantidas: ${DEFAULT_CATEGORIES.length}`);
  return user;
}

/** Um FixedItem por nome distinto de lançamento `fixed`; orçamento = o mais recente por mês (varia ao longo do histórico real). */
async function ensureFixedItems(userId: string, categoryIdByName: Map<string, string>) {
  const byName = new Map<string, RawExpense[]>();
  for (const row of HISTORY) {
    if (row.type !== 'fixed') continue;
    const list = byName.get(row.desc) ?? [];
    list.push(row);
    byName.set(row.desc, list);
  }

  const fixedItemIdByName = new Map<string, string>();
  for (const [name, rows] of byName) {
    rows.sort((a, b) => (a.month < b.month ? -1 : 1));
    const latestBudget = [...rows].reverse().find((r) => r.budget != null)?.budget ?? 0;
    const categoryId = categoryIdByName.get(CATEGORY_PT[rows[0].category]);

    const existing = await prisma.fixedItem.findFirst({ where: { userId, name } });
    const item = existing
      ? await prisma.fixedItem.update({
          where: { id: existing.id },
          data: { defaultBudget: latestBudget, role: roleFor(name), categoryId },
        })
      : await prisma.fixedItem.create({
          data: { userId, name, defaultBudget: latestBudget, role: roleFor(name), categoryId },
        });
    fixedItemIdByName.set(name, item.id);
  }

  console.log(`Itens fixos garantidos: ${fixedItemIdByName.size}`);
  return fixedItemIdByName;
}

async function seedHistory(userId: string) {
  const categories = await prisma.category.findMany({ where: { userId } });
  const categoryIdByName = new Map(categories.map((c) => [c.name, c.id]));
  for (const ptName of Object.values(CATEGORY_PT)) {
    if (!categoryIdByName.has(ptName)) {
      throw new Error(`Categoria "${ptName}" não encontrada — rode o seed de categorias primeiro.`);
    }
  }

  const fixedItemIdByName = await ensureFixedItems(userId, categoryIdByName);

  // Idempotente: refaz o histórico do zero a cada execução (mesmo espírito do
  // botão "Reset to sheet data" do protótipo), em vez de tentar casar/atualizar linha a linha.
  const { count: removed } = await prisma.expense.deleteMany({
    where: { userId, date: { gte: HISTORY_START, lt: HISTORY_END } },
  });

  await prisma.expense.createMany({
    data: HISTORY.map((row) => ({
      userId,
      date: new Date(row.date),
      description: row.desc,
      amount: row.amount,
      budget: row.budget,
      type: TYPE_MAP[row.type],
      status: STATUS_MAP[row.status],
      categoryId: categoryIdByName.get(CATEGORY_PT[row.category])!,
      fixedItemId: row.type === 'fixed' ? fixedItemIdByName.get(row.desc) : null,
      note: row.note,
    })),
  });

  console.log(
    `Histórico: ${removed} lançamento(s) antigo(s) removido(s), ${HISTORY.length} importado(s).`,
  );
}

async function main() {
  const user = await seedUserAndCategories();
  await seedHistory(user.id);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
