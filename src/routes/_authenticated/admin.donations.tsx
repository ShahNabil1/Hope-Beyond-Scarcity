import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, Mail, Receipt } from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  adminDownloadReceipt,
  adminListDonations,
  adminResendReceipt,
  adminUpdateDonationStatus,
} from "@/lib/admin-finance.functions";

export const Route = createFileRoute("/_authenticated/admin/donations")({
  component: AdminDonations,
});

const STATUSES = ["pending", "paid", "failed", "refunded", "canceled"] as const;

function money(cents: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

function statusTone(status: string) {
  if (status === "paid") return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  if (status === "refunded") return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
  if (status === "failed" || status === "canceled") return "bg-destructive/10 text-destructive";
  return "bg-muted text-muted-foreground";
}

function downloadPdf(fileName: string, base64: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function AdminDonations() {
  const listDonations = useServerFn(adminListDonations);
  const getReceipt = useServerFn(adminDownloadReceipt);
  const resendReceipt = useServerFn(adminResendReceipt);
  const updateStatus = useServerFn(adminUpdateDonationStatus);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | (typeof STATUSES)[number]>("all");
  const [type, setType] = useState<"all" | "one_time" | "monthly">("all");
  const [busy, setBusy] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "donations", search, status, type],
    queryFn: () => listDonations({ data: { search, status, type, limit: 200 } }),
  });

  async function handleReceipt(id: string) {
    setBusy(id);
    const result = await getReceipt({ data: { donationId: id } });
    setBusy(null);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    downloadPdf(result.fileName, result.pdfBase64);
  }

  async function handleResend(id: string) {
    setBusy(id);
    const result = await resendReceipt({ data: { donationId: id } });
    setBusy(null);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(`Receipt emailed to ${result.sentTo}`);
    queryClient.invalidateQueries({ queryKey: ["admin", "donations"] });
  }

  async function handleStatus(id: string, next: (typeof STATUSES)[number]) {
    const result = await updateStatus({ data: { donationId: id, status: next } });
    if (result && "error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Donation updated");
    queryClient.invalidateQueries({ queryKey: ["admin", "donations"] });
  }

  const totals = data?.totals;
  const isAdmin = data?.isAdmin ?? false;

  return (
    <>
      <AdminPageHeader
        title="Donations"
        description="Every one-time and recurring gift, with receipts and invoice references."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Received (filtered)", value: totals ? money(totals.paidCents) : "—" },
          { label: "This month", value: totals ? money(totals.monthCents) : "—" },
          { label: "Completed gifts", value: totals ? String(totals.paidCount) : "—" },
          { label: "Average gift", value: totals ? money(totals.avgCents) : "—" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search donor, email, or payment reference"
          className="sm:max-w-sm"
        />
        <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={(value) => setType(value as typeof type)}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="one_time">One-time</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : (data?.donations.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            No donations match these filters yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data?.donations.map((donation) => (
            <Card key={donation.id}>
              <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold">{money(donation.amount_cents)}</span>
                    <Badge variant="secondary" className={statusTone(donation.status)}>
                      {donation.status}
                    </Badge>
                    <Badge variant="outline">
                      {donation.donation_type === "monthly" ? "Monthly" : "One-time"}
                    </Badge>
                    {donation.environment !== "live" ? (
                      <Badge variant="outline" className="text-muted-foreground">
                        test
                      </Badge>
                    ) : null}
                    {donation.receipt_sent_at ? (
                      <Badge variant="outline" className="gap-1">
                        <Receipt className="size-3" /> receipt sent
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-sm font-medium">
                    {donation.donor_name ?? "Guest donor"}
                    {donation.email ? (
                      <span className="text-muted-foreground"> · {donation.email}</span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {new Date(donation.created_at).toLocaleString("en-CA", {
                      timeZone: "America/Toronto",
                    })}
                    {donation.stripe_payment_intent_id
                      ? ` · ${donation.stripe_payment_intent_id}`
                      : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isAdmin ? (
                    <Select
                      value={donation.status}
                      onValueChange={(value) =>
                        handleStatus(donation.id, value as (typeof STATUSES)[number])
                      }
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
                  ) : null}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={busy === donation.id}
                    onClick={() => handleReceipt(donation.id)}
                  >
                    <Download className="size-4" /> PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={busy === donation.id || donation.status !== "paid"}
                    onClick={() => handleResend(donation.id)}
                  >
                    <Mail className="size-4" /> Email receipt
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
