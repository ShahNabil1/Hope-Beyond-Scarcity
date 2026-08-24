import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Ban, CheckCircle2, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  adminDeleteMember,
  adminGetMemberDetail,
  adminSetMemberBan,
} from "@/lib/admin-people.functions";

function money(cents: number | null | undefined, currency = "CAD") {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency }).format((cents ?? 0) / 100);
}

function when(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-muted/40 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

export function MemberDetailDialog({
  userId,
  onOpenChange,
  onChanged,
}: {
  userId: string | null;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}) {
  const getDetail = useServerFn(adminGetMemberDetail);
  const setBan = useServerFn(adminSetMemberBan);
  const deleteMember = useServerFn(adminDeleteMember);
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "member", userId],
    queryFn: () => getDetail({ data: { user_id: userId! } }),
    enabled: Boolean(userId),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "member", userId] });
    queryClient.invalidateQueries({ queryKey: ["admin", "members"] });
    onChanged?.();
  };

  async function toggleBan(ban: boolean) {
    if (!userId) return;
    const ok = await confirm({
      title: ban ? "Ban this member?" : "Restore access?",
      description: ban
        ? "They will be signed out and blocked from signing in until you unban them. Their data stays intact."
        : "They will be able to sign in again immediately.",
      confirmLabel: ban ? "Ban member" : "Unban member",
      tone: ban ? "destructive" : "default",
      detail: data?.auth.email ?? undefined,
    });
    if (!ok) return;
    const result = await setBan({ data: { user_id: userId, ban } });
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(ban ? "Member banned" : "Member unbanned");
    refresh();
  }

  async function removeMember() {
    if (!userId) return;
    const ok = await confirm({
      title: "Permanently delete this account?",
      description:
        "Profile, roles, volunteer records, comments and login are erased. Donation records are anonymised but kept for accounting. This cannot be undone.",
      confirmLabel: "Delete account",
      detail: data?.auth.email ?? undefined,
    });
    if (!ok) return;
    const result = await deleteMember({ data: { user_id: userId } });
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Account deleted");
    onOpenChange(false);
    refresh();
  }

  const totalGiven = (data?.donations ?? [])
    .filter((d) => ["paid", "succeeded", "complete"].includes(d.status ?? ""))
    .reduce((sum, d) => sum + (d.amount_cents ?? 0), 0);

  return (
    <Dialog open={Boolean(userId)} onOpenChange={onOpenChange}>
      <DialogContent className="dialog-content-anim max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {data?.profile?.full_name || "Member details"}
            {data?.auth.banned ? <Badge variant="destructive">Banned</Badge> : null}
            {(data?.roles ?? []).map((role) => (
              <Badge key={role} variant={role === "donor" ? "secondary" : "default"}>
                {role}
              </Badge>
            ))}
          </DialogTitle>
          <DialogDescription>{data?.auth.email ?? data?.profile?.email ?? ""}</DialogDescription>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Lifetime giving" value={money(totalGiven)} />
              <Stat label="Gifts" value={String(data.donations.length)} />
              <Stat label="Joined" value={when(data.auth.created_at).split(",")[0] ?? "—"} />
              <Stat label="Last sign-in" value={when(data.auth.last_sign_in_at)} />
            </div>

            <Section title="Account">
              <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd className="text-foreground">{data.profile?.phone || "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Location</dt>
                  <dd className="text-foreground">{data.profile?.location || "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Sign-in method</dt>
                  <dd className="text-foreground">{data.auth.provider ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Email verified</dt>
                  <dd className="text-foreground">
                    {data.auth.email_confirmed_at ? "Yes" : "No"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Policies accepted</dt>
                  <dd className="text-foreground">{when(data.profile?.policies_accepted_at)}</dd>
                </div>
              </dl>
            </Section>

            <Separator />

            <Section title={`Payments (${data.donations.length})`}>
              {data.donations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments recorded.</p>
              ) : (
                <div className="divide-y divide-border/70 rounded-xl border border-border/70">
                  {data.donations.map((d) => (
                    <div
                      key={d.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">
                          {money(d.amount_cents, d.currency?.toUpperCase() || "CAD")}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            · {d.donation_type} · {d.status}
                            {d.environment === "test" ? " · test" : ""}
                          </span>
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {when(d.created_at)}
                          {d.stripe_payment_intent_id ? ` · ${d.stripe_payment_intent_id}` : ""}
                        </p>
                      </div>
                      <Badge variant={d.receipt_sent_at ? "secondary" : "outline"}>
                        {d.receipt_sent_at ? "Receipt sent" : "No receipt"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title={`Recurring gifts (${data.subscriptions.length})`}>
              {data.subscriptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recurring gifts.</p>
              ) : (
                <div className="divide-y divide-border/70 rounded-xl border border-border/70">
                  {data.subscriptions.map((s) => (
                    <div key={s.id} className="px-3 py-2 text-sm">
                      <p className="font-medium text-foreground">
                        {money(s.amount_cents, s.currency?.toUpperCase() || "CAD")} / month
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {s.status}
                          {s.cancel_at_period_end ? " · cancels at period end" : ""}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Next charge {when(s.current_period_end)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title={`Volunteer applications (${data.applications.length})`}>
              {data.applications.length === 0 ? (
                <p className="text-sm text-muted-foreground">None submitted.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {data.applications.map((a) => (
                    <li key={a.id} className="rounded-lg border border-border/70 px-3 py-2">
                      <span className="font-medium text-foreground">{a.interest_area}</span>{" "}
                      <span className="text-xs text-muted-foreground">
                        · {a.status} · {when(a.created_at)}
                      </span>
                      {a.message ? (
                        <p className="mt-1 text-xs text-muted-foreground">{a.message}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title={`Care package pitches (${data.pitches.length})`}>
              {data.pitches.length === 0 ? (
                <p className="text-sm text-muted-foreground">None submitted.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {data.pitches.map((p) => (
                    <li key={p.id} className="rounded-lg border border-border/70 px-3 py-2">
                      <span className="font-medium text-foreground">{p.title}</span>{" "}
                      <span className="text-xs text-muted-foreground">
                        · {p.status} · {when(p.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title={`Comments (${data.comments.length})`}>
              {data.comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments posted.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {data.comments.map((c) => (
                    <li key={c.id} className="rounded-lg border border-border/70 px-3 py-2">
                      <p className="text-foreground">{c.body}</p>
                      <p className="text-xs text-muted-foreground">
                        {when(c.created_at)}
                        {c.is_hidden ? " · hidden" : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Separator />

            {data.isAdmin ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={data.auth.banned ? "outline" : "secondary"}
                  onClick={() => toggleBan(!data.auth.banned)}
                >
                  {data.auth.banned ? (
                    <>
                      <CheckCircle2 className="mr-2 size-4" /> Unban member
                    </>
                  ) : (
                    <>
                      <Ban className="mr-2 size-4" /> Ban member
                    </>
                  )}
                </Button>
                <Button variant="destructive" onClick={removeMember}>
                  <Trash2 className="mr-2 size-4" /> Delete account
                </Button>
              </div>
            ) : (
              <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5" /> Ban and deletion require an admin
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function MemberDetailLoading() {
  return <Loader2 className="size-4 animate-spin" />;
}
