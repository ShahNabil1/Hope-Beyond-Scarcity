import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, HeartHandshake, ShieldCheck } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { ImpactStats } from "@/components/impact-stats";

import heroImage from "@/assets/hero-children.jpg";
import missionImage from "@/assets/mission-founders.jpg";
import campaignImage from "@/assets/campaign-spotlight.jpg";
import { EmergencyBanner } from "@/components/emergency-banner";
import { Button } from "@/components/ui/button";


const title = "Hope Beyond Scarcity | Dignity, Care and Lasting Change";
const description =
  "Hope Beyond Scarcity is a Canadian not-for-profit delivering care packages, health support and hope to children and families living in scarcity.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Index,
});




const partners = [
  "Prioom Nath's Clinic Initiative",
  "Toronto Community Trust",
  "Riverside Volunteers Guild",
  "Bengal Health Collective",
  "Maple Leaf Giving Circle",
  "Hope Logistics Partners",
];

function Index() {
  return (
    <>
      <EmergencyBanner />

      {/* Hero */}
      <section className="relative overflow-hidden bg-primary-deep text-primary-foreground">
        <img
          src={heroImage}
          alt="Children in a rural village receiving care packages from a volunteer"
          width={1600}
          height={1104}
          className="absolute inset-0 size-full object-cover opacity-40"
        />
        <div
          className="absolute inset-0"
          style={{ background: "var(--gradient-hero)" }}
          aria-hidden="true"
        />
        {/* futuristic glow orbs + grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(to right, color-mix(in oklab, var(--primary-foreground) 30%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--primary-foreground) 30%, transparent) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse 70% 60% at 30% 40%, black, transparent 75%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-accent/30 blur-[120px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 right-0 size-96 rounded-full bg-primary/40 blur-[140px]"
        />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
          <Reveal from="none">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest backdrop-blur-md sm:text-xs">
              <BrandLogo className="size-5" />
              Canadian Not-for-Profit Corporation
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Every child deserves hope beyond scarcity
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-5 max-w-2xl text-base text-primary-foreground/90 sm:text-lg">
              We walk with families in under-served villages — delivering care packages, health
              support and education so children can grow up with dignity, safety and possibility.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="group bg-accent text-accent-foreground shadow-lg shadow-accent/25 transition-all duration-300 hover:bg-accent/90 hover:shadow-xl hover:shadow-accent/40 motion-safe:hover:-translate-y-0.5"
              >
                <Link to="/donate">
                  Donate Now
                  <ArrowRight className="size-4 transition-transform duration-300 motion-safe:group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/50 bg-primary-foreground/10 text-primary-foreground backdrop-blur-md transition-all duration-300 hover:bg-primary-foreground/20 hover:text-primary-foreground motion-safe:hover:-translate-y-0.5"
              >
                <Link to="/volunteer">Get Involved</Link>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.32}>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-2 text-xs text-primary-foreground backdrop-blur-md sm:text-sm">
              <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
              Secure giving. Transparent reporting. 100% of field costs published annually.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Mission preview */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal from="left">
            <div
              className="group overflow-hidden rounded-3xl"
              style={{ boxShadow: "var(--shadow-soft)" }}
            >
              <img
                src={missionImage}
                alt="Founders Rajasree and Lilibet speaking with village families"
                width={1200}
                height={900}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-105"
              />
            </div>
          </Reveal>
          <Reveal from="right" delay={0.1}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Our Mission
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                It started with two women and one refusal to look away
              </h2>
              <p className="mt-5 text-muted-foreground">
                <strong className="text-foreground">Rajasree</strong> and{" "}
                <strong className="text-foreground">Lilibet</strong> met over a shared conviction:
                scarcity is not destiny. What began as a handful of care packages sent from Toronto
                to a single Bangladeshi village has grown into a community-led movement.
              </p>
              <p className="mt-4 text-muted-foreground">
                Today, Hope Beyond Scarcity works shoulder-to-shoulder with local leaders, mothers
                and clinicians — because lasting change is built by the people who live there.
              </p>
              <Button
                asChild
                variant="outline"
                className="group mt-7 transition-all duration-300 motion-safe:hover:-translate-y-0.5"
              >
                <Link to="/about">
                  Read our story
                  <ArrowRight className="size-4 transition-transform duration-300 motion-safe:group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Live impact statistics */}
      <ImpactStats />


      {/* Campaign spotlight */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="group overflow-hidden rounded-3xl border border-border bg-card transition-shadow duration-500 hover:shadow-xl lg:grid lg:grid-cols-2">
            <div className="overflow-hidden">
              <img
                src={campaignImage}
                alt="Volunteers loading relief supplies onto a boat at a riverside village"
                width={1200}
                height={900}
                loading="lazy"
                className="h-64 w-full object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-105 lg:h-full"
              />
            </div>
            <div className="p-8 sm:p-12">
              <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent-foreground">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                Campaign Spotlight
              </span>
              <h2 className="mt-5 text-3xl font-bold tracking-tight text-foreground">
                August 2026 Care Package Distribution
              </h2>
              <p className="mt-4 text-muted-foreground">
                This month our field team travels to six Bangladeshi villages with family care
                packages containing rice, hygiene kits, school supplies and clean-water tablets. Our
                goal: 1,200 packages before the monsoon peak.
              </p>
              <dl className="mt-7 grid grid-cols-2 gap-6">
                <div>
                  <dt className="text-sm text-muted-foreground">Goal</dt>
                  <dd className="text-2xl font-bold text-foreground">1,200 packages</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Cost per family</dt>
                  <dd className="text-2xl font-bold text-foreground">$50 CAD</dd>
                </div>
              </dl>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="transition-all duration-300 motion-safe:hover:-translate-y-0.5"
                >
                  <Link to="/donate">Fund a care package</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="transition-all duration-300 motion-safe:hover:-translate-y-0.5"
                >
                  <Link to="/programs">See the program</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Partner carousel */}
      <section className="border-y border-border bg-muted/50 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Supported by partners who show up
          </p>
        </div>
        <div className="group relative mt-8 overflow-hidden">
          <div className="flex w-max gap-4 motion-safe:animate-[marquee_38s_linear_infinite] group-hover:[animation-play-state:paused]">
            {[...partners, ...partners].map((partner, index) => (
              <div
                key={`${partner}-${index}`}
                className="flex h-20 w-64 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 text-center text-sm font-semibold text-muted-foreground transition-all duration-300 hover:border-primary/40 hover:text-foreground motion-safe:hover:-translate-y-1"
              >
                <HeartHandshake className="size-4 shrink-0 text-primary" aria-hidden="true" />
                {partner}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-14 text-center text-primary-foreground sm:px-14">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -left-16 -top-20 size-64 rounded-full bg-accent/25 blur-[90px]"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -right-10 size-72 rounded-full bg-primary-foreground/15 blur-[110px]"
            />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Be the reason a child stops going without
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/90">
                Whether you give, volunteer or share our story — you become part of a family's
                turning point.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="bg-accent text-accent-foreground shadow-lg shadow-accent/25 transition-all duration-300 hover:bg-accent/90 motion-safe:hover:-translate-y-0.5"
                >
                  <Link to="/donate">Donate Now</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/50 bg-primary-foreground/10 text-primary-foreground backdrop-blur-md transition-all duration-300 hover:bg-primary-foreground/20 hover:text-primary-foreground motion-safe:hover:-translate-y-0.5"
                >
                  <Link to="/volunteer">Get Involved</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

