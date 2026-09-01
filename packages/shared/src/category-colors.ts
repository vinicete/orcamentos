// Paleta das 12 categorias padrão (docs/PLANO_IMPLEMENTACAO.md §4.3 / §0.2) — a
// mesma rampa monocromática accent→neutral do design, na ordem em que as
// categorias são semeadas (prisma/seed.ts), já que `Category.order` é o que
// fica estável entre renomeações (diferente do nome, que o usuário pode editar).
export const CATEGORY_COLORS = [
  '#4d170e', // Moradia        (accent-900)
  '#ec3013', // Alimentação    (accent DEFAULT)
  '#7c1405', // Transporte     (accent-800)
  '#ae1800', // Saúde          (accent-700)
  '#dd2b0f', // Educação       (accent-600)
  '#ff563c', // Lazer          (accent-500)
  '#ff9783', // Compras/Pessoal(accent-400)
  '#ffc4b8', // Assinaturas    (accent-300)
  '#605d5d', // Poupança/Investimento (neutral-700)
  '#2d2b2b', // Dívidas/Fatura (neutral-900)
  '#9b9797', // Família/Presentes (neutral-500)
  '#d7d3d3', // Outros         (neutral-300)
] as const;

/** Cor da categoria pela posição dela na lista do usuário — cicla se houver mais de 12. */
export function getCategoryColor(order: number): string {
  const index =
    ((order % CATEGORY_COLORS.length) + CATEGORY_COLORS.length) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[index];
}
