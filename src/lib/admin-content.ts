export const CONTENT_TABLES = [
  "programs",
  "news_posts",
  "events",
  "volunteer_roles",
  "legal_pages",
  "impact_stats",
  "partners",
  "sponsors",
] as const;
export type ContentTable = (typeof CONTENT_TABLES)[number];

export type FieldKind =
  | "text"
  | "textarea"
  | "richtext"
  | "number"
  | "boolean"
  | "datetime"
  | "list"
  | "image"
  | "gallery"
  | "icon";

export type FieldDef = {
  name: string;
  label: string;
  kind: FieldKind;
  help?: string;
  placeholder?: string;
  required?: boolean;
  full?: boolean;
};

export type ContentConfig = {
  table: ContentTable;
  singular: string;
  plural: string;
  titleField: string;
  subtitleField: string;
  fields: FieldDef[];
  defaults: Record<string, unknown>;
};

const commonTail: FieldDef[] = [
  { name: "sort_order", label: "Sort order", kind: "number", help: "Lower numbers show first." },
  { name: "is_active", label: "Published", kind: "boolean" },
];

export const CONTENT_CONFIG: Record<ContentTable, ContentConfig> = {
  programs: {
    table: "programs",
    singular: "Program",
    plural: "Programs",
    titleField: "name",
    subtitleField: "summary",
    fields: [
      { name: "name", label: "Name", kind: "text", required: true },
      { name: "slug", label: "Slug", kind: "text", required: true, help: "lowercase-with-dashes" },
      { name: "summary", label: "Summary", kind: "textarea", required: true, full: true },
      { name: "description", label: "Full description", kind: "richtext", full: true },
      { name: "focus_area", label: "Focus area", kind: "text" },
      { name: "location", label: "Location", kind: "text" },
      { name: "icon", label: "Icon name", kind: "text", help: "A lucide icon name, e.g. heart-handshake" },
      { name: "impact_stat", label: "Impact stat", kind: "text", placeholder: "1,200" },
      { name: "impact_label", label: "Impact label", kind: "text", placeholder: "children supported" },
      { name: "highlights", label: "Highlights", kind: "list", full: true, help: "One per line." },
      { name: "image_url", label: "Cover image", kind: "image", full: true },
      { name: "gallery_images", label: "Gallery", kind: "gallery", full: true },
      ...commonTail,
    ],
    defaults: {
      highlights: [],
      gallery_images: [],
      sort_order: 0,
      is_active: true,
    },
  },
  news_posts: {
    table: "news_posts",
    singular: "Story",
    plural: "News",
    titleField: "title",
    subtitleField: "excerpt",
    fields: [
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "slug", label: "Slug", kind: "text", required: true },
      { name: "headline", label: "Headline / kicker", kind: "text", full: true },
      { name: "excerpt", label: "Excerpt", kind: "textarea", required: true, full: true },
      { name: "body", label: "Article body", kind: "richtext", full: true },
      { name: "category", label: "Category", kind: "text", required: true },
      { name: "tags", label: "Tags", kind: "list", full: true, help: "One per line." },
      { name: "author_name", label: "Author", kind: "text" },
      { name: "location", label: "Location", kind: "text" },
      { name: "read_minutes", label: "Read time (minutes)", kind: "number" },
      { name: "published_at", label: "Published at", kind: "datetime" },
      { name: "cover_image_url", label: "Cover image", kind: "image", full: true },
      { name: "gallery_images", label: "Gallery", kind: "gallery", full: true },
      { name: "video_url", label: "Video URL", kind: "text", full: true },
      { name: "is_featured", label: "Featured story", kind: "boolean" },
      ...commonTail,
    ],
    defaults: {
      tags: [],
      gallery_images: [],
      category: "Field Update",
      read_minutes: 4,
      sort_order: 0,
      is_featured: false,
      is_active: true,
    },
  },
  events: {
    table: "events",
    singular: "Event",
    plural: "Events",
    titleField: "title",
    subtitleField: "summary",
    fields: [
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "slug", label: "Slug", kind: "text", required: true },
      { name: "summary", label: "Summary", kind: "textarea", required: true, full: true },
      { name: "description", label: "Full description", kind: "richtext", full: true },
      { name: "event_type", label: "Event type", kind: "text", required: true },
      { name: "starts_at", label: "Starts at", kind: "datetime", required: true },
      { name: "ends_at", label: "Ends at", kind: "datetime" },
      { name: "timezone", label: "Timezone", kind: "text", placeholder: "America/Toronto" },
      { name: "venue", label: "Venue", kind: "text" },
      { name: "city", label: "City", kind: "text" },
      { name: "is_virtual", label: "Virtual event", kind: "boolean" },
      { name: "capacity", label: "Capacity", kind: "number" },
      { name: "registration_url", label: "Registration URL", kind: "text", full: true },
      { name: "cover_image_url", label: "Cover image", kind: "image", full: true },
      { name: "is_featured", label: "Featured event", kind: "boolean" },
      ...commonTail,
    ],
    defaults: {
      timezone: "America/Toronto",
      event_type: "Community",
      is_virtual: false,
      is_featured: false,
      sort_order: 0,
      is_active: true,
    },
  },
  volunteer_roles: {
    table: "volunteer_roles",
    singular: "Volunteer role",
    plural: "Volunteer roles",
    titleField: "title",
    subtitleField: "summary",
    fields: [
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "slug", label: "Slug", kind: "text", required: true },
      { name: "summary", label: "Summary", kind: "textarea", required: true, full: true },
      { name: "description", label: "Full description", kind: "richtext", full: true },
      { name: "interest_area", label: "Interest area", kind: "text", required: true },
      { name: "commitment", label: "Commitment", kind: "text", placeholder: "4 hours / week" },
      { name: "location", label: "Location", kind: "text" },
      { name: "is_remote", label: "Remote friendly", kind: "boolean" },
      { name: "skills", label: "Skills", kind: "list", full: true, help: "One per line." },
      { name: "spots_available", label: "Spots available", kind: "number" },
      ...commonTail,
    ],
    defaults: {
      skills: [],
      interest_area: "General",
      is_remote: false,
      sort_order: 0,
      is_active: true,
    },
  },
  legal_pages: {
    table: "legal_pages",
    singular: "Legal page",
    plural: "Legal pages",
    titleField: "title",
    subtitleField: "summary",
    fields: [
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "slug", label: "Slug", kind: "text", required: true, help: "Used in the URL, e.g. privacy" },
      { name: "summary", label: "Summary", kind: "textarea", required: true, full: true },
      {
        name: "body",
        label: "Policy body",
        kind: "richtext",
        full: true,
        help: 'Use "## Heading" for sections, "- " for bullets, blank lines between paragraphs, **bold** for emphasis.',
      },
      { name: "effective_date", label: "Effective date", kind: "text", placeholder: "2026-01-01" },
      ...commonTail,
    ],
    defaults: {
      summary: "",
      body: "",
      sort_order: 0,
      is_active: true,
    },
  },
  impact_stats: {
    table: "impact_stats",
    singular: "Impact stat",
    plural: "Impact stats",
    titleField: "label",
    subtitleField: "caption",
    fields: [
      { name: "label", label: "Label", kind: "text", required: true, placeholder: "Villages Supported" },
      { name: "display", label: "Display value", kind: "text", required: true, placeholder: "8,400+", help: "Exactly what visitors see, e.g. 8,400+" },
      { name: "value", label: "Count-up number", kind: "number", help: "Plain number used for the animation, e.g. 8400" },
      { name: "suffix", label: "Suffix", kind: "text", placeholder: "+" },
      { name: "caption", label: "Caption", kind: "text", full: true, placeholder: "Rice, hygiene & school kits" },
      { name: "icon", label: "Icon", kind: "icon" },
      ...commonTail,
    ],
    defaults: {
      icon: "sparkles",
      value: 0,
      suffix: "",
      display: "",
      caption: "",
      sort_order: 0,
      is_active: true,
    },
  },
  partners: {
    table: "partners",
    singular: "Partner",
    plural: "Partners",
    titleField: "name",
    subtitleField: "url",
    fields: [
      { name: "name", label: "Partner name", kind: "text", required: true },
      { name: "url", label: "Website link", kind: "text", full: true, placeholder: "https://…" },
      { name: "logo_url", label: "Logo", kind: "image", full: true },
      ...commonTail,
    ],
    defaults: {
      name: "",
      url: "",
      logo_url: "",
      sort_order: 0,
      is_active: true,
    },
  },
  sponsors: {
    table: "sponsors",
    singular: "Sponsor",
    plural: "Sponsors",
    titleField: "name",
    subtitleField: "summary",
    fields: [
      { name: "name", label: "Sponsor name", kind: "text", required: true },
      { name: "slug", label: "Slug", kind: "text", required: true, help: "lowercase-with-dashes" },
      { name: "tier", label: "Tier", kind: "text", required: true, placeholder: "Founding / Gold / Silver / Community" },
      { name: "summary", label: "Summary", kind: "textarea", required: true, full: true },
      { name: "description", label: "Full description", kind: "richtext", full: true },
      { name: "contribution_label", label: "Contribution", kind: "text", placeholder: "Sponsors 4 health camps a year" },
      { name: "location", label: "Location", kind: "text" },
      { name: "since_year", label: "Sponsor since", kind: "text", placeholder: "2025" },
      { name: "website_url", label: "Website link", kind: "text", full: true, placeholder: "https://…" },
      { name: "logo_url", label: "Logo", kind: "image", full: true },
      { name: "is_featured", label: "Featured sponsor", kind: "boolean" },
      ...commonTail,
    ],
    defaults: {
      name: "",
      slug: "",
      tier: "Community",
      summary: "",
      description: "",
      contribution_label: "",
      location: "",
      since_year: "",
      website_url: "",
      logo_url: "",
      is_featured: false,
      sort_order: 0,
      is_active: true,
    },
  },
};

export const CONTENT_COLUMNS: Record<ContentTable, string[]> = {
  programs: CONTENT_CONFIG.programs.fields.map((f) => f.name),
  news_posts: CONTENT_CONFIG.news_posts.fields.map((f) => f.name),
  events: CONTENT_CONFIG.events.fields.map((f) => f.name),
  volunteer_roles: CONTENT_CONFIG.volunteer_roles.fields.map((f) => f.name),
  legal_pages: CONTENT_CONFIG.legal_pages.fields.map((f) => f.name),
  impact_stats: CONTENT_CONFIG.impact_stats.fields.map((f) => f.name),
  partners: CONTENT_CONFIG.partners.fields.map((f) => f.name),
  sponsors: CONTENT_CONFIG.sponsors.fields.map((f) => f.name),
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}

/** Formats an ISO timestamp for a `datetime-local` input. */
export function toLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
