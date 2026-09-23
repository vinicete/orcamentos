import type { FixedItemRole, PrismaClient } from '@prisma/client';
import { DEFAULT_CATEGORIES } from '../categories/default-categories.js';

interface DefaultFixedItem {
  name: string;
  role: FixedItemRole;
  categoryName: string;
}

// Nomes e categorias batem com o histórico seedado em prisma/seed.ts (roleFor, CATEGORY_PT).
// Sem o item de teto, computeSummary devolve additionalCeiling: 0 e a barra de
// adicionais do rail nasce quebrada; por isso os dois entram no bootstrap, não só as categorias.
const DEFAULT_FIXED_ITEMS: DefaultFixedItem[] = [
  { name: 'Gastos Adicionais', role: 'ADDITIONAL_CEILING', categoryName: 'Outros' },
  { name: 'Fatura mês passado', role: 'CARD_INVOICE', categoryName: 'Dívidas/Fatura' },
];

export async function bootstrapNewUser(prisma: PrismaClient, userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const categories = await tx.category.createManyAndReturn({
      data: DEFAULT_CATEGORIES.map((name, order) => ({ userId, name, order })),
    });
    const categoryIdByName = new Map(categories.map((c) => [c.name, c.id]));

    await tx.fixedItem.createMany({
      data: DEFAULT_FIXED_ITEMS.map((item) => ({
        userId,
        name: item.name,
        role: item.role,
        defaultBudget: 0,
        categoryId: categoryIdByName.get(item.categoryName),
      })),
    });
  });
}
