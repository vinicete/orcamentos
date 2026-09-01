import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

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

async function main() {
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
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
