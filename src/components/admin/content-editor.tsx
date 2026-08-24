import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

import { GalleryInput, ImageInput } from "@/components/admin/media-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  CONTENT_CONFIG,
  slugify,
  toLocalValue,
  type ContentTable,
  type FieldDef,
} from "@/lib/admin-content";
import { adminListContent, adminSaveContent } from "@/lib/admin-content.functions";

type Row = Record<string, any>;

export function initialValues(config: (typeof CONTENT_CONFIG)[ContentTable], row?: Row) {
  const values: Record<string, unknown> = {};
  for (const field of config.fields) {
    const raw = row ? row[field.name] : config.defaults[field.name];
    switch (field.kind) {
      case "boolean":
        values[field.name] = Boolean(raw ?? false);
        break;
      case "list":
      case "gallery":
        values[field.name] = Array.isArray(raw) ? raw : [];
        break;
      case "number":
        values[field.name] = raw === null || raw === undefined ? "" : String(raw);
        break;
      case "datetime":
        values[field.name] = toLocalValue(raw as string | null);
        break;
      default:
        values[field.name] = raw == null ? "" : String(raw);
    }
  }
  return values;
}

export function ContentEditorPage({
  table,
  id,
  backTo,
}: {
  table: ContentTable;
  id?: string;
  backTo: string;
}) {
  const config = CONTENT_CONFIG[table];
  const listContent = useServerFn(adminListContent);
  const saveContent = useServerFn(adminSaveContent);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "content", table],
    queryFn: () => listContent({ data: { table } }),
    enabled: Boolean(id),
  });

  const row = useMemo(
    () => (id ? (data ?? []).find((r: Row) => String(r["id"]) === id) : undefined),
    [data, id],
  );

  const [values, setValues] = useState<Record<string, unknown>>(() => initialValues(config));
  const [ready, setReady] = useState(!id);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id && row && !ready) {
      setValues(initialValues(config, row));
      setReady(true);
    }
  }, [id, row, ready, config]);

  function setValue(name: string, value: unknown) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function goBack() {
    navigate({ to: backTo as never });
  }

  async function handleSave() {
    const payload: Record<string, unknown> = {};
    for (const field of config.fields) {
      const value = values[field.name];
      if (field.required && (value === "" || value === null || value === undefined)) {
        toast.error(`${field.label} is required`);
        return;
      }
      switch (field.kind) {
        case "number":
          payload[field.name] = value === "" ? null : Number(value);
          break;
        case "datetime":
          payload[field.name] = value ? new Date(String(value)).toISOString() : null;
          break;
        case "boolean":
        case "list":
        case "gallery":
          payload[field.name] = value as never;
          break;
        default:
          payload[field.name] = value === "" ? null : value;
      }
    }

    setSaving(true);
    const result = await saveContent({
      data: { table, id: id ?? null, values: payload as any },
    });
    setSaving(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(`${config.singular} saved`);
    queryClient.invalidateQueries({ queryKey: ["admin", "content", table] });
    queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
    goBack();
  }

  const loading = Boolean(id) && (isLoading || !ready);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Button variant="ghost" size="sm" className="-ml-2 mb-1" onClick={goBack}>
            <ArrowLeft className="size-4" /> Back to {config.plural.toLowerCase()}
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {id ? `Edit ${config.singular.toLowerCase()}` : `New ${config.singular.toLowerCase()}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            Changes go live on the public site as soon as you save a published item.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={goBack}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            <Save className="size-4" /> {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="py-6">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {config.fields.map((field) => (
                <FieldControl
                  key={field.name}
                  field={field}
                  value={values[field.name]}
                  folder={String(values["slug"] || table)}
                  onChange={(next) => setValue(field.name, next)}
                  onTitleBlur={
                    field.name === config.titleField && !id
                      ? (title) => {
                          if (!values["slug"]) setValue("slug", slugify(title));
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={goBack}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving || loading}>
          <Save className="size-4" /> {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </motion.div>
  );
}

export function FieldControl({
  field,
  value,
  folder,
  onChange,
  onTitleBlur,
}: {
  field: FieldDef;
  value: unknown;
  folder: string;
  onChange: (next: unknown) => void;
  onTitleBlur?: ((title: string) => void) | undefined;
}) {
  const wrapperClass = field.full || field.kind === "gallery" ? "sm:col-span-2" : "";

  return (
    <div className={`space-y-2 ${wrapperClass}`}>
      <Label htmlFor={field.name}>
        {field.label}
        {field.required ? <span className="text-destructive"> *</span> : null}
      </Label>

      {field.kind === "boolean" ? (
        <div className="flex h-10 items-center">
          <Switch id={field.name} checked={Boolean(value)} onCheckedChange={(v) => onChange(v)} />
        </div>
      ) : field.kind === "textarea" ? (
        <Textarea
          id={field.name}
          rows={3}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : field.kind === "richtext" ? (
        <Textarea
          id={field.name}
          rows={16}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write the full text. Blank lines separate paragraphs."
        />
      ) : field.kind === "list" ? (
        <Textarea
          id={field.name}
          rows={4}
          value={(Array.isArray(value) ? value : []).join("\n")}
          onChange={(e) =>
            onChange(
              e.target.value
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean),
            )
          }
        />
      ) : field.kind === "image" ? (
        <ImageInput value={String(value ?? "")} folder={folder} onChange={(next) => onChange(next)} />
      ) : field.kind === "gallery" ? (
        <GalleryInput
          value={Array.isArray(value) ? (value as string[]) : []}
          folder={folder}
          onChange={(next) => onChange(next)}
        />
      ) : (
        <Input
          id={field.name}
          type={field.kind === "number" ? "number" : field.kind === "datetime" ? "datetime-local" : "text"}
          value={String(value ?? "")}
          placeholder={field.placeholder ?? ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => onTitleBlur?.(e.target.value)}
        />
      )}

      {field.help ? <p className="text-xs text-muted-foreground">{field.help}</p> : null}
    </div>
  );
}
