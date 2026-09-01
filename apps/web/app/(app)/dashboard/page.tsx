import { currentMonthKey } from '@orcamento/shared';
import { PlaceholderView } from '@/components/shell/PlaceholderView';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  return <PlaceholderView title="Dashboard" month={mes ?? currentMonthKey()} phase="Fase 8" />;
}
