import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

export type PasswordRuleId = "length" | "lowercase" | "uppercase" | "digit" | "symbol";

export const passwordRules: {
  id: PasswordRuleId;
  label: string;
  test: (value: string) => boolean;
}[] = [
  { id: "length", label: `At least ${PASSWORD_MIN_LENGTH} characters`, test: (v) => v.length >= PASSWORD_MIN_LENGTH },
  { id: "lowercase", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { id: "uppercase", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { id: "digit", label: "One number", test: (v) => /\d/.test(v) },
  { id: "symbol", label: "One symbol (!@#$…)", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export function passwordScore(value: string) {
  return passwordRules.filter((rule) => rule.test(value)).length;
}

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must be less than ${PASSWORD_MAX_LENGTH} characters`)
  .regex(/[a-z]/, "Include at least one lowercase letter")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/\d/, "Include at least one number")
  .regex(/[^A-Za-z0-9]/, "Include at least one symbol");
