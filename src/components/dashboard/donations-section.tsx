import { useEffect, useState } from "react";
import { Download, Loader2, Receipt } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCad } from "@/lib/donation";
import { downloadReceipt } from "@/lib/portal.functions";
import { supabase } from "@/lib/supabase";

type DonationRow = {
  id: string;
  amount_cents: number;
  donation_type: string;
  status: string;
  created_at: string;
  environment: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "paid") return "default";
  if (status === "pending") return "secondary";
  if (status === "failed") return "destructive";
  return "outline";
}

export function DonationsSection({ userId }: { userId: string }) {
  const [rows, setRows] = useState<DonationRow[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase
      .from("donations")
      .select("id, amount_cents, donation_type, status, created_at, environment")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (active) setRows(data ?? []);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const totalPaid = (rows ?? [])
    .filter((row) => row.status === "paid")
    .reduce((sum, row) => sum + row.amount_cents, 0);

  async function onDownload(id: string) {
    setBusyId(id);
    try {
      const result = await downloadReceipt({ data: { donationId: id } });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      const binary = atob(result.pdfBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = result.fileName;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Receipt downloaded.");
    } catch {
      toast.error("We could not generate that receipt. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Donation history</CardTitle>
        <CardDescription>
          Every gift on this account, with official PDF receipts.
          {rows?.length ? ` Lifetime giving: ${formatCad(totalPaid)} CAD.` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows === null ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <Receipt className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">
              No donations yet. Your receipts will appear here after your first gift.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(row.created_at)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCad(row.amount_cents)}
                      {row.environment === "sandbox" ? (
                        <span className="ml-2 text-xs text-muted-foreground">test</span>
                      ) : null}
                    </TableCell>
                    <TableCell>{row.donation_type === "monthly" ? "Monthly" : "One-time"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(row.status)} className="capitalize">
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={row.status !== "paid" || busyId === row.id}
                        onClick={() => onDownload(row.id)}
                      >
                        {busyId === row.id ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Download className="size-4" aria-hidden="true" />
                        )}
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
