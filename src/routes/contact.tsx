import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getSiteSettings } from "@/lib/content.functions";
import { submitContactMessage } from "@/lib/admin.functions";

const title = "Contact | Hope Beyond Scarcity";
const description =
  "Reach the Hope Beyond Scarcity team in Toronto, Ontario for partnerships, media, or donor support.";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const fetchSettings = useServerFn(getSiteSettings);
  const sendMessage = useServerFn(submitContactMessage);
  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => fetchSettings(),
    staleTime: 60_000,
  });

  const [form, setForm] = useState({ full_name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const result = await sendMessage({ data: form });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Thank you — we'll reply within two business days.");
      setForm({ full_name: "", email: "", subject: "", message: "" });
    } catch {
      toast.error("Please check your details and try again.");
    } finally {
      setSending(false);
    }
  }

  const details = [
    { icon: MapPin, label: "Head office", value: settings?.contact_address },
    { icon: Mail, label: "Email", value: settings?.contact_email },
    { icon: Phone, label: "Phone", value: settings?.contact_phone },
    { icon: Clock, label: "Hours", value: settings?.contact_hours },
  ].filter((d) => d.value);

  return (
    <>
      <PageHero
        eyebrow="Say Hello"
        title="We would love to hear from you"
        description={
          settings?.contact_intro?.trim() ||
          "Head office: Toronto, Ontario, Canada. We reply to every message within two business days."
        }
      />

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-8 lg:py-16">
        <div className="space-y-4">
          {details.map((d) => (
            <Card key={d.label}>
              <CardContent className="flex items-start gap-3 pt-6">
                <d.icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {d.label}
                  </p>
                  <p className="text-sm text-foreground">{d.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}

          {settings?.contact_map_url ? (
            <div className="overflow-hidden rounded-xl border border-border">
              <iframe
                src={settings.contact_map_url}
                title="Office location map"
                loading="lazy"
                className="h-64 w-full border-0"
              />
            </div>
          ) : null}
        </div>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-foreground">Send us a message</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full name</Label>
                  <Input
                    id="full_name"
                    required
                    maxLength={100}
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    maxLength={255}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  required
                  maxLength={150}
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  required
                  rows={6}
                  minLength={10}
                  maxLength={2000}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>
              <Button type="submit" disabled={sending} className="w-full sm:w-auto">
                {sending ? "Sending…" : "Send message"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
