import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Cookie, ShieldCheck } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  CATEGORY_COPY,
  OPTIONAL_CATEGORIES,
  acceptAllState,
  defaultDraftState,
  effectiveConsent,
  readConsent,
  rejectAllState,
  writeConsent,
  type ConsentState,
} from "@/lib/consent";

const OPEN_PREFERENCES_EVENT = "hbs:open-cookie-preferences";

/** Lets any part of the app (e.g. the footer link) reopen the preferences modal. */
export function openCookiePreferences() {
  window.dispatchEvent(new Event(OPEN_PREFERENCES_EVENT));
}

function CategoryRow({
  category,
  enabled,
  onChange,
}: {
  category: (typeof OPTIONAL_CATEGORIES)[number] | "necessary";
  enabled: boolean;
  onChange?: (value: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const copy = CATEGORY_COPY[category];

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex flex-1 items-center gap-2 text-left text-sm font-semibold text-foreground"
        >
          <ChevronDown
            className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
            aria-hidden="true"
          />
          {copy.title}
        </button>
        {copy.alwaysOn ? (
          <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Always active
          </span>
        ) : (
          <Switch
            checked={enabled}
            onCheckedChange={(value) => onChange?.(value)}
            aria-label={copy.title}
          />
        )}
      </div>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="border-t border-border/60 bg-muted/40 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {copy.description}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [decided, setDecided] = useState(true);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [draft, setDraft] = useState<ConsentState>(() => defaultDraftState());

  useEffect(() => {
    setMounted(true);
    const stored = readConsent();
    setDecided(Boolean(stored));
    setDraft(stored ?? defaultDraftState());
    const open = () => {
      setDraft(readConsent() ?? defaultDraftState());
      setPrefsOpen(true);
    };
    window.addEventListener(OPEN_PREFERENCES_EVENT, open);
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, open);
  }, []);

  const commit = (state: ConsentState) => {
    writeConsent(state);
    setDecided(true);
    setPrefsOpen(false);
  };

  if (!mounted) return null;

  return (
    <>
      <AnimatePresence>
        {!decided && !prefsOpen ? (
          <motion.aside
            role="dialog"
            aria-live="polite"
            aria-label="Cookie consent"
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed inset-x-3 bottom-3 z-[70] sm:inset-x-auto sm:left-6 sm:bottom-6 sm:max-w-md"
          >
            <div className="rounded-2xl border border-border/70 bg-background/95 p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Cookie className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-bold tracking-tight text-foreground">
                    Cookies help us help you
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    When you “Accept all cookies”, you help us understand how people use our site so
                    we can show content you care about. We never sell your personal information.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button className="sm:flex-1" onClick={() => commit(acceptAllState())}>
                  Accept all cookies
                </Button>
                <Button
                  variant="outline"
                  className="sm:flex-1"
                  onClick={() => commit(rejectAllState())}
                >
                  Reject non-essential
                </Button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDraft(readConsent() ?? defaultDraftState());
                  setPrefsOpen(true);
                }}
                className="mt-3 text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                Manage preferences
              </button>
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <Dialog open={prefsOpen} onOpenChange={setPrefsOpen}>
        <DialogContent className="flex max-h-[90svh] w-[calc(100vw-1.5rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:w-full">
          <DialogHeader className="shrink-0 border-b border-border/70 px-5 py-4 text-left sm:px-6">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <BrandLogo className="size-7" />
              Your privacy matters
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-4 px-5 py-5 sm:px-6">
              <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                <p>
                  We use cookies to help our website run smoothly, understand how it’s used and
                  improve your experience.
                </p>
                <p>
                  Some cookies are essential and cannot be turned off — like keeping you signed in or
                  securing your donation. Others help us personalise content and services.
                </p>
                <p>
                  Be assured, we will never sell your personal information. You can read how we
                  collect, store and protect your data{" "}
                  <Link
                    to="/legal/$slug"
                    params={{ slug: "privacy-policy" }}
                    className="font-semibold text-primary underline-offset-4 hover:underline"
                    onClick={() => setPrefsOpen(false)}
                  >
                    here
                  </Link>
                  .
                </p>
              </div>

              <p className="pt-1 text-sm font-semibold text-foreground">Manage consent preferences</p>

              <div className="space-y-2.5">
                <CategoryRow category="necessary" enabled />
                {OPTIONAL_CATEGORIES.map((category) => (
                  <CategoryRow
                    key={category}
                    category={category}
                    enabled={draft[category]}
                    onChange={(value) => setDraft((prev) => ({ ...prev, [category]: value }))}
                  />
                ))}
              </div>

              <p className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
                Aligned with PIPEDA and Québec Law 25 — your choice applies immediately.
              </p>
            </div>
          </ScrollArea>

          <div className="shrink-0 flex flex-col gap-2 border-t border-border/70 bg-muted/30 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button variant="ghost" onClick={() => commit(rejectAllState())}>
              Reject all
            </Button>
            <Button variant="outline" onClick={() => commit(acceptAllState())}>
              Accept all
            </Button>
            <Button
              onClick={() => commit({ ...draft, updatedAt: new Date().toISOString() })}
            >
              Confirm my choices
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
