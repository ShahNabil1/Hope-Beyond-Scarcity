import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGetSettings, adminSaveSettings } from "@/lib/admin.functions";
import {
  SOCIAL_FIELDS,
  fromLocalInput,
  isEmergencyLive,
  toLocalInput,
} from "@/lib/site-settings";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

type FormState = {
  emergency_active: boolean;
  emergency_headline: string;
  emergency_message: string;
  emergency_cta_label: string;
  emergency_cta_url: string;
  emergency_starts_at: string;
  emergency_ends_at: string;
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

function AdminSettings() {
  const fetchSettings = useServerFn(adminGetSettings);
  const saveSettings = useServerFn(adminSaveSettings);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => fetchSettings(),
  });
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setForm({
      emergency_active: data.emergency_active,
      emergency_headline: data.emergency_headline,
      emergency_message: data.emergency_message,
      emergency_cta_label: data.emergency_cta_label,
      emergency_cta_url: data.emergency_cta_url,
      emergency_starts_at: toLocalInput(data.emergency_starts_at),
      emergency_ends_at: toLocalInput(data.emergency_ends_at),
      contact_intro: data.contact_intro,
      contact_address: data.contact_address,
      contact_email: data.contact_email,
      contact_phone: data.contact_phone,
      contact_hours: data.contact_hours,
      contact_map_url: data.contact_map_url,
      social_facebook: data.social_facebook ?? "",
      social_instagram: data.social_instagram ?? "",
      social_linkedin: data.social_linkedin ?? "",
      social_youtube: data.social_youtube ?? "",
      social_x: data.social_x ?? "",
      social_tiktok: data.social_tiktok ?? "",
      social_whatsapp: data.social_whatsapp ?? "",
    });
  }, [data]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    const payload = {
      ...form,
      emergency_starts_at: fromLocalInput(form.emergency_starts_at),
      emergency_ends_at: fromLocalInput(form.emergency_ends_at),
    };
    const result = await saveSettings({ data: payload });
    setSaving(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Settings saved");
    queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    queryClient.invalidateQueries({ queryKey: ["site-settings"] });
  }

  if (isLoading || !form) {
    return (
      <>
        <AdminPageHeader title="Site settings" />
        <Skeleton className="h-96 rounded-xl" />
      </>
    );
  }

  const live = isEmergencyLive({
    emergency_active: form.emergency_active,
    emergency_message: form.emergency_message,
    emergency_starts_at: fromLocalInput(form.emergency_starts_at),
    emergency_ends_at: fromLocalInput(form.emergency_ends_at),
  });

  return (
    <>
      <AdminPageHeader
        title="Site settings"
        description="Control the emergency appeal banner and the contact page details."
        action={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        }
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Emergency appeal banner</CardTitle>
            <CardDescription>
              {live
                ? "This appeal is showing on the site right now."
                : "This appeal is not visible on the site with the current switch and schedule."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Appeal enabled</p>
                <p className="text-xs text-muted-foreground">
                  Within the scheduled window below, the banner appears on the homepage.
                </p>
              </div>
              <Switch
                checked={form.emergency_active}
                onCheckedChange={(v) => set("emergency_active", v)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  value={form.emergency_headline}
                  onChange={(e) => set("emergency_headline", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cta">Button label</Label>
                <Input
                  id="cta"
                  value={form.emergency_cta_label}
                  onChange={(e) => set("emergency_cta_label", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                rows={3}
                value={form.emergency_message}
                onChange={(e) => set("emergency_message", e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="ctaurl">Button link</Label>
                <Input
                  id="ctaurl"
                  value={form.emergency_cta_url}
                  onChange={(e) => set("emergency_cta_url", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="starts">Starts</Label>
                <Input
                  id="starts"
                  type="datetime-local"
                  value={form.emergency_starts_at}
                  onChange={(e) => set("emergency_starts_at", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ends">Ends</Label>
                <Input
                  id="ends"
                  type="datetime-local"
                  value={form.emergency_ends_at}
                  onChange={(e) => set("emergency_ends_at", e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave a date empty for “no limit”.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact page</CardTitle>
            <CardDescription>Shown publicly on the /contact page and footer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="intro">Intro text</Label>
              <Textarea
                id="intro"
                rows={3}
                value={form.contact_intro}
                onChange={(e) => set("contact_intro", e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={form.contact_address}
                  onChange={(e) => set("contact_address", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={form.contact_email}
                  onChange={(e) => set("contact_email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.contact_phone}
                  onChange={(e) => set("contact_phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">Office hours</Label>
                <Input
                  id="hours"
                  value={form.contact_hours}
                  onChange={(e) => set("contact_hours", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="map">Map embed URL</Label>
              <Input
                id="map"
                value={form.contact_map_url}
                onChange={(e) => set("contact_map_url", e.target.value)}
                placeholder="https://www.google.com/maps/embed?..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Social media links</CardTitle>
            <CardDescription>
              Shown as icons in the footer. Leave a field empty to hide that icon.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {SOCIAL_FIELDS.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  value={form[field.key]}
                  onChange={(e) => set(field.key, e.target.value)}
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </>
  );
}
