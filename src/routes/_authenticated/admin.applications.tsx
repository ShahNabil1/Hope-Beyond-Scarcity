import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trash2 } from "lucide-react";
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
import {
  adminDeleteApplication,
  adminListApplications,
  adminUpdateApplication,
} from "@/lib/admin-people.functions";

export const Route = createFileRoute("/_authenticated/admin/applications")({
  component: AdminApplications,
});

const STATUSES = ["new", "reviewing", "approved", "declined", "archived"] as const;
type Status = (typeof STATUSES)[number];

function AdminApplications() {
  const listApplications = useServerFn(adminListApplications);
  const updateApplication = useServerFn(adminUpdateApplication);
  const deleteApplication = useServerFn(adminDeleteApplication);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "applications"],
    queryFn: () => listApplications(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "applications"] });

  async function patch(id: string, values: { status?: Status; admin_notes?: string }) {
    const result = await updateApplication({ data: { id, ...values } });
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Application updated");
    refresh();
  }

  async function remove(id: string) {
    const result = await deleteApplication({ data: { id } });
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Application deleted");
    refresh();
  }

  const term = search.trim().toLowerCase();
  const rows = (data ?? []).filter(
    (a) =>
      !term ||
      (a.full_name ?? "").toLowerCase().includes(term) ||
      (a.email ?? "").toLowerCase().includes(term) ||
      a.interest_area.toLowerCase().includes(term) ||
      (a.message ?? "").toLowerCase().includes(term),
  );

  return (
    <>
      <AdminPageHeader
        title="Volunteer applications"
        description="Review, triage, and respond to people offering their time."
        action={
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search applications"
            className="w-full sm:w-64"
          />
        }
      />

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No applications yet.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {rows.map((a) => (
            <Card key={a.id}>
              <CardContent className="space-y-4 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {a.full_name || "Supporter"}
                      </p>
                      <Badge variant={a.status === "new" ? "default" : "secondary"}>{a.status}</Badge>
                      <Badge variant="outline">{a.interest_area}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {a.email}
                      {a.availability ? ` · ${a.availability}` : ""} ·{" "}
                      {new Date(a.created_at).toLocaleDateString("en-CA")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={a.status}
                      onValueChange={(value) => patch(a.id, { status: value as Status })}
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
                    <Button variant="ghost" size="icon" onClick={() => remove(a.id)} aria-label="Delete">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                {a.message ? (
                  <p className="whitespace-pre-line rounded-lg bg-muted/50 p-3 text-sm text-foreground">
                    {a.message}
                  </p>
                ) : null}

                <div className="space-y-2">
                  <Textarea
                    value={notes[a.id] ?? a.admin_notes ?? ""}
                    onChange={(event) => setNotes((prev) => ({ ...prev, [a.id]: event.target.value }))}
                    placeholder="Internal notes"
                    rows={2}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => patch(a.id, { admin_notes: notes[a.id] ?? a.admin_notes ?? "" })}
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
