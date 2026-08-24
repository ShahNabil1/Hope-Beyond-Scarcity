import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { FieldControl, initialValues } from "@/components/admin/content-editor";
import { mediaUrl } from "@/components/admin/media-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrandSkeleton } from "@/components/ui/brand-loader";
import { Card, CardContent } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { CONTENT_CONFIG, type ContentTable } from "@/lib/admin-content";
import {
  adminDeleteContent,
  adminListContent,
  adminSaveContent,
  adminToggleContent,
} from "@/lib/admin-content.functions";
import { resolveIcon } from "@/lib/icon-map";
import { clearPersistedPublicCache } from "@/lib/query-persist";
import { withRetry } from "@/lib/retry";

type Row = Record<string, any>;

/** Compact CRUD list used inside the Site settings tabs. */
export function MiniContentList({ table }: { table: ContentTable }) {
  const config = CONTENT_CONFIG[table];
  const listContent = useServerFn(adminListContent);
  const saveContent = useServerFn(adminSaveContent);
  const deleteContent = useServerFn(adminDeleteContent);
  const toggleContent = useServerFn(adminToggleContent);
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const [editing, setEditing] = useState<{ row?: Row; values: Record<string, unknown> } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "content", table],
    queryFn: () => listContent({ data: { table } }),
  });

  const rows = data ?? [];

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin", "content", table] });
    queryClient.invalidateQueries({ queryKey: ["home-content"] });
    clearPersistedPublicCache();
  }

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
      payload[field.name] =
        field.kind === "number"
          ? value === ""
            ? 0
            : Number(value)
          : field.kind === "boolean"
            ? Boolean(value)
            : value === null || value === undefined
              ? ""
              : value;
    }

    setSaving(true);
    const toastId = toast.loading(`Saving ${config.singular.toLowerCase()}…`);
    try {
      const result = await withRetry(
        () =>
          saveContent({
            data: { table, id: editing.row?.["id"] ?? null, values: payload as any },
          }),
        {
          retries: 2,
          onRetry: (attempt) =>
            toast.loading(`Connection hiccup — retrying (${attempt}/2)…`, { id: toastId }),
        },
      );
      if ("error" in result) {
        toast.error("Could not save", { id: toastId, description: result.error });
        return;
      }
      toast.success(`${config.singular} saved — live on the site now`, { id: toastId });
      setEditing(null);
      refresh();
    } catch (error) {
      toast.error("Could not reach the server", {
        id: toastId,
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: Row) {
    const ok = await confirm({
      title: `Delete this ${config.singular.toLowerCase()}?`,
      description: "This removes it from the live site immediately and cannot be undone.",
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

  async function handleToggle(row: Row, value: boolean) {
    const result = await toggleContent({
      data: { table, id: row["id"], field: "is_active", value },
    });
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(value ? `${config.singular} is live` : `${config.singular} hidden`);
    refresh();
  }

  async function move(row: Row, direction: -1 | 1) {
    const index = rows.findIndex((r) => r["id"] === row["id"]);
    const swap = rows[index + direction];
    if (!swap) return;
    await Promise.all([
      saveContent({
        data: { table, id: row["id"], values: { sort_order: Number(swap["sort_order"] ?? 0) } },
      }),
      saveContent({
        data: { table, id: swap["id"], values: { sort_order: Number(row["sort_order"] ?? 0) } },
      }),
    ]);
    refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {rows.length} {rows.length === 1 ? config.singular.toLowerCase() : config.plural.toLowerCase()}
        </p>
        <Button size="sm" onClick={() => setEditing({ values: initialValues(config) })}>
          <Plus className="size-4" /> Add {config.singular.toLowerCase()}
        </Button>
      </div>

      {isLoading ? (
        <BrandSkeleton rows={3} label={`Loading ${config.plural.toLowerCase()}…`} />
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing here yet — add the first one.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, index) => {
            const Icon = table === "impact_stats" ? resolveIcon(row["icon"]) : null;
            const logo = table === "partners" ? String(row["logo_url"] ?? "") : "";
            return (
              <Card key={row["id"]}>
                <CardContent className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {Icon ? (
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                    ) : logo ? (
                      <img
                        src={mediaUrl(logo)}
                        alt=""
                        className="size-10 shrink-0 rounded-lg object-contain"
                        loading="lazy"
                      />
                    ) : null}
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        {table === "impact_stats" ? (
                          <>
                            <span className="tabular-nums">{row["display"]}</span>{" "}
                            <span className="font-medium">{row["label"]}</span>
                          </>
                        ) : (
                          row[config.titleField]
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {row[config.subtitleField] || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
                    <Badge variant={row["is_active"] ? "default" : "outline"}>
                      {row["is_active"] ? "Live" : "Hidden"}
                    </Badge>
                    <Switch
                      checked={Boolean(row["is_active"])}
                      onCheckedChange={(v) => handleToggle(row, v)}
                      aria-label="Show on the site"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Move up"
                      disabled={index === 0}
                      onClick={() => move(row, -1)}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Move down"
                      disabled={index === rows.length - 1}
                      onClick={() => move(row, 1)}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Edit"
                      onClick={() => setEditing({ row, values: initialValues(config, row) })}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Delete"
                      onClick={() => handleDelete(row)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing?.row
                ? `Edit ${config.singular.toLowerCase()}`
                : `New ${config.singular.toLowerCase()}`}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            {editing
              ? config.fields.map((field) => (
                  <FieldControl
                    key={field.name}
                    field={field}
                    value={editing.values[field.name]}
                    folder={table}
                    onChange={(next) => setValue(field.name, next)}
                  />
                ))
              : null}
          </div>
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
    </div>
  );
}
