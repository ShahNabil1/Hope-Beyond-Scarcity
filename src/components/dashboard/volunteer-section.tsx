import { useEffect, useState } from "react";
import { HeartHandshake, Loader2, PackageOpen } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";

type Application = {
  id: string;
  interest_area: string;
  availability: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

type Pitch = {
  id: string;
  title: string;
  description: string | null;
  estimated_cost_cents: number | null;
  status: string;
  created_at: string;
};

const INTEREST_AREAS = [
  "Community fundraising",
  "Event support",
  "Care package packing",
  "Communications & storytelling",
  "Translation",
  "Skilled professional support",
];

const STAGES: { id: string; label: string; matches: string[] }[] = [
  { id: "pending", label: "Pending review", matches: ["pending", "submitted"] },
  { id: "reviewing", label: "In review", matches: ["reviewing"] },
  { id: "approved", label: "Approved / active", matches: ["approved", "active", "completed"] },
];

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "approved" || status === "active") return "default";
  if (status === "declined") return "destructive";
  if (status === "reviewing") return "outline";
  return "secondary";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

export function VolunteerSection({ userId, email }: { userId: string; email: string }) {
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [pitches, setPitches] = useState<Pitch[] | null>(null);
  const [interest, setInterest] = useState(INTEREST_AREAS[0] as string);
  const [availability, setAvailability] = useState("");
  const [message, setMessage] = useState("");
  const [pitchTitle, setPitchTitle] = useState("");
  const [pitchDescription, setPitchDescription] = useState("");
  const [pitchCost, setPitchCost] = useState("");
  const [submitting, setSubmitting] = useState<"application" | "pitch" | null>(null);

  async function load() {
    const [apps, ideas] = await Promise.all([
      supabase
        .from("volunteer_applications")
        .select("id, interest_area, availability, message, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("care_package_pitches")
        .select("id, title, description, estimated_cost_cents, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);
    setApplications(apps.data ?? []);
    setPitches(ideas.data ?? []);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function submitApplication(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting("application");
    const { error } = await supabase.from("volunteer_applications").insert({
      user_id: userId,
      email,
      interest_area: interest,
      availability: availability.trim() || null,
      message: message.trim().slice(0, 1000) || null,
    });
    setSubmitting(null);
    if (error) {
      toast.error(error.message || "Could not submit your application.");
      return;
    }
    setAvailability("");
    setMessage("");
    toast.success("Application submitted. Our team will be in touch.");
    await load();
  }

  async function submitPitch(event: React.FormEvent) {
    event.preventDefault();
    const title = pitchTitle.trim();
    if (title.length < 3) {
      toast.error("Give your idea a short title.");
      return;
    }
    const cost = pitchCost.trim();
    if (cost && !/^\d+(\.\d{1,2})?$/.test(cost)) {
      toast.error("Enter the estimated cost as a number, for example 250.");
      return;
    }
    setSubmitting("pitch");
    const { error } = await supabase.from("care_package_pitches").insert({
      user_id: userId,
      title: title.slice(0, 120),
      description: pitchDescription.trim().slice(0, 1000) || null,
      estimated_cost_cents: cost ? Math.round(Number(cost) * 100) : null,
    });
    setSubmitting(null);
    if (error) {
      toast.error(error.message || "Could not submit your idea.");
      return;
    }
    setPitchTitle("");
    setPitchDescription("");
    setPitchCost("");
    toast.success("Care package idea submitted.");
    await load();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Volunteer applications</CardTitle>
          <CardDescription>Track where each of your applications stands.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {applications === null ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {STAGES.map((stage) => {
                const items = applications.filter((app) => stage.matches.includes(app.status));
                return (
                  <div key={stage.id} className="rounded-xl border border-border bg-muted/30 p-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">{stage.label}</h3>
                      <span className="text-xs text-muted-foreground">{items.length}</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {items.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Nothing here yet.</p>
                      ) : (
                        items.map((app) => (
                          <div
                            key={app.id}
                            className="rounded-lg border border-border bg-background p-3"
                          >
                            <p className="text-sm font-medium text-foreground">
                              {app.interest_area}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Applied {formatDate(app.created_at)}
                            </p>
                            {app.availability ? (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {app.availability}
                              </p>
                            ) : null}
                            <Badge
                              variant={statusVariant(app.status)}
                              className="mt-2 capitalize"
                            >
                              {app.status}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <form onSubmit={submitApplication} className="space-y-4 border-t border-border pt-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <HeartHandshake className="size-4 text-primary" aria-hidden="true" />
              Apply for a new volunteer role
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="interest-area">Area of interest</Label>
                <Select value={interest} onValueChange={setInterest}>
                  <SelectTrigger id="interest-area">
                    <SelectValue placeholder="Choose an area" />
                  </SelectTrigger>
                  <SelectContent>
                    {INTEREST_AREAS.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="availability">Availability</Label>
                <Input
                  id="availability"
                  placeholder="Weekends, 4 hrs/week"
                  maxLength={120}
                  value={availability}
                  onChange={(event) => setAvailability(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="volunteer-message">Anything we should know?</Label>
              <Textarea
                id="volunteer-message"
                rows={3}
                maxLength={1000}
                placeholder="Skills, languages, past experience…"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={submitting === "application"}>
              {submitting === "application" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              Submit application
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Care package idea pitches</CardTitle>
          <CardDescription>
            Pitch a care package or initiative and follow it from idea to active programme.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {pitches === null ? (
            <Skeleton className="h-24 w-full" />
          ) : pitches.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <PackageOpen className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
              <p className="mt-3 text-sm text-muted-foreground">
                No pitches yet. Share the first idea below.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {pitches.map((pitch) => (
                <li key={pitch.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{pitch.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Submitted {formatDate(pitch.created_at)}
                        {pitch.estimated_cost_cents
                          ? ` · est. $${(pitch.estimated_cost_cents / 100).toFixed(2)} CAD`
                          : ""}
                      </p>
                    </div>
                    <Badge variant={statusVariant(pitch.status)} className="capitalize">
                      {pitch.status}
                    </Badge>
                  </div>
                  {pitch.description ? (
                    <p className="mt-2 text-sm text-muted-foreground">{pitch.description}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={submitPitch} className="space-y-4 border-t border-border pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pitch-title">Idea title</Label>
                <Input
                  id="pitch-title"
                  maxLength={120}
                  placeholder="School-start kits for Dhaka"
                  value={pitchTitle}
                  onChange={(event) => setPitchTitle(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pitch-cost">Estimated cost (CAD, optional)</Label>
                <Input
                  id="pitch-cost"
                  inputMode="decimal"
                  placeholder="250"
                  value={pitchCost}
                  onChange={(event) => setPitchCost(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pitch-description">What would the package include?</Label>
              <Textarea
                id="pitch-description"
                rows={3}
                maxLength={1000}
                value={pitchDescription}
                onChange={(event) => setPitchDescription(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={submitting === "pitch"}>
              {submitting === "pitch" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              Submit idea
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
