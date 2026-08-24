import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Ban, HeartHandshake, Repeat, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-shell";
import { MemberDetailDialog } from "@/components/admin/member-detail-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { adminListMembers, adminSetMemberRole } from "@/lib/admin-people.functions";


export const Route = createFileRoute("/_authenticated/admin/members")({
  component: AdminMembers,
});

const ROLES = ["admin", "editor", "donor"] as const;

function money(cents: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

function AdminMembers() {
  const listMembers = useServerFn(adminListMembers);
  const setRole = useServerFn(adminSetMemberRole);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "members"],
    queryFn: () => listMembers(),
  });

  async function toggleRole(userId: string, role: (typeof ROLES)[number], grant: boolean) {
    const result = await setRole({ data: { user_id: userId, role, grant } });
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(grant ? `Granted ${role}` : `Removed ${role}`);
    queryClient.invalidateQueries({ queryKey: ["admin", "members"] });
  }

  const term = search.trim().toLowerCase();
  const members = (data?.members ?? []).filter(
    (m) =>
      !term ||
      (m.full_name ?? "").toLowerCase().includes(term) ||
      (m.email ?? "").toLowerCase().includes(term) ||
      (m.location ?? "").toLowerCase().includes(term),
  );

  return (
    <>
      <AdminPageHeader
        title="Members"
        description="Everyone with an account — donors, volunteers, and staff."
        action={
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search members"
            className="w-full sm:w-64"
          />
        }
      />

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No members match this search.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {members.map((m) => (
            <Card key={m.id}>
              <CardContent className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {m.full_name || "Unnamed supporter"}
                    </p>
                    {m.roles.map((role) => (
                      <Badge key={role} variant={role === "donor" ? "secondary" : "default"}>
                        {role}
                      </Badge>
                    ))}
                    {m.recurring ? (
                      <Badge variant="outline" className="gap-1">
                        <Repeat className="size-3" /> Monthly
                      </Badge>
                    ) : null}
                    {m.volunteer ? (
                      <Badge variant="outline" className="gap-1">
                        <HeartHandshake className="size-3" /> Volunteer
                      </Badge>
                    ) : null}
                    {m.banned ? (
                      <Badge variant="destructive" className="gap-1">
                        <Ban className="size-3" /> Banned
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{m.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {m.gifts} gift{m.gifts === 1 ? "" : "s"} · {money(m.giving_cents)} lifetime
                    {m.location ? ` · ${m.location}` : ""}
                    {m.policies_accepted_at ? "" : " · policies not accepted"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setOpenMember(m.id)}>
                    View details
                  </Button>
                  {data?.isAdmin ? (
                    ROLES.map((role) => {
                      const has = m.roles.includes(role);
                      return (
                        <Button
                          key={role}
                          size="sm"
                          variant={has ? "default" : "outline"}
                          onClick={() => toggleRole(m.id, role, !has)}
                        >
                          {has ? `Remove ${role}` : `Make ${role}`}
                        </Button>
                      );
                    })
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ShieldCheck className="size-3.5" /> Role changes require an admin
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <MemberDetailDialog
        userId={openMember}
        onOpenChange={(open) => setOpenMember(open ? openMember : null)}
      />
    </>
  );

}
