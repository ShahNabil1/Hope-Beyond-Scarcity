import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminListPitches, adminUpdatePitch } from "@/lib/admin-people.functions";

export const Route = createFileRoute("/_authenticated/admin/pitches")({
  component: AdminPitches,
});

const STATUSES = ["new", "reviewing", "approved", "declined", "archived"] as const;
type Status = (typeof STATUSES)[number];

function money(cents: number | null) {
  if (!cents) return "No estimate";
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

function AdminPitches() {
  const listPitches = useServerFn(adminListPitches);
  const updatePitch = useServerFn(adminUpdatePitch);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "pitches"],
    queryFn: () => listPitches(),
  });

  async function patch(id: string, values: { status?: Status; admin_notes?: string }) {
    const result = await updatePitch({ data: { id, ...values } });
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Pitch updated");
    queryClient.invalidateQueries({ queryKey: ["admin", "pitches"] });
  }

  const term = search.trim().toLowerCase();
  const rows = (data ?? []).filter(
    (p) =>
      !term ||
      p.title.toLowerCase().includes(term) ||
      (p.description ?? "").toLowerCase().includes(term),
  );

  return (
    <>
      <AdminPageHeader
        title="Care package pitches"
        description="Community-submitted ideas for care packages and local projects."
        action={
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search pitches"
            className="w-full sm:w-64"
          />
        }
      />

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No pitches submitted yet.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {rows.map((p) => (
            <Card key={p.id}>
              <CardContent className="space-y-4 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{p.title}</p>
                      <Badge variant={p.status === "new" ? "default" : "secondary"}>{p.status}</Badge>
                      <Badge variant="outline">{money(p.estimated_cost_cents)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Submitted {new Date(p.created_at).toLocaleDateString("en-CA")}
                    </p>
                  </div>
                  <Select
                    value={p.status}
                    onValueChange={(value) => patch(p.id, { status: value as Status })}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {p.description ? (
                  <p className="whitespace-pre-line rounded-lg bg-muted/50 p-3 text-sm text-foreground">
                    {p.description}
                  </p>
                ) : null}

                <div className="space-y-2">
                  <Textarea
                    value={notes[p.id] ?? p.admin_notes ?? ""}
                    onChange={(event) => setNotes((prev) => ({ ...prev, [p.id]: event.target.value }))}
                    placeholder="Internal notes"
                    rows={2}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => patch(p.id, { admin_notes: notes[p.id] ?? p.admin_notes ?? "" })}
                  >
                    Save notes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
