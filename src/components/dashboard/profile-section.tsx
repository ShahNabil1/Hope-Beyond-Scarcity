import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(100),
  phone: z
    .string()
    .trim()
    .max(30, "Phone number is too long")
    .refine((value) => value === "" || /^[+()\d\s-]{7,30}$/.test(value), {
      message: "Enter a valid phone number",
    }),
  location: z.string().trim().max(120, "Location is too long"),
});

type ProfileValues = z.infer<typeof profileSchema>;

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export function ProfileSection({ userId, email }: { userId: string; email: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: "", phone: "", location: "" },
  });

  async function loadAvatar(path: string | null) {
    if (!path) {
      setAvatarUrl(null);
      return;
    }
    const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60);
    setAvatarUrl(data?.signedUrl ?? null);
  }

  useEffect(() => {
    let active = true;
    supabase
      .from("profiles")
      .select("full_name, phone, location, avatar_url")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        form.reset({
          fullName: data?.full_name ?? "",
          phone: data?.phone ?? "",
          location: data?.location ?? "",
        });
        void loadAvatar(data?.avatar_url ?? null);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId, form]);

  async function onSubmit(values: ProfileValues) {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: values.fullName,
        phone: values.phone || null,
        location: values.location || null,
      })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      toast.error(error.message || "Could not save your profile.");
      return;
    }
    toast.success("Profile updated.");
  }

  async function onAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Images must be smaller than 2 MB.");
      return;
    }

    setUploading(true);
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${userId}/avatar-${Date.now()}.${extension}`;
    const upload = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upload.error) {
      setUploading(false);
      toast.error(upload.error.message || "Upload failed.");
      return;
    }
    const { error } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", userId);
    setUploading(false);
    if (error) {
      toast.error("Uploaded, but we could not save it to your profile.");
      return;
    }
    await loadAvatar(path);
    toast.success("Profile photo updated.");
  }

  const initials = (form.watch("fullName") || email || "?")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Keep your supporter details current.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="size-20 border border-border">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="Your profile photo" /> : null}
            <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="size-4" aria-hidden="true" />
              )}
              {uploading ? "Uploading…" : "Upload photo"}
            </Button>
            <p className="text-xs text-muted-foreground">JPG or PNG, up to 2 MB.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label="Upload a profile photo"
              onChange={onAvatarChange}
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input autoComplete="name" placeholder="Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          autoComplete="tel"
                          placeholder="+1 416 555 0142"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input
                          autoComplete="address-level2"
                          placeholder="Toronto, ON"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>City and province or country.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-email">Email address</Label>
                <Input id="account-email" value={email} readOnly disabled />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
