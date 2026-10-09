import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowUp, ExternalLink, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-shell";
import { ImageInput } from "@/components/admin/media-input";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { BrandSkeleton } from "@/components/ui/brand-loader";
import {
  aboutContentSchema,
  type AboutContent,
  type Founder,
} from "@/lib/about-content";
import { adminGetAbout, adminSaveAbout } from "@/lib/admin.functions";
import { clearPersistedPublicCache } from "@/lib/query-persist";

export const Route = createFileRoute("/_authenticated/admin/about")({
  component: AdminAboutPage,
});

type Errors = Record<string, string>;

function collectErrors(content: AboutContent): Errors {
  const parsed = aboutContentSchema.safeParse(content);
  if (parsed.success) return {};
  const out: Errors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

const TAB_PREFIX: Record<string, string[]> = {
  hero: ["hero"],
  intro: ["intro"],
  founders: ["founders"],
  convergence: ["convergence"],
  mission: ["mission"],
  seo: ["seo_title", "seo_description"],
};

function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: ReactNode;
  htmlFor?: string | undefined;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function VisibleToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      <Switch checked={checked} onCheckedChange={onChange} />
      {checked ? "Shown on page" : "Hidden"}
    </label>
  );
}

function newFounder(): Founder {
  return {
    id: `founder-${Date.now().toString(36)}`,
    visible: true,
    name: "",
    role: "Founder",
    location: "Toronto, Ontario",
    image_url: "",
    story: "",
    quote: "",
  };
}

function AdminAboutPage() {
  const fetchAbout = useServerFn(adminGetAbout);
  const saveAbout = useServerFn(adminSaveAbout);
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "about"],
    queryFn: () => fetchAbout(),
  });

  const [form, setForm] = useState<AboutContent | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("hero");
  const confirm = useConfirm();

  useEffect(() => {
    if (data?.content && !form) setForm(structuredClone(data.content));
  }, [data, form]);

  const dirty = useMemo(
    () => !!form && !!data && JSON.stringify(form) !== JSON.stringify(data.content),
    [form, data],
  );

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (isLoading || !form) {
    return (
      <>
        <AdminPageHeader title="About page" description="Edit every section of the public About page." />
        {error ? (
          <p className="text-sm text-destructive">Could not load the About page. Please refresh.</p>
        ) : (
          <BrandSkeleton rows={6} label="Loading About page" />
        )}
      </>
    );
  }

  function update(mutator: (draft: AboutContent) => void) {
    setForm((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      mutator(next);
      if (Object.keys(errors).length) setErrors(collectErrors(next));
      return next;
    });
  }

  function updateFounder(index: number, patch: Partial<Founder>) {
    update((d) => {
      const current = d.founders[index];
      if (current) d.founders[index] = { ...current, ...patch };
    });
  }

  function moveFounder(index: number, dir: -1 | 1) {
    update((d) => {
      const target = index + dir;
      if (target < 0 || target >= d.founders.length) return;
      const a = d.founders[index];
      const b = d.founders[target];
      if (!a || !b) return;
      d.founders[index] = b;
      d.founders[target] = a;
    });
  }

  async function handleSave() {
    if (!form) return;
    const found = collectErrors(form);
    setErrors(found);
    const keys = Object.keys(found);
    if (keys.length) {
      const firstTab =
        Object.entries(TAB_PREFIX).find(([, prefixes]) =>
          prefixes.some((p) => (keys[0] ?? "").startsWith(p)),
        )?.[0] ?? tab;
      setTab(firstTab);
      toast.error(`${keys.length} field${keys.length > 1 ? "s need" : " needs"} attention`);
      return;
    }
    setSaving(true);
    const toastId = toast.loading("Saving About page…");
    try {
      const result = await saveAbout({ data: form });
      if ("error" in result && result.error) throw new Error(result.error);
      clearPersistedPublicCache("version" in result ? result.version : undefined);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "about"] }),
        queryClient.invalidateQueries({ queryKey: ["about-page"] }),
      ]);
      const fresh = await queryClient.fetchQuery({
        queryKey: ["admin", "about"],
        queryFn: () => fetchAbout(),
      });
      setForm(structuredClone(fresh.content));
      toast.success("About page published", { id: toastId, description: "Visitors see the update right away." });
    } catch (e) {
      toast.error("Could not save", {
        id: toastId,
        description: e instanceof Error ? e.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  const err = (key: string) => errors[key];
  const tabHasError = (name: string) =>
    Object.keys(errors).some((k) => (TAB_PREFIX[name] ?? []).some((p) => k.startsWith(p)));

  const tabs: { value: string; label: string }[] = [
    { value: "hero", label: "Hero" },
    { value: "intro", label: "Intro" },
    { value: "founders", label: `Founders (${form.founders.length})` },
    { value: "convergence", label: "Comparing Notes" },
    { value: "mission", label: "Mission" },
    { value: "seo", label: "SEO" },
  ];

  return (
    <>
      <AdminPageHeader
        title="About page"
        description="Edit every section of the public About page. Changes go live for all visitors as soon as you publish."
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <a href="/about" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" /> View page
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!dirty || saving}
              onClick={() => {
                setForm(structuredClone(data!.content));
                setErrors({});
              }}
            >
              <RotateCcw className="size-4" /> Discard
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !dirty}>
              <Save className="size-4" /> {saving ? "Publishing…" : "Publish"}
            </Button>
          </div>
        }
      />

      {dirty ? (
        <p className="mb-4 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground">
          You have unpublished changes.
        </p>
      ) : null}

      <Tabs value={tab} onValueChange={setTab}>
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="w-max">
            {tabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
                {t.label}
                {tabHasError(t.value) ? <span className="size-1.5 rounded-full bg-destructive" /> : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle>Hero</CardTitle>
              <CardDescription>The banner at the very top of the About page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Small label" htmlFor="hero-eyebrow" error={err("hero.eyebrow")}>
                <Input id="hero-eyebrow" value={form.hero.eyebrow} onChange={(e) => update((d) => void (d.hero.eyebrow = e.target.value))} />
              </Field>
              <Field label="Headline" htmlFor="hero-title" error={err("hero.title")}>
                <Input id="hero-title" value={form.hero.title} onChange={(e) => update((d) => void (d.hero.title = e.target.value))} />
              </Field>
              <Field label="Description" htmlFor="hero-desc" error={err("hero.description")}>
                <Textarea id="hero-desc" rows={3} value={form.hero.description} onChange={(e) => update((d) => void (d.hero.description = e.target.value))} />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intro">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle>Intro</CardTitle>
                <CardDescription>The opening paragraphs below the hero.</CardDescription>
              </div>
              <VisibleToggle checked={form.intro.visible} onChange={(v) => update((d) => void (d.intro.visible = v))} />
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Large opening text" htmlFor="intro-lead" error={err("intro.lead")}>
                <Textarea id="intro-lead" rows={5} value={form.intro.lead} onChange={(e) => update((d) => void (d.intro.lead = e.target.value))} />
              </Field>
              <Field label="Smaller follow-up text" htmlFor="intro-sub" error={err("intro.sub")}>
                <Textarea id="intro-sub" rows={3} value={form.intro.sub} onChange={(e) => update((d) => void (d.intro.sub = e.target.value))} />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="founders" className="space-y-4">
          {form.founders.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No founders yet. Add the first one below.
              </CardContent>
            </Card>
          ) : null}
          {form.founders.map((f, i) => (
            <Card key={f.id}>
              <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
                <CardTitle className="text-base">
                  {i + 1}. {f.name || "New founder"}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <VisibleToggle checked={f.visible} onChange={(v) => updateFounder(i, { visible: v })} />
                  <Button variant="ghost" size="icon" aria-label="Move up" disabled={i === 0} onClick={() => moveFounder(i, -1)}>
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Move down" disabled={i === form.founders.length - 1} onClick={() => moveFounder(i, 1)}>
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Remove founder" className="text-destructive hover:text-destructive" onClick={async () => {
                      const ok = await confirm({
                        title: "Remove this founder?",
                        description: "Their section disappears from the About page after you publish.",
                        confirmLabel: "Remove",
                        tone: "destructive",
                      });
                      if (ok) update((d) => void d.founders.splice(i, 1));
                    }}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-[200px_1fr]">
                <Field label="Photo (optional)">
                  <ImageInput value={f.image_url} folder="about" preset="icon" onChange={(v) => updateFounder(i, { image_url: v })} />
                </Field>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Name" htmlFor={`f-name-${i}`} error={err(`founders.${i}.name`)}>
                      <Input id={`f-name-${i}`} value={f.name} onChange={(e) => updateFounder(i, { name: e.target.value })} />
                    </Field>
                    <Field label="Role" htmlFor={`f-role-${i}`} error={err(`founders.${i}.role`)}>
                      <Input id={`f-role-${i}`} value={f.role} onChange={(e) => updateFounder(i, { role: e.target.value })} />
                    </Field>
                    <Field label="Location" htmlFor={`f-loc-${i}`} error={err(`founders.${i}.location`)}>
                      <Input id={`f-loc-${i}`} value={f.location} onChange={(e) => updateFounder(i, { location: e.target.value })} />
                    </Field>
                  </div>
                  <Field label="Story" hint="Bold, italic, lists and links only — the page design stays consistent." error={err(`founders.${i}.story`)}>
                    <RichTextEditor value={f.story} onChange={(v) => updateFounder(i, { story: v })} />
                  </Field>
                  <Field label="Highlighted quote" htmlFor={`f-quote-${i}`} hint="Shown with an accent line beside it." error={err(`founders.${i}.quote`)}>
                    <Textarea id={`f-quote-${i}`} rows={2} value={f.quote} onChange={(e) => updateFounder(i, { quote: e.target.value })} />
                  </Field>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button
            variant="outline"
            disabled={form.founders.length >= 12}
            onClick={() => update((d) => void d.founders.push(newFounder()))}
          >
            <Plus className="size-4" /> Add founder
          </Button>
        </TabsContent>

        <TabsContent value="convergence">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle>Comparing Notes</CardTitle>
                <CardDescription>The dark band after the founder stories.</CardDescription>
              </div>
              <VisibleToggle checked={form.convergence.visible} onChange={(v) => update((d) => void (d.convergence.visible = v))} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Small label" htmlFor="cv-eyebrow" error={err("convergence.eyebrow")}>
                  <Input id="cv-eyebrow" value={form.convergence.eyebrow} onChange={(e) => update((d) => void (d.convergence.eyebrow = e.target.value))} />
                </Field>
                <Field label="Heading" htmlFor="cv-title" error={err("convergence.title")}>
                  <Input id="cv-title" value={form.convergence.title} onChange={(e) => update((d) => void (d.convergence.title = e.target.value))} />
                </Field>
              </div>
              <Field label="Text" error={err("convergence.body")}>
                <RichTextEditor value={form.convergence.body} onChange={(v) => update((d) => void (d.convergence.body = v))} />
              </Field>
              <Field label="Highlighted line" htmlFor="cv-hl" error={err("convergence.highlight")}>
                <Textarea id="cv-hl" rows={2} value={form.convergence.highlight} onChange={(e) => update((d) => void (d.convergence.highlight = e.target.value))} />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mission">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle>Mission & buttons</CardTitle>
                <CardDescription>The closing statement and the two buttons at the bottom.</CardDescription>
              </div>
              <VisibleToggle checked={form.mission.visible} onChange={(v) => update((d) => void (d.mission.visible = v))} />
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Main statement" htmlFor="m-st" error={err("mission.statement")}>
                <Input id="m-st" value={form.mission.statement} onChange={(e) => update((d) => void (d.mission.statement = e.target.value))} />
              </Field>
              <Field label="Supporting text" htmlFor="m-body" error={err("mission.body")}>
                <Textarea id="m-body" rows={3} value={form.mission.body} onChange={(e) => update((d) => void (d.mission.body = e.target.value))} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Main button text" htmlFor="m-pl" error={err("mission.primary_label")}>
                  <Input id="m-pl" value={form.mission.primary_label} onChange={(e) => update((d) => void (d.mission.primary_label = e.target.value))} />
                </Field>
                <Field label="Main button link" htmlFor="m-pu" hint="e.g. /donate or https://…" error={err("mission.primary_url")}>
                  <Input id="m-pu" value={form.mission.primary_url} onChange={(e) => update((d) => void (d.mission.primary_url = e.target.value))} />
                </Field>
                <Field label="Second button text" htmlFor="m-sl" error={err("mission.secondary_label")}>
                  <Input id="m-sl" value={form.mission.secondary_label} onChange={(e) => update((d) => void (d.mission.secondary_label = e.target.value))} />
                </Field>
                <Field label="Second button link" htmlFor="m-su" hint="Leave text empty to hide this button." error={err("mission.secondary_url")}>
                  <Input id="m-su" value={form.mission.secondary_url} onChange={(e) => update((d) => void (d.mission.secondary_url = e.target.value))} />
                </Field>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>Search & sharing</CardTitle>
              <CardDescription>What Google and social media previews show for the About page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label={`Page title (${form.seo_title.length}/70)`} htmlFor="seo-t" error={err("seo_title")}>
                <Input id="seo-t" value={form.seo_title} onChange={(e) => update((d) => void (d.seo_title = e.target.value))} />
              </Field>
              <Field label={`Description (${form.seo_description.length}/200)`} htmlFor="seo-d" error={err("seo_description")}>
                <Textarea id="seo-d" rows={3} value={form.seo_description} onChange={(e) => update((d) => void (d.seo_description = e.target.value))} />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </>
  );
}
