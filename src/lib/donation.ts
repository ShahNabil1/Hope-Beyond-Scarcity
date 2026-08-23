export type DonationFrequency = "one_time" | "monthly";

export const PRESET_AMOUNTS_CAD = [25, 50, 100, 250] as const;
export const MIN_DONATION_CAD = 5;
export const MAX_DONATION_CAD = 100_000;

export type DonationInput = {
  amountInCents: number;
  frequency: DonationFrequency;
  customerEmail?: string | undefined;
  userId?: string | undefined;
  returnUrl: string;
  environment: "sandbox" | "live";
};

export function formatCad(amountInCents: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: amountInCents % 100 === 0 ? 0 : 2,
  }).format(amountInCents / 100);
}

export function validateDonation(data: DonationInput): DonationInput {
  if (!Number.isInteger(data.amountInCents) || data.amountInCents < MIN_DONATION_CAD * 100) {
    throw new Error(`Minimum donation is $${MIN_DONATION_CAD} CAD`);
  }
  if (data.amountInCents > MAX_DONATION_CAD * 100) {
    throw new Error("For gifts above $100,000 CAD please contact us directly");
  }
  if (data.frequency !== "one_time" && data.frequency !== "monthly") {
    throw new Error("Invalid donation frequency");
  }
  if (data.frequency === "monthly" && !data.userId) {
    throw new Error("Monthly giving requires an account");
  }
  if (data.userId && !/^[a-zA-Z0-9_-]+$/.test(data.userId)) {
    throw new Error("Invalid userId");
  }
  if (data.customerEmail && data.customerEmail.length > 255) {
    throw new Error("Invalid email");
  }
  if (!data.returnUrl.startsWith("http")) {
    throw new Error("Invalid return URL");
  }
  return data;
}
