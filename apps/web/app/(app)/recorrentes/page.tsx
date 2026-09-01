import { currentMonthKey } from '@orcamento/shared';
import { PlaceholderView } from '@/components/shell/PlaceholderView';

export default async function RecorrentesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  return <PlaceholderView title="Recorrentes" month={mes ?? currentMonthKey()} phase="Fase 10" />;
}
