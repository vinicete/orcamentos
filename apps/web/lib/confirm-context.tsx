'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface AlertOptions {
  title?: string;
}

type DialogState =
  | { kind: 'confirm'; message: string; options: ConfirmOptions; resolve: (ok: boolean) => void }
  | { kind: 'alert'; message: string; options: AlertOptions; resolve: () => void }
  | null;

interface ConfirmContextValue {
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
  alert: (message: string, options?: AlertOptions) => Promise<void>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

/**
 * Substitui window.confirm/window.alert por um Dialog no padrão visual do app (Fase 11 —
 * decisão tomada na Fase 7 de adiar essa troca pra cá em vez de interromper a sequência de
 * fases). API imperativa baseada em Promise pra trocar `if (!confirm(msg)) return;` por
 * `if (!(await confirm(msg))) return;` nos call sites, sem reescrever a lógica ao redor.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>(null);

  const confirm = useCallback((message: string, options: ConfirmOptions = {}) => {
    return new Promise<boolean>((resolve) =>
      setState({ kind: 'confirm', message, options, resolve }),
    );
  }, []);

  const alert = useCallback((message: string, options: AlertOptions = {}) => {
    return new Promise<void>((resolve) => setState({ kind: 'alert', message, options, resolve }));
  }, []);

  function close(confirmed: boolean) {
    if (!state) return;
    if (state.kind === 'confirm') state.resolve(confirmed);
    else state.resolve();
    setState(null);
  }

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}
      <Dialog open={state !== null} onOpenChange={(open) => !open && close(false)}>
        <DialogContent showCloseButton={false} className="max-w-sm">
          {state && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-[13px] tracking-[.08em] text-accent uppercase">
                  {state.options.title ?? (state.kind === 'confirm' ? 'Confirmar' : 'Aviso')}
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-text">{state.message}</p>
              <DialogFooter className="-mx-4 -mb-4 border-t border-divider bg-transparent p-4">
                {state.kind === 'confirm' ? (
                  <>
                    <Button variant="secondary" onClick={() => close(false)}>
                      {state.options.cancelLabel ?? 'Cancelar'}
                    </Button>
                    <Button variant="primary" onClick={() => close(true)}>
                      {state.options.confirmLabel ?? 'Confirmar'}
                    </Button>
                  </>
                ) : (
                  <Button variant="primary" onClick={() => close(true)}>
                    OK
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirmDialog(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirmDialog precisa estar dentro de <ConfirmProvider>.');
  return ctx;
}
