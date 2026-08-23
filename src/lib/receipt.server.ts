import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type ReceiptData = {
  receiptNumber: string;
  donorName?: string | undefined;
  donorEmail: string;
  amountCents: number;
  currency: string;
  donationType: "one_time" | "monthly";
  dateIso: string;
  environment: "sandbox" | "live";
};

const ORG_NAME = "Hope Beyond Scarcity";
const ORG_SUBTITLE = "Canadian Not-for-Profit Corporation";
const ORG_ADDRESS = "Toronto, Ontario, Canada";
const ORG_EMAIL = "info@hopebeyondscarcity.com";

export function formatCad(amountCents: number): string {
  return `$${(amountCents / 100).toFixed(2)} CAD`;
}

export function formatReceiptDate(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Toronto",
  });
}

/** Builds a donation receipt PDF and returns it as a base64 string. */
export async function buildReceiptPdfBase64(data: ReceiptData): Promise<string> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${ORG_NAME} — Donation Receipt ${data.receiptNumber}`);
  pdf.setAuthor(ORG_NAME);

  const page = pdf.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const brand = rgb(0.043, 0.29, 0.6);
  const ink = rgb(0.09, 0.11, 0.15);
  const muted = rgb(0.42, 0.46, 0.53);
  const line = rgb(0.85, 0.88, 0.92);
  const margin = 56;

  // Header band
  page.drawRectangle({ x: 0, y: height - 118, width, height: 118, color: brand });
  page.drawText(ORG_NAME, {
    x: margin,
    y: height - 62,
    size: 22,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText(ORG_SUBTITLE.toUpperCase(), {
    x: margin,
    y: height - 82,
    size: 9,
    font: regular,
    color: rgb(0.82, 0.88, 0.97),
  });
  page.drawText("DONATION RECEIPT", {
    x: width - margin - bold.widthOfTextAtSize("DONATION RECEIPT", 12),
    y: height - 62,
    size: 12,
    font: bold,
    color: rgb(1, 1, 1),
  });

  let y = height - 160;

  const drawRow = (label: string, value: string) => {
    page.drawText(label, { x: margin, y, size: 10, font: regular, color: muted });
    page.drawText(value, { x: margin + 170, y, size: 11, font: bold, color: ink });
    y -= 26;
  };

  page.drawText("Thank you for your generosity", {
    x: margin,
    y,
    size: 15,
    font: bold,
    color: ink,
  });
  y -= 22;
  page.drawText(
    "This receipt confirms the donation described below was received in Canadian dollars.",
    { x: margin, y, size: 10, font: regular, color: muted },
  );
  y -= 34;

  page.drawLine({
    start: { x: margin, y: y + 10 },
    end: { x: width - margin, y: y + 10 },
    thickness: 1,
    color: line,
  });
  y -= 12;

  drawRow("Receipt number", data.receiptNumber);
  drawRow("Date received", formatReceiptDate(data.dateIso));
  drawRow("Donor", data.donorName?.trim() || data.donorEmail);
  drawRow("Donor email", data.donorEmail);
  drawRow("Gift type", data.donationType === "monthly" ? "Monthly recurring gift" : "One-time gift");
  drawRow("Currency", data.currency.toUpperCase());

  // Amount highlight
  y -= 8;
  page.drawRectangle({
    x: margin,
    y: y - 34,
    width: width - margin * 2,
    height: 56,
    color: rgb(0.95, 0.97, 1),
  });
  page.drawText("Total amount received", {
    x: margin + 18,
    y: y + 2,
    size: 10,
    font: regular,
    color: muted,
  });
  page.drawText(formatCad(data.amountCents), {
    x: width - margin - 18 - bold.widthOfTextAtSize(formatCad(data.amountCents), 20),
    y: y - 6,
    size: 20,
    font: bold,
    color: brand,
  });
  y -= 70;

  const notes: string[] = [
    `${ORG_NAME} is a Canadian Not-for-Profit Corporation. Charitable registration with the`,
    "Canada Revenue Agency is in progress, so this document is an acknowledgement of your gift",
    "and is not an official income tax receipt.",
    "",
    `Questions about this receipt? Write to ${ORG_EMAIL}.`,
  ];
  if (data.environment === "sandbox") {
    notes.unshift("TEST TRANSACTION — no real funds were charged.", "");
  }
  for (const note of notes) {
    page.drawText(note, { x: margin, y, size: 9.5, font: regular, color: muted });
    y -= 15;
  }

  page.drawLine({
    start: { x: margin, y: 92 },
    end: { x: width - margin, y: 92 },
    thickness: 1,
    color: line,
  });
  page.drawText(`${ORG_NAME} · ${ORG_ADDRESS} · ${ORG_EMAIL}`, {
    x: margin,
    y: 74,
    size: 9,
    font: regular,
    color: muted,
  });

  return pdf.saveAsBase64();
}
