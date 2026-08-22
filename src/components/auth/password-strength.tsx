import { Check, X } from "lucide-react";

import { passwordRules, passwordScore } from "@/lib/password";
import { cn } from "@/lib/utils";

const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
const barColors = [
  "bg-destructive",
  "bg-destructive",
  "bg-amber-500",
  "bg-amber-400",
  "bg-emerald-500",
];

export function PasswordStrength({ value }: { value: string }) {
  const score = passwordScore(value);
  const index = Math.max(0, score - 1);

  return (
    <div className="space-y-2 pt-1" aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="flex h-1.5 flex-1 gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-300",
                value && i < score ? barColors[index] : "bg-muted",
              )}
            />
          ))}
        </div>
        <span
          className={cn(
            "w-[68px] shrink-0 text-right text-[0.7rem] font-medium tabular-nums transition-opacity duration-200",
            value ? "opacity-100 text-muted-foreground" : "opacity-0",
          )}
        >
          {labels[index]}
        </span>
      </div>

      <ul className="grid gap-1 sm:grid-cols-2">
        {passwordRules.map((rule) => {
          const ok = rule.test(value);
          return (
            <li
              key={rule.id}
              className={cn(
                "flex items-center gap-1.5 text-[0.72rem] leading-4 transition-colors duration-200",
                ok ? "text-emerald-600" : "text-muted-foreground",
              )}
            >
              {ok ? (
                <Check className="size-3 shrink-0" aria-hidden="true" />
              ) : (
                <X className="size-3 shrink-0 opacity-60" aria-hidden="true" />
              )}
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
