import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrength } from "@/components/auth/password-strength";
import { passwordSchema } from "@/lib/password";
import { fetchRoles, landingPathForRoles } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { Turnstile, useTurnstile } from "@/components/turnstile";


export const Route = createFileRoute("/auth/sign-up")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Create Account | Hope Beyond Scarcity" },
      {
        name: "description",
        content:
          "Create a Hope Beyond Scarcity supporter account to track donations, receipts and campaign updates.",
      },
      { property: "og:title", content: "Create Account | Hope Beyond Scarcity" },
      {
        property: "og:description",
        content: "Join Hope Beyond Scarcity and support families beyond one-time generosity.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignUpPage,
});

const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, "Please enter your full name").max(100),
    email: z.string().trim().min(1, "Email is required").email("Enter a valid email address").max(255),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    acceptPolicies: z.boolean(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((values) => values.acceptPolicies, {
    message: "You must accept all policies to continue",
    path: ["acceptPolicies"],
  });

type SignUpValues = z.infer<typeof signUpSchema>;

const otpSchema = z.object({
  token: z.string().length(6, "Enter the 6-digit code from your email"),
});

function SignUpPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const captcha = useTurnstile();

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptPolicies: false,
    },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { token: "" },
  });

  const values = form.watch();
  const allPoliciesAccepted = values.acceptPolicies === true;

  async function onSubmit(raw: SignUpValues) {
    const parsed = signUpSchema.safeParse(raw);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please review the form.");
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.fullName, policies_accepted: "true" },
        ...(captcha.token ? { captchaToken: captcha.token } : {}),
      },
    });
    setSubmitting(false);

    if (error) {
      captcha.reset();
      toast.error(
        error.message.toLowerCase().includes("already")
          ? "An account with this email already exists. Try signing in instead."
          : error.message,
      );
      return;
    }

    if (data.session) {
      const roles = await fetchRoles(data.session.user.id);
      toast.success("Account created. Welcome to Hope Beyond Scarcity.");
      navigate({ to: landingPathForRoles(roles), replace: true });
      return;
    }

    setSentTo(parsed.data.email);
    toast.success("We emailed you a 6-digit verification code.");
  }

  async function verifyCode(vals: z.infer<typeof otpSchema>) {
    if (!sentTo) return;
    setVerifying(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email: sentTo,
      token: vals.token,
      type: "signup",
    });
    setVerifying(false);

    if (error || !data.user) {
      toast.error(error?.message || "That code is invalid or has expired.");
      return;
    }

    const roles = await fetchRoles(data.user.id);
    toast.success("Email verified. Welcome to Hope Beyond Scarcity.");
    navigate({ to: landingPathForRoles(roles), replace: true });
  }

  async function resendCode() {
    if (!sentTo) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: sentTo,
      ...(captcha.token ? { options: { captchaToken: captcha.token } } : {}),
    });
    captcha.reset();
    setResending(false);
    if (error) {
      toast.error(error.message || "We couldn't resend the code. Try again shortly.");
      return;
    }
    toast.success("A new code is on its way.");
  }

  if (sentTo) {
    return (
      <AuthShell
        title="Verify your email"
        description={`We sent a 6-digit code to ${sentTo}. It expires in 5 minutes.`}
        footer={
          <button
            type="button"
            onClick={() => setSentTo(null)}
            className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Use a different email
          </button>
        }
      >
        <Form {...otpForm}>
          <form onSubmit={otpForm.handleSubmit(verifyCode)} className="space-y-5" noValidate>
            <FormField
              control={otpForm.control}
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

            <Button type="submit" className="w-full" disabled={verifying}>
              {verifying ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {verifying ? "Verifying…" : "Verify and continue"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={resendCode}
              disabled={resending}
            >
              {resending ? "Sending…" : "Resend code"}
            </Button>
          </form>
        </Form>
      </AuthShell>
    );
  }


  return (
    <AuthShell
      title="Create your account"
      description="Join a community funding the months after one-time generosity."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/auth" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
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
          <FormField
            control={form.control}
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" placeholder="At least 8 characters" {...field} />
                </FormControl>
                <PasswordStrength value={field.value} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" placeholder="Re-enter your password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <FormField
              control={form.control}
              name="acceptPolicies"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value === true}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal">
                      I have read and agree to the{" "}
                      <Link to="/terms" className="font-semibold text-primary hover:underline">
                        Terms of Service
                      </Link>
                      ,{" "}
                      <Link to="/privacy" className="font-semibold text-primary hover:underline">
                        Privacy Policy
                      </Link>
                      , and{" "}
                      <Link to="/refund" className="font-semibold text-primary hover:underline">
                        Refund Policy
                      </Link>
                      .
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </div>

          <Turnstile onToken={captcha.setToken} handleRef={captcha.ref} action="sign-up" />

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || !allPoliciesAccepted || !captcha.ready}
          >
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {submitting ? "Creating account…" : "Create account"}
          </Button>
          <p
            className={`min-h-4 text-center text-xs leading-4 text-muted-foreground transition-opacity duration-200 ${
              allPoliciesAccepted ? "opacity-0" : "opacity-100"
            }`}
          >
            Please accept the policies to continue.
          </p>
        </form>
      </Form>
    </AuthShell>
  );
}
