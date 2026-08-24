import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";

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
import { adminDeleteMessage, adminListMessages, adminUpdateMessage } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/messages")({
  component: AdminMessages,
});

const STATUSES = ["new", "read", "replied", "archived"] as const;

function AdminMessages() {
  const listMessages = useServerFn(adminListMessages);
  const updateMessage = useServerFn(adminUpdateMessage);
  const deleteMessage = useServerFn(adminDeleteMessage);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "messages"],
    queryFn: () => listMessages(),
  });

  const confirm = useConfirm();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "messages"] });

  async function patch(id: string, values: { status?: (typeof STATUSES)[number]; admin_notes?: string }) {
    const result = await updateMessage({ data: { id, ...values } });
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Message updated");
    refresh();
  }

  async function remove(id: string, subject: string) {
    const ok = await confirm({
      title: "Delete this message?",
      description: "The enquiry will be permanently removed from the inbox. This cannot be undone.",
      detail: subject,
      confirmLabel: "Delete message",
      cancelLabel: "Keep it",
    });
    if (!ok) return;
    const result = await deleteMessage({ data: { id } });
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Message deleted");
    refresh();
  }

  const term = search.trim().toLowerCase();
  const rows = (data ?? []).filter(
    (m) =>
      !term ||
      m.full_name.toLowerCase().includes(term) ||
      m.email.toLowerCase().includes(term) ||
      m.subject.toLowerCase().includes(term) ||
      m.message.toLowerCase().includes(term),
  );

  return (
    <>
      <AdminPageHeader
        title="Messages"
        description="Enquiries submitted through the contact page."
        action={
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages…"
            className="w-56"
          />
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No messages yet.</p>
      ) : (
        <div className="space-y-4">
          {rows.map((m) => (
            <Card key={m.id}>
              <CardContent className="space-y-3 pt-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{m.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      {m.full_name} · {m.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(m.created_at).toLocaleString("en-CA")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={m.status === "new" ? "default" : "secondary"}>{m.status}</Badge>
                    <Select
                      value={m.status}
                      onValueChange={(v) => patch(m.id, { status: v as (typeof STATUSES)[number] })}
                    >
                      <SelectTrigger className="w-32">
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
                    <Button asChild variant="outline" size="icon" title="Reply by email">
                      <a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`}>
                        <Mail className="size-4" />
                      </a>
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => remove(m.id, m.subject)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <p className="whitespace-pre-line rounded-lg bg-muted/50 p-3 text-sm text-foreground">
                  {m.message}
                </p>

                <div className="space-y-2">
                  <Textarea
                    rows={2}
                    placeholder="Internal notes…"
                    value={notes[m.id] ?? m.admin_notes ?? ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [m.id]: e.target.value }))}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => patch(m.id, { admin_notes: notes[m.id] ?? m.admin_notes ?? "" })}
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
