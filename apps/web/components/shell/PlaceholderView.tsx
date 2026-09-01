import { SectionLabel } from '@/components/ui/SectionLabel';

export function PlaceholderView({
  title,
  month,
  phase,
}: {
  title: string;
  month: string;
  phase: string;
}) {
  return (
    <div className="border-t-2 border-text pt-3">
      <SectionLabel className="text-accent">
        {title} · {month}
      </SectionLabel>
      <p className="mt-2 max-w-prose text-sm text-neutral-700">
        Tela ainda não implementada — chega na {phase} do plano.
      </p>
    </div>
  );
}
