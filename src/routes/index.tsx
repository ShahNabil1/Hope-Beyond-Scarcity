import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, HeartHandshake, ShieldCheck } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { ImpactStats } from "@/components/impact-stats";
import { Reveal } from "@/components/reveal";

import heroImage from "@/assets/hero-children.jpg";
import missionImage from "@/assets/mission-founders.jpg";
import campaignImage from "@/assets/campaign-spotlight.jpg";
import { EmergencyBanner } from "@/components/emergency-banner";
import { Button } from "@/components/ui/button";
import { CmsLink } from "@/components/cms-link";
import { mediaUrl } from "@/components/admin/media-input";
import { homeContentQueryOptions, homeText } from "@/lib/home-content";


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
      { property: "og:url", content: "https://hopebeyondscarcity.com/" },
      { property: "og:image", content: "https://hopebeyondscarcity.com/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: "https://hopebeyondscarcity.com/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://hopebeyondscarcity.com/" }],
  }),
  loader: ({ context }) => {
    // Warm the cache, but never let a transient content failure blank the page:
    // the component renders with built-in fallback copy while data arrives.
    void context.queryClient.ensureQueryData(homeContentQueryOptions).catch(() => undefined);
  },
  errorComponent: ({ error }) => (
    <div role="alert" className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-foreground">We could not load the homepage</h1>
      <p className="mt-3 text-muted-foreground">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center text-muted-foreground">
      Page not found.
    </div>
  ),
  component: Index,
});




function Index() {
  const { data } = useQuery(homeContentQueryOptions);
  const settings = data?.settings ?? null;
  const t = (key: Parameters<typeof homeText>[1]) => homeText(settings, key);
  const partners = data?.partners ?? [];
  const heroSrc = settings?.hero_image_url ? mediaUrl(settings.hero_image_url) : heroImage;
  const missionSrc = settings?.mission_image_url
    ? mediaUrl(settings.mission_image_url)
    : missionImage;
  const campaignSrc = settings?.campaign_image_url
    ? mediaUrl(settings.campaign_image_url)
    : campaignImage;
  const campaignVisible = settings?.campaign_active ?? true;
  const partnerCards = partners.length
    ? partners
    : [
        { id: "p1", name: "Prioom Nath's Clinic Initiative", logo_url: "", url: "" },
        { id: "p2", name: "Toronto Community Trust", logo_url: "", url: "" },
        { id: "p3", name: "Riverside Volunteers Guild", logo_url: "", url: "" },
        { id: "p4", name: "Bengal Health Collective", logo_url: "", url: "" },
        { id: "p5", name: "Maple Leaf Giving Circle", logo_url: "", url: "" },
        { id: "p6", name: "Hope Logistics Partners", logo_url: "", url: "" },
      ];

  return (
    <>
      <EmergencyBanner />

      {/* Hero */}
      <section className="relative overflow-hidden bg-primary-deep text-primary-foreground">
        <img
          src={heroSrc}
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
              {t("hero_badge")}
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {t("hero_title")}
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-5 max-w-2xl text-base text-primary-foreground/90 sm:text-lg">
              {t("hero_subtitle")}
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="group bg-accent text-accent-foreground shadow-lg shadow-accent/25 transition-all duration-300 hover:bg-accent/90 hover:shadow-xl hover:shadow-accent/40 motion-safe:hover:-translate-y-0.5"
              >
                <CmsLink href={t("hero_primary_url")}>
                  {t("hero_primary_label")}
                  <ArrowRight className="size-4 transition-transform duration-300 motion-safe:group-hover:translate-x-1" />
                </CmsLink>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/50 bg-primary-foreground/10 text-primary-foreground backdrop-blur-md transition-all duration-300 hover:bg-primary-foreground/20 hover:text-primary-foreground motion-safe:hover:-translate-y-0.5"
              >
                <CmsLink href={t("hero_secondary_url")}>{t("hero_secondary_label")}</CmsLink>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.32}>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-2 text-xs text-primary-foreground backdrop-blur-md sm:text-sm">
              <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
              {t("hero_trust_note")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Mission preview */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-10 sm:gap-12 lg:grid-cols-2">
          <Reveal from="left">
            <div
              className="group overflow-hidden rounded-3xl"
              style={{ boxShadow: "var(--shadow-soft)" }}
            >
              <img
                src={missionSrc}
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
                {t("mission_eyebrow")}
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {t("mission_title")}
              </h2>
              <p className="mt-5 text-muted-foreground">{t("mission_body_1")}</p>
              <p className="mt-4 text-muted-foreground">{t("mission_body_2")}</p>
              <Button
                asChild
                variant="outline"
                className="group mt-7 transition-all duration-300 motion-safe:hover:-translate-y-0.5"
              >
                <CmsLink href={t("mission_cta_url")}>
                  {t("mission_cta_label")}
                  <ArrowRight className="size-4 transition-transform duration-300 motion-safe:group-hover:translate-x-1" />
                </CmsLink>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Live impact statistics */}
      <ImpactStats settings={settings} stats={data?.stats ?? []} />


      {/* Campaign spotlight */}
      {campaignVisible ? (
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="group overflow-hidden rounded-3xl border border-border bg-card transition-shadow duration-500 hover:shadow-xl lg:grid lg:grid-cols-2">
            <div className="overflow-hidden">
              <img
                src={campaignSrc}
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
                {t("campaign_eyebrow")}
              </span>
              <h2 className="mt-5 text-3xl font-bold tracking-tight text-foreground">
                {t("campaign_title")}
              </h2>
              <p className="mt-4 text-muted-foreground">{t("campaign_body")}</p>
              <dl className="mt-7 grid grid-cols-2 gap-6">
                <div>
                  <dt className="text-sm text-muted-foreground">{t("campaign_goal_label")}</dt>
                  <dd className="text-2xl font-bold text-foreground">{t("campaign_goal_value")}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t("campaign_cost_label")}</dt>
                  <dd className="text-2xl font-bold text-foreground">{t("campaign_cost_value")}</dd>
                </div>
              </dl>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="transition-all duration-300 motion-safe:hover:-translate-y-0.5"
                >
                  <CmsLink href={t("campaign_primary_url")}>{t("campaign_primary_label")}</CmsLink>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="transition-all duration-300 motion-safe:hover:-translate-y-0.5"
                >
                  <CmsLink href={t("campaign_secondary_url")}>
                    {t("campaign_secondary_label")}
                  </CmsLink>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
      ) : null}

      {/* Partner carousel */}
      <section className="border-y border-border bg-muted/50 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t("partners_heading")}
          </p>
        </div>
        <div className="group relative mt-8 overflow-hidden">
          <div className="flex w-max gap-4 motion-safe:animate-[marquee_38s_linear_infinite] group-hover:[animation-play-state:paused]">
            {[...partnerCards, ...partnerCards].map((partner, index) => (
              <div
                key={`${partner.id}-${index}`}
                className="flex h-20 w-64 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 text-center text-sm font-semibold text-muted-foreground transition-all duration-300 hover:border-primary/40 hover:text-foreground motion-safe:hover:-translate-y-1"
              >
                {partner.logo_url ? (
                  <img
                    src={mediaUrl(partner.logo_url)}
                    alt={partner.name}
                    loading="lazy"
                    className="max-h-12 max-w-[80%] object-contain"
                  />
                ) : (
                  <>
                    <HeartHandshake className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    {partner.name}
                  </>
                )}
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
                {t("cta_title")}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/90">{t("cta_body")}</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="bg-accent text-accent-foreground shadow-lg shadow-accent/25 transition-all duration-300 hover:bg-accent/90 motion-safe:hover:-translate-y-0.5"
                >
                  <CmsLink href={t("cta_primary_url")}>{t("cta_primary_label")}</CmsLink>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/50 bg-primary-foreground/10 text-primary-foreground backdrop-blur-md transition-all duration-300 hover:bg-primary-foreground/20 hover:text-primary-foreground motion-safe:hover:-translate-y-0.5"
                >
                  <CmsLink href={t("cta_secondary_url")}>{t("cta_secondary_label")}</CmsLink>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

