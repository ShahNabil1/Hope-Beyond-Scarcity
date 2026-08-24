import { ICON_MAP, ICON_NAMES, resolveIcon } from "@/lib/icon-map";
import { cn } from "@/lib/utils";

export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const Active = resolveIcon(value);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
        <span className="flex size-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
          <Active className="size-5" aria-hidden="true" />
        </span>
        <p className="text-sm text-muted-foreground">
          Selected icon: <span className="font-medium text-foreground">{value || "sparkles"}</span>
        </p>
      </div>
      <div className="grid max-h-48 grid-cols-6 gap-2 overflow-y-auto rounded-lg border border-border p-2 sm:grid-cols-8">
        {ICON_NAMES.map((name) => {
          const Icon = ICON_MAP[name]!;
          const active = name === (value || "sparkles");
          return (
            <button
              key={name}
              type="button"
              title={name}
              aria-label={name}
              aria-pressed={active}
              onClick={() => onChange(name)}
              className={cn(
                "flex size-10 items-center justify-center rounded-lg border transition-colors",
                active
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:bg-muted",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
