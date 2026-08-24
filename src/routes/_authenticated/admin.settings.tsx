import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  Handshake,
  Home,
  Mail,
  Megaphone,
  RefreshCw,
  Share2,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-shell";
import { ImageInput } from "@/components/admin/media-input";
import { MiniContentList } from "@/components/admin/mini-content-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { BrandSkeleton } from "@/components/ui/brand-loader";
import {
  adminBumpContentVersion,
  adminGetSettings,
  adminSaveSettings,
} from "@/lib/admin.functions";
import { SETTINGS_RULES, validateField, validateForm } from "@/lib/cms-validation";
import { HOME_FALLBACK, type HomeTextKey } from "@/lib/home-content";
import { clearPersistedPublicCache } from "@/lib/query-persist";
import { withRetry } from "@/lib/retry";
import { fromLocalInput, isEmergencyLive, toLocalInput } from "@/lib/site-settings";


export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

const HOME_TEXT_KEYS = Object.keys(HOME_FALLBACK).filter(
  (key) => typeof HOME_FALLBACK[key as HomeTextKey] === "string",
) as HomeTextKey[];

const BASE_KEYS = [
  "emergency_headline",
  "emergency_message",
  "emergency_cta_label",
  "emergency_cta_url",
  "contact_intro",
  "contact_address",
  "contact_email",
  "contact_phone",
  "contact_hours",
  "contact_map_url",
  "social_facebook",
  "social_instagram",
  "social_linkedin",
  "social_youtube",
  "social_x",
  "social_tiktok",
  "social_whatsapp",
] as const;

type Form = Record<string, string | boolean>;

function buildForm(data: Record<string, any>): Form {
  const form: Form = {
    emergency_active: Boolean(data["emergency_active"]),
    campaign_active: data["campaign_active"] ?? true,
    emergency_starts_at: toLocalInput(data["emergency_starts_at"]),
    emergency_ends_at: toLocalInput(data["emergency_ends_at"]),
  };
  for (const key of BASE_KEYS) form[key] = data[key] ?? "";
  for (const key of HOME_TEXT_KEYS) form[key] = data[key] ?? "";
  return form;
}

/** Shared form state so the field components below can stay stable (no remounts). */
const FormCtx = createContext<{
  text: (key: string) => string;
  set: (key: string, value: string | boolean) => void;
  errors: Record<string, string>;
}>({ text: () => "", set: () => {}, errors: {} });

function FieldError({ message }: { message?: string | undefined }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs font-medium text-destructive">
      {message}
    </p>
  );
}

function Field({
  name,
  label,
  kind = "input",
  rows = 3,
  full,
  help,
}: {
  name: string;
  label: string;
  kind?: "input" | "textarea" | "datetime";
  rows?: number;
  full?: boolean;
  help?: string;
}) {
  const { text, set, errors } = useContext(FormCtx);
  const error = errors[name];
  const rule = SETTINGS_RULES[name];
  const invalid = Boolean(error);
  const ring = invalid ? "border-destructive focus-visible:ring-destructive" : "";

  return (
    <div className={`space-y-2 ${full ? "sm:col-span-2" : ""}`}>
      <Label htmlFor={name}>
        {label}
        {rule?.required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      {kind === "textarea" ? (
        <Textarea
          id={name}
          rows={rows}
          value={text(name)}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${name}-error` : undefined}
          className={ring}
          placeholder={String(HOME_FALLBACK[name as HomeTextKey] ?? "")}
          onChange={(e) => set(name, e.target.value)}
        />
      ) : (
        <Input
          id={name}
          type={kind === "datetime" ? "datetime-local" : "text"}
          value={text(name)}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${name}-error` : undefined}
          className={ring}
          placeholder={String(HOME_FALLBACK[name as HomeTextKey] ?? "")}
          onChange={(e) => set(name, e.target.value)}
        />
      )}
      <span id={`${name}-error`}>
        <FieldError message={error} />
      </span>
      {help && !error ? <p className="text-xs text-muted-foreground">{help}</p> : null}
    </div>
  );
}

function ImageField({ name, label }: { name: string; label: string }) {
  const { text, set, errors } = useContext(FormCtx);
  return (
    <div className="space-y-2 sm:col-span-2">
      <Label>{label}</Label>
      <ImageInput value={text(name)} folder="site" onChange={(next) => set(name, next)} />
      <FieldError message={errors[name]} />
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden border-border/70">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-transparent to-transparent">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">{children}</CardContent>
    </Card>
  );
}

const TAB_OF_FIELD: Record<string, string> = {
  hero: "Hero",
  mission: "Mission",
  impact: "Impact",
  campaign: "Campaign",
  partners: "Partners",
  cta: "Call to action",
  emergency: "Emergency",
  contact: "Contact",
  social: "Social",
};

function AdminSettings() {
  const fetchSettings = useServerFn(adminGetSettings);
  const saveSettings = useServerFn(adminSaveSettings);
  const bumpVersion = useServerFn(adminBumpContentVersion);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => fetchSettings(),
  });
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) setForm(buildForm(data as Record<string, any>));
  }, [data]);

  const set = useCallback((key: string, value: string | boolean) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const rule = SETTINGS_RULES[key];
      const message = rule && typeof value === "string" ? validateField(value, rule) : null;
      if (message === prev[key]) return prev;
      const next = { ...prev };
      if (message) next[key] = message;
      else delete next[key];
      return next;
    });
  }, []);

  const text = useCallback((key: string) => String(form?.[key] ?? ""), [form]);
  const ctx = useMemo(() => ({ text, set, errors }), [text, set, errors]);

  async function handleSave() {
    if (!form) return;

    const found = validateForm(form as Record<string, unknown>, SETTINGS_RULES);
    setErrors(found);
    const count = Object.keys(found).length;
    if (count > 0) {
      const sections = [
        ...new Set(
          Object.keys(found).map(
            (key) => TAB_OF_FIELD[key.split("_")[0] ?? ""] ?? "Site settings",
          ),
        ),
      ];
      toast.error(`${count} field${count > 1 ? "s need" : " needs"} attention`, {
        description: `Check: ${sections.join(", ")}. Nothing was saved.`,
      });
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      emergency_starts_at: fromLocalInput(String(form["emergency_starts_at"] ?? "")),
      emergency_ends_at: fromLocalInput(String(form["emergency_ends_at"] ?? "")),
    };
    const toastId = toast.loading("Saving settings…");
    try {
      const result = await withRetry(() => saveSettings({ data: payload as any }), {
        retries: 2,
        onRetry: (attempt) =>
          toast.loading(`Connection hiccup — retrying (${attempt}/2)…`, { id: toastId }),
      });
      if ("error" in result) {
        toast.error("Could not save", { id: toastId, description: result.error });
        return;
      }
      toast.success("Saved — every device refreshes on next load", { id: toastId });
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["home-content"] });
      clearPersistedPublicCache((result as { version?: number }).version);
    } catch (error) {
      toast.error("Could not reach the server", {
        id: toastId,
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleClearCache() {
    setClearing(true);
    const toastId = toast.loading("Clearing cached content everywhere…");
    try {
      const result = await withRetry(() => bumpVersion(), { retries: 2 });
      if ("error" in result) {
        toast.error("Could not clear the cache", { id: toastId, description: result.error });
        return;
      }
      clearPersistedPublicCache(result.version);
      await queryClient.invalidateQueries();
      toast.success("Cache cleared", {
        id: toastId,
        description: `Version ${result.version} — other tabs and devices refresh on next load.`,
      });
    } catch (error) {
      toast.error("Could not reach the server", {
        id: toastId,
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setClearing(false);
    }
  }

  if (isLoading || !form) {
    return (
      <>
        <AdminPageHeader title="Site settings" />
        <BrandSkeleton rows={6} label="Loading site settings…" />
      </>
    );
  }

  const emergencyLive = isEmergencyLive({
    emergency_active: Boolean(form["emergency_active"]),
    emergency_message: text("emergency_message"),
    emergency_starts_at: fromLocalInput(text("emergency_starts_at")),
    emergency_ends_at: fromLocalInput(text("emergency_ends_at")),
  });

  const tabs = [
    { value: "hero", label: "Hero", icon: Home },
    { value: "mission", label: "Mission", icon: Sparkles },
    { value: "impact", label: "Impact", icon: BarChart3 },
    { value: "campaign", label: "Campaign", icon: Target },
    { value: "partners", label: "Partners", icon: Handshake },
    { value: "cta", label: "Call to action", icon: Megaphone },
    { value: "emergency", label: "Emergency", icon: AlertTriangle },
    { value: "contact", label: "Contact", icon: Mail },
    { value: "social", label: "Social", icon: Share2 },
  ];

  const errorCount = Object.keys(errors).length;

  return (
    <FormCtx.Provider value={ctx}>
      <AdminPageHeader
        title="Site settings"
        description="Every word, image, icon and link on the homepage and across the site — editable here."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClearCache}
              disabled={clearing}
              title="Force every browser and device to reload the latest content"
            >
              <RefreshCw className={`size-4 ${clearing ? "animate-spin" : ""}`} aria-hidden="true" />
              {clearing ? "Clearing…" : "Clear cache now"}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        }
      />

      {errorCount > 0 ? (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {errorCount} field{errorCount > 1 ? "s" : ""} need fixing before this can be published.
          Invalid entries are highlighted in their tab.
        </div>
      ) : null}


      <Tabs defaultValue="hero" className="space-y-6">
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="inline-flex h-auto w-max gap-1 rounded-2xl bg-muted/60 p-1">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="gap-2 rounded-xl px-3 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <tab.icon className="size-4" aria-hidden="true" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="focus-visible:outline-none">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="space-y-6"
            >
              {tab.value === "hero" ? (
                <Section
                  title="Hero section"
                  description="The first thing every visitor sees on the homepage."
                >
                  <Field name="hero_badge" label="Badge text" />
                  <Field name="hero_title" label="Headline" />
                  <Field name="hero_subtitle" label="Subtitle" kind="textarea" full />
                  <Field name="hero_primary_label" label="Primary button label" />
                  <Field name="hero_primary_url" label="Primary button link" />
                  <Field name="hero_secondary_label" label="Secondary button label" />
                  <Field name="hero_secondary_url" label="Secondary button link" />
                  <Field name="hero_trust_note" label="Trust note" full />
                  <ImageField name="hero_image_url" label="Hero image" />
                </Section>
              ) : null}

              {tab.value === "mission" ? (
                <Section
                  title="Mission preview"
                  description="The short story block that links to the About page."
                >
                  <Field name="mission_eyebrow" label="Eyebrow" />
                  <Field name="mission_title" label="Title" />
                  <Field name="mission_body_1" label="Paragraph one" kind="textarea" full />
                  <Field name="mission_body_2" label="Paragraph two" kind="textarea" full />
                  <Field name="mission_cta_label" label="Link label" />
                  <Field name="mission_cta_url" label="Link URL" />
                  <ImageField name="mission_image_url" label="Mission image" />
                </Section>
              ) : null}

              {tab.value === "impact" ? (
                <>
                  <Section
                    title="Impact heading"
                    description="Intro copy above the live impact counters."
                  >
                    <Field name="impact_eyebrow" label="Eyebrow" />
                    <Field name="impact_title" label="Title" />
                    <Field name="impact_intro" label="Intro paragraph" kind="textarea" full />
                  </Section>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Live impact counters</CardTitle>
                      <CardDescription>
                        Numbers, labels, captions and icons — reorder or hide any of them.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <MiniContentList table="impact_stats" />
                    </CardContent>
                  </Card>
                </>
              ) : null}

              {tab.value === "campaign" ? (
                <Section
                  title="Campaign spotlight"
                  description="The featured appeal block on the homepage."
                >
                  <div className="flex items-center justify-between rounded-lg border border-border p-3 sm:col-span-2">
                    <div>
                      <p className="text-sm font-medium">Show the campaign spotlight</p>
                      <p className="text-xs text-muted-foreground">
                        Turn off to hide this whole section from the homepage.
                      </p>
                    </div>
                    <Switch
                      checked={Boolean(form["campaign_active"])}
                      onCheckedChange={(v) => set("campaign_active", v)}
                    />
                  </div>
                  <Field name="campaign_eyebrow" label="Eyebrow" />
                  <Field name="campaign_title" label="Title" />
                  <Field name="campaign_body" label="Description" kind="textarea" rows={4} full />
                  <Field name="campaign_goal_label" label="Goal label" />
                  <Field name="campaign_goal_value" label="Goal value" />
                  <Field name="campaign_cost_label" label="Cost label" />
                  <Field name="campaign_cost_value" label="Cost value" />
                  <Field name="campaign_primary_label" label="Primary button label" />
                  <Field name="campaign_primary_url" label="Primary button link" />
                  <Field name="campaign_secondary_label" label="Secondary button label" />
                  <Field name="campaign_secondary_url" label="Secondary button link" />
                  <ImageField name="campaign_image_url" label="Campaign image" />
                </Section>
              ) : null}

              {tab.value === "partners" ? (
                <>
                  <Section title="Partners heading" description="Copy above the partner logos.">
                    <Field name="partners_heading" label="Heading" full />
                  </Section>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Partner logos</CardTitle>
                      <CardDescription>
                        Upload a logo, set the link, reorder or hide each partner.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <MiniContentList table="partners" />
                    </CardContent>
                  </Card>
                </>
              ) : null}

              {tab.value === "cta" ? (
                <Section
                  title="Closing call to action"
                  description="The final invitation at the bottom of the homepage."
                >
                  <Field name="cta_title" label="Title" full />
                  <Field name="cta_body" label="Body" kind="textarea" full />
                  <Field name="cta_primary_label" label="Primary button label" />
                  <Field name="cta_primary_url" label="Primary button link" />
                  <Field name="cta_secondary_label" label="Secondary button label" />
                  <Field name="cta_secondary_url" label="Secondary button link" />
                </Section>
              ) : null}

              {tab.value === "emergency" ? (
                <Section
                  title="Emergency appeal banner"
                  description={
                    emergencyLive
                      ? "This appeal is showing on the site right now."
                      : "This appeal is not visible with the current switch and schedule."
                  }
                >
                  <div className="flex items-center justify-between rounded-lg border border-border p-3 sm:col-span-2">
                    <div>
                      <p className="text-sm font-medium">Appeal enabled</p>
                      <p className="text-xs text-muted-foreground">
                        Within the scheduled window below, the banner appears on the homepage.
                      </p>
                    </div>
                    <Switch
                      checked={Boolean(form["emergency_active"])}
                      onCheckedChange={(v) => set("emergency_active", v)}
                    />
                  </div>
                  <Field name="emergency_headline" label="Headline" />
                  <Field name="emergency_cta_label" label="Button label" />
                  <Field name="emergency_message" label="Message" kind="textarea" full />
                  <Field name="emergency_cta_url" label="Button link" />
                  <Field name="emergency_starts_at" label="Starts" kind="datetime" />
                  <Field
                    name="emergency_ends_at"
                    label="Ends"
                    kind="datetime"
                    help="Leave a date empty for “no limit”."
                  />
                </Section>
              ) : null}

              {tab.value === "contact" ? (
                <Section
                  title="Contact details"
                  description="Shown on the contact page and in the footer."
                >
                  <Field name="contact_intro" label="Intro text" kind="textarea" full />
                  <Field name="contact_address" label="Address" />
                  <Field name="contact_email" label="Email" />
                  <Field name="contact_phone" label="Phone" />
                  <Field name="contact_hours" label="Office hours" />
                  <Field name="contact_map_url" label="Map embed URL" full />
                </Section>
              ) : null}

              {tab.value === "social" ? (
                <Section
                  title="Social links"
                  description="Empty fields hide that icon from the footer."
                >
                  <Field name="social_facebook" label="Facebook" />
                  <Field name="social_instagram" label="Instagram" />
                  <Field name="social_linkedin" label="LinkedIn" />
                  <Field name="social_youtube" label="YouTube" />
                  <Field name="social_x" label="X (Twitter)" />
                  <Field name="social_tiktok" label="TikTok" />
                  <Field name="social_whatsapp" label="WhatsApp" />
                </Section>
              ) : null}
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
    </FormCtx.Provider>

  );
}
