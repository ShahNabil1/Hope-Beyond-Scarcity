import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { MapPin, Package, Stethoscope, Users, type LucideIcon } from "lucide-react";

type Stat = {
  icon: LucideIcon;
  value: number;
  suffix?: string;
  display: string;
  label: string;
  caption: string;
};

const stats: Stat[] = [
  {
    icon: MapPin,
    value: 24,
    display: "24",
    label: "Villages Supported",
    caption: "Active field partnerships",
  },
  {
    icon: Package,
    value: 8400,
    suffix: "+",
    display: "8,400+",
    label: "Care Packages Distributed",
    caption: "Rice, hygiene & school kits",
  },
  {
    icon: Users,
    value: 3100,
    display: "3,100",
    label: "Children Reached",
    caption: "Nutrition & education support",
  },
  {
    icon: Stethoscope,
    value: 12,
    display: "12",
    label: "Health Camps Hosted",
    caption: "Free clinics with local doctors",
  },
];

function useCountUp(target: number, active: boolean, enabled: boolean, duration = 1600) {
  const [value, setValue] = useState(0);
  const frame = useRef<number>(0);

  useEffect(() => {
    if (!active || !enabled) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [target, active, enabled, duration]);

  return value;
}

function StatCard({
  stat,
  index,
  active,
  reduced,
}: {
  stat: Stat;
  index: number;
  active: boolean;
  reduced: boolean;
}) {
  const count = useCountUp(stat.value, active, !reduced);
  const Icon = stat.icon;

  const shown =
    reduced || !active ? stat.display : `${count.toLocaleString("en-CA")}${stat.suffix ?? ""}`;

  return (
    <motion.li
      initial={reduced ? false : { opacity: 0, y: 24 }}
      animate={active ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.09, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduced ? undefined : { y: -4 }}
      className="group relative overflow-hidden rounded-3xl border border-primary/20 bg-card/80 p-5 backdrop-blur-xl transition-colors duration-500 hover:border-primary/50 sm:p-6"
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      {/* aurora glow */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-14 size-40 rounded-full bg-primary/20 blur-3xl transition-all duration-700 group-hover:bg-primary/35 group-hover:blur-2xl motion-reduce:transition-none"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -left-10 size-36 rounded-full bg-accent/15 blur-3xl transition-opacity duration-700 group-hover:opacity-90 motion-reduce:transition-none"
      />

      <div className="relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 sm:block">
        <span className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary sm:size-12">
          <Icon className="size-5" aria-hidden="true" />
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-2xl ring-1 ring-primary/30 transition-transform duration-700 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        </span>

        <p className="text-3xl font-bold tabular-nums leading-none tracking-tight text-foreground sm:mt-6 sm:text-4xl lg:text-5xl">
          {shown}
        </p>

        {/* progress filament */}
        <span
          aria-hidden="true"
          className="col-span-2 mt-1 block h-px w-full overflow-hidden bg-border sm:mt-4"
        >
          <motion.span
            className="block h-px bg-gradient-to-r from-primary via-accent to-transparent"
            initial={reduced ? false : { scaleX: 0 }}
            animate={active ? { scaleX: 1 } : {}}
            transition={{ duration: 1.1, delay: 0.2 + index * 0.09, ease: "easeOut" }}
            style={{ transformOrigin: "left" }}
          />
        </span>

        <div className="col-span-2 min-w-0">
          <p className="text-sm font-semibold text-foreground sm:mt-4">{stat.label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{stat.caption}</p>
        </div>
      </div>
    </motion.li>
  );
}

export function ImpactStats() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduced = useReducedMotion() ?? false;

  return (
    <section className="relative overflow-hidden bg-primary-soft py-16 sm:py-24">
      {/* futuristic grid + orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, var(--primary) 35%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--primary) 35%, transparent) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent 75%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-10 size-72 rounded-full bg-primary/20 blur-[90px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 bottom-0 size-80 rounded-full bg-accent/20 blur-[110px]"
      />

      <div ref={ref} className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl"
        >
          <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-primary/30 bg-card/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary backdrop-blur sm:text-xs sm:tracking-[0.2em]">
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/70 motion-reduce:hidden" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            Live Impact
          </p>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Generosity, measured in real lives
          </h2>
          <p className="mt-4 text-sm text-muted-foreground sm:text-base">
            Every number below is a family reached, a clinic opened, a school bag filled — verified
            by our field team and published in our annual transparency report.
          </p>
        </motion.div>

        <ul className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <StatCard
              key={stat.label}
              stat={stat}
              index={index}
              active={inView}
              reduced={reduced}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
