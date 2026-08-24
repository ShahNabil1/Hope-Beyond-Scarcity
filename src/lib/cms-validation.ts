/**
 * Shared CMS field validation.
 *
 * Every editable field on the homepage/site settings has a declared kind so
 * that invalid data (broken links, bad emails, oversized copy) is caught with
 * an inline message before it can reach the public site.
 */

export type FieldKind = "text" | "longtext" | "url" | "image" | "email" | "phone" | "datetime";

export type FieldRule = {
  kind: FieldKind;
  label: string;
  required?: boolean;
  max?: number;
};

const LINK_RE = /^(https?:\/\/[^\s]+|\/[^\s]*|#[^\s]*|mailto:[^\s@]+@[^\s@]+\.[^\s@]+|tel:\+?[\d\s()-]+)$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+()\d\s.\-x]{6,40}$/i;
const STORAGE_PATH_RE = /^[a-z0-9][a-z0-9/_-]*\.[a-z0-9]{2,5}$/i;

/** Returns an error message, or null when the value is acceptable. */
export function validateField(value: string, rule: FieldRule): string | null {
  const raw = (value ?? "").trim();
  const max = rule.max ?? (rule.kind === "longtext" ? 2000 : 300);

  if (!raw) {
    return rule.required ? `${rule.label} is required.` : null;
  }
  if (raw.length > max) {
    return `${rule.label} must be ${max} characters or fewer (currently ${raw.length}).`;
  }

  switch (rule.kind) {
    case "url":
      if (!LINK_RE.test(raw)) {
        return "Enter a full link (https://…), a site path (/donate), or mailto:/tel: address.";
      }
      return null;
    case "image":
      if (/^https?:\/\//i.test(raw) || raw.startsWith("/") || raw.startsWith("data:")) return null;
      if (STORAGE_PATH_RE.test(raw)) return null;
      return "Upload a file or paste a full image URL starting with https://";
    case "email":
      return EMAIL_RE.test(raw) ? null : "Enter a valid email address.";
    case "phone":
      return PHONE_RE.test(raw) ? null : "Enter a valid phone number.";
    case "datetime": {
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? "Enter a valid date and time." : null;
    }
    default:
      return null;
  }
}

/** Validates a whole form against a rule map. */
export function validateForm(
  form: Record<string, unknown>,
  rules: Record<string, FieldRule>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [name, rule] of Object.entries(rules)) {
    const message = validateField(String(form[name] ?? ""), rule);
    if (message) errors[name] = message;
  }
  return errors;
}

const t = (label: string, extra: Partial<FieldRule> = {}): FieldRule => ({
  kind: "text",
  label,
  max: 300,
  ...extra,
});
const long = (label: string, extra: Partial<FieldRule> = {}): FieldRule => ({
  kind: "longtext",
  label,
  max: 2000,
  ...extra,
});
const url = (label: string, extra: Partial<FieldRule> = {}): FieldRule => ({
  kind: "url",
  label,
  max: 500,
  ...extra,
});
const img = (label: string): FieldRule => ({ kind: "image", label, max: 2000 });

/** Rules for the admin “Site settings” screen. */
export const SETTINGS_RULES: Record<string, FieldRule> = {
  // Hero
  hero_badge: t("Badge text", { max: 80 }),
  hero_title: t("Headline", { required: true, max: 160 }),
  hero_subtitle: long("Subtitle", { max: 600 }),
  hero_primary_label: t("Primary button label", { max: 60 }),
  hero_primary_url: url("Primary button link"),
  hero_secondary_label: t("Secondary button label", { max: 60 }),
  hero_secondary_url: url("Secondary button link"),
  hero_trust_note: t("Trust note", { max: 240 }),
  hero_image_url: img("Hero image"),
  // Mission
  mission_eyebrow: t("Eyebrow", { max: 80 }),
  mission_title: t("Title", { max: 160 }),
  mission_body_1: long("Paragraph one"),
  mission_body_2: long("Paragraph two"),
  mission_cta_label: t("Link label", { max: 60 }),
  mission_cta_url: url("Link URL"),
  mission_image_url: img("Mission image"),
  // Impact
  impact_eyebrow: t("Eyebrow", { max: 80 }),
  impact_title: t("Title", { max: 160 }),
  impact_intro: long("Intro paragraph", { max: 800 }),
  // Campaign
  campaign_eyebrow: t("Eyebrow", { max: 80 }),
  campaign_title: t("Title", { max: 160 }),
  campaign_body: long("Description"),
  campaign_goal_label: t("Goal label", { max: 80 }),
  campaign_goal_value: t("Goal value", { max: 80 }),
  campaign_cost_label: t("Cost label", { max: 80 }),
  campaign_cost_value: t("Cost value", { max: 80 }),
  campaign_primary_label: t("Primary button label", { max: 60 }),
  campaign_primary_url: url("Primary button link"),
  campaign_secondary_label: t("Secondary button label", { max: 60 }),
  campaign_secondary_url: url("Secondary button link"),
  campaign_image_url: img("Campaign image"),
  // Partners + CTA
  partners_heading: t("Heading", { max: 200 }),
  cta_title: t("Title", { max: 160 }),
  cta_body: long("Body", { max: 800 }),
  cta_primary_label: t("Primary button label", { max: 60 }),
  cta_primary_url: url("Primary button link"),
  cta_secondary_label: t("Secondary button label", { max: 60 }),
  cta_secondary_url: url("Secondary button link"),
  // Emergency
  emergency_headline: t("Headline", { max: 120 }),
  emergency_message: long("Message", { max: 600 }),
  emergency_cta_label: t("Button label", { max: 60 }),
  emergency_cta_url: url("Button link"),
  // Contact
  contact_intro: long("Intro text", { max: 1000 }),
  contact_address: t("Address"),
  contact_email: { kind: "email", label: "Email", max: 200 },
  contact_phone: { kind: "phone", label: "Phone", max: 80 },
  contact_hours: t("Office hours", { max: 200 }),
  contact_map_url: url("Map embed URL"),
  // Social
  social_facebook: url("Facebook"),
  social_instagram: url("Instagram"),
  social_linkedin: url("LinkedIn"),
  social_youtube: url("YouTube"),
  social_x: url("X (Twitter)"),
  social_tiktok: url("TikTok"),
  social_whatsapp: url("WhatsApp"),
};
