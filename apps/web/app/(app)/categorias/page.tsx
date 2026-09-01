import { currentMonthKey } from '@orcamento/shared';
import { PlaceholderView } from '@/components/shell/PlaceholderView';

export default async function CategoriasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  return <PlaceholderView title="Categorias" month={mes ?? currentMonthKey()} phase="Fase 10" />;
}
