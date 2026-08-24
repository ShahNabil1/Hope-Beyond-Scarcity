import * as React from "react";
import { AlertTriangle, Loader2, ShieldQuestion } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export type ConfirmOptions = {
  title: string;
  description?: React.ReactNode;
  /** Extra emphasised detail, e.g. the record being removed. */
  detail?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "destructive";
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = React.createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ConfirmOptions | null>(null);
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const resolver = React.useRef<((value: boolean) => void) | null>(null);

  const confirm = React.useCallback<ConfirmFn>((options) => {
    setState(options);
    setOpen(true);
    setPending(false);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = React.useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOpen(false);
  }, []);

  const destructive = state?.tone !== "default";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          if (!next) settle(false);
        }}
      >
        <AlertDialogContent className="dialog-content-anim max-w-md overflow-hidden border-border/70 p-0 shadow-2xl sm:rounded-2xl">
          <div
            className={cn(
              "h-1.5 w-full",
              destructive
                ? "bg-gradient-to-r from-destructive via-destructive/70 to-destructive/30"
                : "bg-gradient-to-r from-primary via-primary/70 to-primary/30",
            )}
          />
          <div className="p-6">
            <AlertDialogHeader className="flex-row items-start gap-4 space-y-0 text-left">
              <span
                className={cn(
                  "mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full",
                  destructive
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary",
                )}
                aria-hidden="true"
              >
                {destructive ? (
                  <AlertTriangle className="size-5" />
                ) : (
                  <ShieldQuestion className="size-5" />
                )}
              </span>
              <div className="space-y-1.5">
                <AlertDialogTitle className="text-lg font-semibold leading-snug">
                  {state?.title}
                </AlertDialogTitle>
                {state?.description ? (
                  <AlertDialogDescription className="text-sm leading-relaxed">
                    {state.description}
                  </AlertDialogDescription>
                ) : null}
              </div>
            </AlertDialogHeader>

            {state?.detail ? (
              <div className="mt-4 rounded-xl border border-border/70 bg-muted/50 px-4 py-3 text-sm font-medium text-foreground">
                {state.detail}
              </div>
            ) : null}

            <AlertDialogFooter className="mt-6 gap-2 sm:gap-2">
              <AlertDialogCancel disabled={pending} className="sm:min-w-28">
                {state?.cancelLabel ?? "Cancel"}
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={pending}
                className={cn(
                  "sm:min-w-32",
                  destructive &&
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                )}
                onClick={(event) => {
                  event.preventDefault();
                  setPending(true);
                  settle(true);
                }}
              >
                {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                {state?.confirmLabel ?? (destructive ? "Delete" : "Confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}
