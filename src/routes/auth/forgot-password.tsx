import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
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
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrength } from "@/components/auth/password-strength";
import { passwordSchema } from "@/lib/password";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { fetchRoles, landingPathForRoles } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth/forgot-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset Password | Hope Beyond Scarcity" },
      {
        name: "description",
        content:
          "Request a secure reset code and set a new password for your Hope Beyond Scarcity account.",
      },
      { property: "og:title", content: "Reset Password | Hope Beyond Scarcity" },
      {
        property: "og:description",
        content: "Recover access to your Hope Beyond Scarcity account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForgotPasswordPage,
});

const requestSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address").max(255),
});

const resetSchema = z
  .object({
    token: z.string().length(6, "Enter the 6-digit code from your email"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"request" | "verify">("request");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);

  const requestForm = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: "" },
  });

  const resetForm = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: { token: "", password: "", confirmPassword: "" },
  });

  async function sendCode(values: z.infer<typeof requestSchema>) {
    setSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setSending(false);

    if (error) {
      toast.error(error.message || "We couldn't send that reset email. Please try again.");
      return;
    }

    setEmail(values.email);
    setStep("verify");
    toast.success("Reset instructions sent. Check your inbox.");
  }

  async function submitReset(values: z.infer<typeof resetSchema>) {
    setResetting(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: values.token,
      type: "recovery",
    });

    if (error || !data.user) {
      setResetting(false);
      toast.error(error?.message || "That code is invalid or has expired.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: values.password });
    if (updateError) {
      setResetting(false);
      toast.error(updateError.message || "We couldn't update your password.");
      return;
    }

    const roles = await fetchRoles(data.user.id);
    toast.success("Password updated. You're signed in.");
    navigate({ to: landingPathForRoles(roles), replace: true });
  }

  if (step === "verify") {
    return (
      <AuthShell
        title="Enter your reset code"
        description={`We sent a 6-digit code to ${email}. It expires in 5 minutes.`}
        footer={
          <button
            type="button"
            onClick={() => setStep("request")}
            className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Use a different email
          </button>
        }
      >
        <Form {...resetForm}>
          <form onSubmit={resetForm.handleSubmit(submitReset)} className="space-y-5" noValidate>
            <FormField
              control={resetForm.control}
              name="token"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center">
                  <FormLabel className="self-start">6-digit code</FormLabel>
                  <FormControl>
                    <InputOTP maxLength={6} value={field.value} onChange={field.onChange}>
                      <InputOTPGroup>
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                          <InputOTPSlot key={index} index={index} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormDescription className="self-start">
                    Didn't get it? Check spam, or request a new code.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={resetForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="new-password" placeholder="At least 8 characters" {...field} />
                  </FormControl>
                  <PasswordStrength value={field.value} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={resetForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm new password</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="new-password" placeholder="Re-enter your password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={resetting}>
              {resetting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {resetting ? "Updating password…" : "Set new password"}
            </Button>
          </form>
        </Form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your password?"
      description="Enter your email and we'll send a secure reset code."
      footer={
        <Link to="/auth" className="font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <Form {...requestForm}>
        <form onSubmit={requestForm.handleSubmit(sendCode)} className="space-y-4" noValidate>
          <FormField
            control={requestForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={sending}>
            {sending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <MailCheck className="size-4" aria-hidden="true" />
            )}
            {sending ? "Sending…" : "Send reset code"}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
