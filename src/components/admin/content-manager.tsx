import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { withRetry } from "@/lib/retry";

import { AdminPageHeader } from "@/components/admin/admin-shell";
import { IconPicker } from "@/components/admin/icon-picker";
import { GalleryInput, ImageInput, mediaUrl } from "@/components/admin/media-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandSkeleton } from "@/components/ui/brand-loader";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  CONTENT_CONFIG,
  slugify,
  toLocalValue,
  type ContentTable,
  type FieldDef,
} from "@/lib/admin-content";
import {
  adminDeleteContent,
  adminListContent,
  adminSaveContent,
  adminToggleContent,
} from "@/lib/admin-content.functions";

type Row = Record<string, any>;

function initialValues(config: (typeof CONTENT_CONFIG)[ContentTable], row?: Row) {
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

export function ContentManager({
  table,
  onNew,
  onEdit,
}: {
  table: ContentTable;
  onNew?: () => void;
  onEdit?: (row: Row) => void;
}) {
  const config = CONTENT_CONFIG[table];
  const listContent = useServerFn(adminListContent);
  const saveContent = useServerFn(adminSaveContent);
  const deleteContent = useServerFn(adminDeleteContent);
  const toggleContent = useServerFn(adminToggleContent);
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<{ row?: Row; values: Record<string, unknown> } | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "content", table],
    queryFn: () => listContent({ data: { table } }),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "content", table] });
    queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
  };

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? []).filter((row) =>
      !term
        ? true
        : String(row[config.titleField] ?? "")
            .toLowerCase()
            .includes(term) ||
          String(row[config.subtitleField] ?? "")
            .toLowerCase()
            .includes(term),
    );
  }, [data, search, config]);

  function setValue(name: string, value: unknown) {
    setEditing((prev) => (prev ? { ...prev, values: { ...prev.values, [name]: value } } : prev));
  }

  async function handleSave() {
    if (!editing) return;
    const payload: Record<string, unknown> = {};
    for (const field of config.fields) {
      const value = editing.values[field.name];
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
    const toastId = toast.loading(`Saving ${config.singular.toLowerCase()}…`);
    let result: Awaited<ReturnType<typeof saveContent>>;
    try {
      result = await withRetry(
        () => saveContent({ data: { table, id: editing.row?.["id"] ?? null, values: payload as any } }),
        {
          retries: 2,
          onRetry: (attempt) =>
            toast.loading(`Connection hiccup — retrying (${attempt}/2)…`, { id: toastId }),
        },
      );
    } catch (error) {
      setSaving(false);
      toast.error("Could not reach the server", {
        id: toastId,
        description: error instanceof Error ? error.message : "Please try again.",
      });
      return;
    }
    setSaving(false);
    if ("error" in result) {
      toast.error(`Could not save this ${config.singular.toLowerCase()}`, {
        id: toastId,
        description: result.error,
      });
      return;
    }
    toast.success(
      editing.values["is_active"]
        ? `${config.singular} published — live on the site now`
        : `${config.singular} saved as a draft`,
      { id: toastId },
    );
    setEditing(null);
    refresh();
  }

  async function handleDelete(row: Row) {
    const ok = await confirm({
      title: `Delete this ${config.singular.toLowerCase()}?`,
      description: "This permanently removes the item and its content from the live site. This action cannot be undone.",
      detail: String(row[config.titleField] ?? ""),
      confirmLabel: "Delete permanently",
      cancelLabel: "Keep it",
    });
    if (!ok) return;
    const result = await deleteContent({ data: { table, id: row["id"] } });
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(`${config.singular} deleted`);
    refresh();
  }

  async function handleToggle(row: Row, field: "is_active" | "is_featured", value: boolean) {
    const action =
      field === "is_active" ? (value ? "Publishing" : "Unpublishing") : value ? "Featuring" : "Unfeaturing";
    const toastId = toast.loading(`${action}…`);
    let result: Awaited<ReturnType<typeof toggleContent>>;
    try {
      result = await withRetry(
        () => toggleContent({ data: { table, id: row["id"], field, value } }),
        {
          retries: 2,
          onRetry: (attempt) =>
            toast.loading(`Connection hiccup — retrying (${attempt}/2)…`, { id: toastId }),
        },
      );
    } catch (error) {
      toast.error("Could not reach the server", {
        id: toastId,
        description: error instanceof Error ? error.message : "Please try again.",
      });
      return;
    }
    if ("error" in result) {
      toast.error("Update failed", { id: toastId, description: result.error });
      return;
    }
    toast.success(
      field === "is_active"
        ? value
          ? `${config.singular} is live`
          : `${config.singular} moved to draft`
        : value
          ? `${config.singular} featured`
          : `${config.singular} removed from featured`,
      { id: toastId },
    );
    refresh();
  }

  const hasFeatured = config.fields.some((f) => f.name === "is_featured");

  return (
    <>
      <AdminPageHeader
        title={config.plural}
        description={`Create, edit, publish and remove ${config.plural.toLowerCase()}.`}
        action={
          <div className="flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-44"
            />
            <Button onClick={() => (onNew ? onNew() : setEditing({ values: initialValues(config) }))}>
              <Plus className="size-4" /> New
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <BrandSkeleton rows={4} label={`Loading ${config.plural.toLowerCase()}…`} />
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing here yet — create the first one.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const cover = row["image_url"] ?? row["cover_image_url"] ?? "";
            return (
              <Card key={row["id"]}>
                <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 items-start gap-3 sm:flex-1 sm:items-center">
                    {cover ? (
                      <img
                        src={mediaUrl(String(cover))}
                        alt=""
                        className="size-14 shrink-0 rounded-lg object-cover sm:size-16"
                        loading="lazy"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-semibold text-foreground">
                        {row[config.titleField]}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {row["is_featured"] ? (
                          <Badge variant="secondary" className="gap-1">
                            <Star className="size-3" /> Featured
                          </Badge>
                        ) : null}
                        <Badge variant={row["is_active"] ? "default" : "outline"}>
                          {row["is_active"] ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                        {row[config.subtitleField]}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3 sm:justify-end sm:border-0 sm:pt-0">
                    <div className="flex items-center gap-3">
                      {hasFeatured ? (
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          Featured
                          <Switch
                            checked={Boolean(row["is_featured"])}
                            onCheckedChange={(v) => handleToggle(row, "is_featured", v)}
                          />
                        </label>
                      ) : null}
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        Live
                        <Switch
                          checked={Boolean(row["is_active"])}
                          onCheckedChange={(v) => handleToggle(row, "is_active", v)}
                        />
                      </label>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          onEdit ? onEdit(row) : setEditing({ row, values: initialValues(config, row) })
                        }
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(row)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing?.row ? `Edit ${config.singular.toLowerCase()}` : `New ${config.singular.toLowerCase()}`}
            </DialogTitle>
            <DialogDescription>
              Changes go live on the public site as soon as you save a published item.
            </DialogDescription>
          </DialogHeader>

          {editing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {config.fields.map((field) => (
                <FieldControl
                  key={field.name}
                  field={field}
                  value={editing.values[field.name]}
                  folder={String(editing.values["slug"] || table)}
                  onChange={(next) => setValue(field.name, next)}
                  onTitleBlur={
                    field.name === config.titleField && !editing.row
                      ? (title) => {
                          if (!editing.values["slug"]) setValue("slug", slugify(title));
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FieldControl({
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
          <Switch
            id={field.name}
            checked={Boolean(value)}
            onCheckedChange={(v) => onChange(v)}
          />
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
          rows={10}
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
      ) : field.kind === "icon" ? (
        <IconPicker value={String(value ?? "")} onChange={(next) => onChange(next)} />
      ) : field.kind === "image" ? (
        <ImageInput
          value={String(value ?? "")}
          folder={folder}
          onChange={(next) => onChange(next)}
        />
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
