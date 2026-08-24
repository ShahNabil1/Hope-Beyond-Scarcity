import { queryOptions } from "@tanstack/react-query";

import { getHomeContent, getSiteSettings } from "@/lib/content.functions";

export type HomeContent = Awaited<ReturnType<typeof getHomeContent>>;
export type HomeSettings = NonNullable<HomeContent["settings"]>;
export type ImpactStatRow = HomeContent["stats"][number];
export type PartnerRow = HomeContent["partners"][number];

export const HOME_FALLBACK_CONTENT: HomeContent = {
  settings: null,
  stats: [],
  partners: [],
};

/**
 * Public content is cached aggressively (and persisted to localStorage) so
 * repeat visits paint instantly, then revalidated in the background so a CMS
 * edit shows up on the very next view.
 */
export const homeContentQueryOptions = queryOptions({
  queryKey: ["home-content"],
  queryFn: async () => {
    try {
      return await getHomeContent();
    } catch {
      // The static brand content remains available during a transient outage;
      // React Query retries/revalidates on the next mount or reconnect.
      return HOME_FALLBACK_CONTENT;
    }
  },
  staleTime: 5 * 60_000,
  gcTime: 24 * 60 * 60_000,
  refetchOnMount: "always",
});

export const siteSettingsQueryOptions = queryOptions({
  queryKey: ["site-settings"],
  queryFn: () => getSiteSettings(),
  staleTime: 5 * 60_000,
  gcTime: 24 * 60 * 60_000,
  refetchOnMount: "always",
});

/** Text used before the CMS record loads (or if a field is emptied). */
export const HOME_FALLBACK = {
  hero_badge: "Canadian Not-for-Profit Corporation",
  hero_title: "Every child deserves hope beyond scarcity",
  hero_subtitle:
    "We walk with families in under-served villages — delivering care packages, health support and education so children can grow up with dignity, safety and possibility.",
  hero_primary_label: "Donate Now",
  hero_primary_url: "/donate",
  hero_secondary_label: "Get Involved",
  hero_secondary_url: "/volunteer",
  hero_trust_note: "Secure giving. Transparent reporting. 100% of field costs published annually.",
  hero_image_url: "",
  mission_eyebrow: "Our Mission",
  mission_title: "It started with two women and one refusal to look away",
  mission_body_1:
    "Rajasree and Lilibet met over a shared conviction: scarcity is not destiny. What began as a handful of care packages sent from Toronto to a single Bangladeshi village has grown into a community-led movement.",
  mission_body_2:
    "Today, Hope Beyond Scarcity works shoulder-to-shoulder with local leaders, mothers and clinicians — because lasting change is built by the people who live there.",
  mission_cta_label: "Read our story",
  mission_cta_url: "/about",
  mission_image_url: "",
  impact_eyebrow: "Live Impact",
  impact_title: "Generosity, measured in real lives",
  impact_intro:
    "Every number below is a family reached, a clinic opened, a school bag filled — verified by our field team and published in our annual transparency report.",
  campaign_eyebrow: "Campaign Spotlight",
  campaign_title: "August 2026 Care Package Distribution",
  campaign_body:
    "This month our field team travels to six Bangladeshi villages with family care packages containing rice, hygiene kits, school supplies and clean-water tablets. Our goal: 1,200 packages before the monsoon peak.",
  campaign_goal_label: "Goal",
  campaign_goal_value: "1,200 packages",
  campaign_cost_label: "Cost per family",
  campaign_cost_value: "$50 CAD",
  campaign_primary_label: "Fund a care package",
  campaign_primary_url: "/donate",
  campaign_secondary_label: "See the program",
  campaign_secondary_url: "/programs",
  campaign_image_url: "",
  campaign_active: true,
  partners_heading: "Supported by partners who show up",
  cta_title: "Be the reason a child stops going without",
  cta_body:
    "Whether you give, volunteer or share our story — you become part of a family's turning point.",
  cta_primary_label: "Donate Now",
  cta_primary_url: "/donate",
  cta_secondary_label: "Get Involved",
  cta_secondary_url: "/volunteer",
} as const;

export type HomeTextKey = keyof typeof HOME_FALLBACK;

/** Reads a homepage field, falling back to the built-in copy when empty. */
export function homeText(
  settings: Partial<HomeSettings> | null | undefined,
  key: HomeTextKey,
): string {
  const value = settings ? (settings as Record<string, unknown>)[key] : undefined;
  if (typeof value === "string" && value.trim()) return value;
  const fallback = HOME_FALLBACK[key];
  return typeof fallback === "string" ? fallback : "";
}
