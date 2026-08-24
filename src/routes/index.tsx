import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  HeartHandshake,
  MapPin,
  Package,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";

import heroImage from "@/assets/hero-children.jpg";
import missionImage from "@/assets/mission-founders.jpg";
import campaignImage from "@/assets/campaign-spotlight.jpg";
import { EmergencyBanner } from "@/components/emergency-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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

const stats = [
  { icon: MapPin, value: "24", label: "Villages Supported" },
  { icon: Package, value: "8,400+", label: "Care Packages Distributed" },
  { icon: Users, value: "3,100", label: "Children Reached" },
  { icon: Stethoscope, value: "12", label: "Health Camps Hosted" },
];

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
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest">
            <BrandLogo className="size-5" />
            Canadian Not-for-Profit Corporation
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Every child deserves hope beyond scarcity
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-primary-foreground/85">
            We walk with families in under-served villages — delivering care packages, health
            support and education so children can grow up with dignity, safety and possibility.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/donate">
                Donate Now
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to="/volunteer">Get Involved</Link>
            </Button>
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm text-primary-foreground/75">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Secure giving. Transparent reporting. 100% of field costs published annually.
          </p>
        </div>
      </section>

      {/* Mission preview */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="overflow-hidden rounded-3xl" style={{ boxShadow: "var(--shadow-soft)" }}>
            <img
              src={missionImage}
              alt="Founders Rajasree and Lilibet speaking with village families"
              width={1200}
              height={900}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
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
              scarcity is not destiny. What began as a handful of care packages sent from Toronto to
              a single Bangladeshi village has grown into a community-led movement.
            </p>
            <p className="mt-4 text-muted-foreground">
              Today, Hope Beyond Scarcity works shoulder-to-shoulder with local leaders, mothers and
              clinicians — because lasting change is built by the people who live there.
            </p>
            <Button asChild variant="outline" className="mt-7">
              <Link to="/about">
                Read our story
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Live impact statistics */}
      <ImpactStats />


      {/* Campaign spotlight */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-border bg-card lg:grid lg:grid-cols-2">
          <img
            src={campaignImage}
            alt="Volunteers loading relief supplies onto a boat at a riverside village"
            width={1200}
            height={900}
            loading="lazy"
            className="h-64 w-full object-cover lg:h-full"
          />
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
              <Button asChild size="lg">
                <Link to="/donate">Fund a care package</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/programs">See the program</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Partner carousel */}
      <section className="border-y border-border bg-muted/50 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Supported by partners who show up
          </p>
        </div>
        <div className="group relative mt-8 overflow-hidden">
          <div className="flex w-max animate-[marquee_38s_linear_infinite] gap-4 group-hover:[animation-play-state:paused]">
            {[...partners, ...partners].map((partner, index) => (
              <div
                key={`${partner}-${index}`}
                className="flex h-20 w-64 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 text-center text-sm font-semibold text-muted-foreground"
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
        <div className="rounded-3xl bg-primary px-8 py-14 text-center text-primary-foreground sm:px-14">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Be the reason a child stops going without
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/85">
            Whether you give, volunteer or share our story — you become part of a family's turning
            point.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/donate">Donate Now</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to="/volunteer">Get Involved</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
