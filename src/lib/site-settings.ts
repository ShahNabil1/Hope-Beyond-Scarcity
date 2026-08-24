export type SiteSettings = {
  id: string;
  emergency_active: boolean;
  emergency_headline: string;
  emergency_message: string;
  emergency_cta_label: string;
  emergency_cta_url: string;
  emergency_starts_at: string | null;
  emergency_ends_at: string | null;
  contact_intro: string;
  contact_address: string;
  contact_email: string;
  contact_phone: string;
  contact_hours: string;
  contact_map_url: string;
  social_facebook: string;
  social_instagram: string;
  social_linkedin: string;
  social_youtube: string;
  social_x: string;
  social_tiktok: string;
  social_whatsapp: string;
};

export type SocialKey =
  | "social_facebook"
  | "social_instagram"
  | "social_linkedin"
  | "social_youtube"
  | "social_x"
  | "social_tiktok"
  | "social_whatsapp";

export const SOCIAL_FIELDS: { key: SocialKey; label: string; placeholder: string }[] = [
  { key: "social_facebook", label: "Facebook", placeholder: "https://facebook.com/…" },
  { key: "social_instagram", label: "Instagram", placeholder: "https://instagram.com/…" },
  { key: "social_linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/…" },
  { key: "social_youtube", label: "YouTube", placeholder: "https://youtube.com/@…" },
  { key: "social_x", label: "X (Twitter)", placeholder: "https://x.com/…" },
  { key: "social_tiktok", label: "TikTok", placeholder: "https://tiktok.com/@…" },
  { key: "social_whatsapp", label: "WhatsApp", placeholder: "https://wa.me/1…" },
];

/** The appeal shows only when it is switched on AND inside its scheduled window. */
export function isEmergencyLive(
  settings: Pick<
    SiteSettings,
    "emergency_active" | "emergency_starts_at" | "emergency_ends_at" | "emergency_message"
  > | null,
  now: Date = new Date(),
): boolean {
  if (!settings?.emergency_active) return false;
  if (!settings.emergency_message.trim()) return false;
  if (settings.emergency_starts_at && new Date(settings.emergency_starts_at) > now) return false;
  if (settings.emergency_ends_at && new Date(settings.emergency_ends_at) < now) return false;
  return true;
}

/** Formats an ISO timestamp for a `datetime-local` input. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
