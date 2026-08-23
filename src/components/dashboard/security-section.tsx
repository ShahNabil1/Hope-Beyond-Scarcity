import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PasswordStrength } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/hooks/use-auth";
import { passwordSchema } from "@/lib/password";
import { deleteMyAccount } from "@/lib/portal.functions";
import { supabase } from "@/lib/supabase";

const passwordFormSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export function SecuritySection({ email }: { email: string }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [savingPassword, setSavingPassword] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    mode: "onChange",
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function savePassword(values: z.infer<typeof passwordFormSchema>) {
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: values.password });
    setSavingPassword(false);
    if (error) {
      toast.error(error.message || "Could not update your password.");
      return;
    }
    passwordForm.reset({ password: "", confirmPassword: "" });
    toast.success("Password updated.");
  }

  async function sendResetLink() {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) {
      toast.error(error.message || "Could not send the verification code.");
      return;
    }
    toast.success("We sent a 6-digit verification code to your email.");
  }

  async function onDelete() {
    setDeleting(true);
    const result = await deleteMyAccount({ data: { confirmation } });
    setDeleting(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    await signOut();
    toast.success("Your account and personal data have been permanently deleted.");
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Choose a new password for {email}.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(savePassword)} className="space-y-4" noValidate>
              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        {...field}
                      />
                    </FormControl>
                    <PasswordStrength value={field.value} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm new password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        autoComplete="new-password"
                        placeholder="Re-enter your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={savingPassword}>
                  {savingPassword ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : null}
                  {savingPassword ? "Updating…" : "Update password"}
                </Button>
                <Button type="button" variant="outline" onClick={sendResetLink}>
                  Email me a verification code
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" aria-hidden="true" />
            Delete my account &amp; data
          </CardTitle>
          <CardDescription>
            Exercise your right to be forgotten. This permanently removes your login, profile,
            avatar, volunteer records and care package pitches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive">Delete my account &amp; data</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Permanently delete your account?</DialogTitle>
                <DialogDescription asChild>
                  <div className="space-y-3 text-left">
                    <p>
                      This immediately purges your profile, credentials, avatar, volunteer
                      applications and care package pitches from our systems. It cannot be undone.
                    </p>
                    <p>
                      Your past donation records are kept in anonymised form — with your name and
                      email removed — because Canadian statutory accounting rules require us to
                      retain financial receipts.
                    </p>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="delete-confirmation">
                  Type <span className="font-semibold">DELETE</span> to confirm
                </Label>
                <Input
                  id="delete-confirmation"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  placeholder="DELETE"
                  autoComplete="off"
                />
              </div>
              <DialogFooter>
                <Button
                  variant="destructive"
                  disabled={confirmation !== "DELETE" || deleting}
                  onClick={onDelete}
                >
                  {deleting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                  {deleting ? "Deleting…" : "Delete everything"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
