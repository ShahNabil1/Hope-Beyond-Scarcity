export type DonationFrequency = "one_time" | "monthly";

export const PRESET_AMOUNTS_CAD = [25, 50, 100, 250] as const;
export const MIN_DONATION_CAD = 5;
export const MAX_DONATION_CAD = 100_000;

/** The only currency this application ever charges in. */
export const DONATION_CURRENCY = "CAD" as const;
export const DONATION_CURRENCY_STRIPE = "cad" as const;

export type DonationCurrency = typeof DONATION_CURRENCY;

export type DonationInput = {
  amountInCents: number;
  currency: DonationCurrency;
  frequency: DonationFrequency;
  customerEmail?: string | undefined;
  userId?: string | undefined;
  returnUrl: string;
  environment: "sandbox" | "live";
};

export function formatCad(amountInCents: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: DONATION_CURRENCY,
    minimumFractionDigits: amountInCents % 100 === 0 ? 0 : 2,
  }).format(amountInCents / 100);
}

export type ParsedAmount = { cents: number } | { error: string };

/**
 * Parse a user-typed CAD amount into an exact integer number of cents.
 * String-based so 19.99 never becomes 1998 through float drift.
 */
export function parseCadAmountToCents(raw: string): ParsedAmount {
  const value = raw.trim().replace(/[$\s,]/g, "");

  if (!value) return { error: "Enter a donation amount in CAD." };
  if (!/^\d*(\.\d*)?$/.test(value)) {
    return { error: "Enter a valid amount using numbers only (for example 50 or 49.99)." };
  }

  const [wholePart = "", fractionPart = ""] = value.split(".");
  if (!wholePart && !fractionPart) return { error: "Enter a donation amount in CAD." };
  if (fractionPart.length > 2) {
    return { error: "Canadian dollars support at most 2 decimal places (cents)." };
  }

  const dollars = wholePart ? Number.parseInt(wholePart, 10) : 0;
  const cents = fractionPart ? Number.parseInt(fractionPart.padEnd(2, "0"), 10) : 0;
  if (!Number.isSafeInteger(dollars) || Number.isNaN(cents)) {
    return { error: "Enter a valid amount in CAD." };
  }

  const total = dollars * 100 + cents;
  if (total < MIN_DONATION_CAD * 100) {
    return { error: `The minimum donation is ${formatCad(MIN_DONATION_CAD * 100)} CAD.` };
  }
  if (total > MAX_DONATION_CAD * 100) {
    return {
      error: `For gifts above ${formatCad(MAX_DONATION_CAD * 100)} CAD, please contact us directly.`,
    };
  }
  return { cents: total };
}

export function validateDonation(data: DonationInput): DonationInput {
  if (data.currency !== DONATION_CURRENCY) {
    throw new Error("All donations must be made in Canadian dollars (CAD).");
  }
  if (!Number.isInteger(data.amountInCents)) {
    throw new Error("Donation amount must be a whole number of Canadian cents.");
  }
  if (data.amountInCents < MIN_DONATION_CAD * 100) {
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
