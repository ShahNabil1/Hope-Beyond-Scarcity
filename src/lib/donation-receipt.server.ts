import { sendEmail } from "@/lib/email.server";
import {
  buildReceiptPdfBase64,
  formatCad,
  formatReceiptDate,
  type ReceiptData,
} from "@/lib/receipt.server";

function receiptHtml(data: ReceiptData): string {
  const amount = formatCad(data.amountCents);
  const greeting = data.donorName?.trim() ? `Hi ${escapeHtml(data.donorName.trim())},` : "Hi there,";
  const giftLine =
    data.donationType === "monthly"
      ? `your monthly gift of <strong>${amount}</strong> has been received`
      : `your one-time gift of <strong>${amount}</strong> has been received`;

  return `<!doctype html>
<html lang="en"><body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#17202b;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#0b4a99;border-radius:12px;padding:24px;color:#ffffff;">
      <div style="font-size:20px;font-weight:bold;">Hope Beyond Scarcity</div>
      <div style="font-size:11px;letter-spacing:1px;color:#d2e2f8;">CANADIAN NOT-FOR-PROFIT CORPORATION</div>
    </div>
    <h1 style="font-size:20px;margin:28px 0 12px;">Thank you for your gift</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 14px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 14px;">
      ${giftLine} on ${formatReceiptDate(data.dateIso)}. Your PDF receipt is attached to this email.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
      <tr><td style="padding:8px 0;color:#6b7480;">Receipt number</td><td style="padding:8px 0;text-align:right;font-weight:bold;">${escapeHtml(data.receiptNumber)}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7480;">Amount</td><td style="padding:8px 0;text-align:right;font-weight:bold;">${amount}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7480;">Gift type</td><td style="padding:8px 0;text-align:right;font-weight:bold;">${data.donationType === "monthly" ? "Monthly recurring" : "One-time"}</td></tr>
    </table>
    <p style="font-size:13px;line-height:1.6;color:#6b7480;margin:0 0 12px;">
      Hope Beyond Scarcity is a Canadian Not-for-Profit Corporation. Charitable registration with the
      Canada Revenue Agency is in progress, so this is an acknowledgement of your gift and not an
      official income tax receipt.
    </p>
    ${data.environment === "sandbox" ? `<p style="font-size:13px;color:#a15c00;margin:0 0 12px;">Test transaction — no real funds were charged.</p>` : ""}
    <p style="font-size:13px;color:#6b7480;margin:0;">Toronto, Ontario, Canada · info@hopebeyondscarcity.com</p>
  </div>
</body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendDonationReceipt(data: ReceiptData) {
  const pdfBase64 = await buildReceiptPdfBase64(data);
  return sendEmail({
    to: data.donorEmail,
    subject: `Your donation receipt — ${formatCad(data.amountCents)} · Hope Beyond Scarcity`,
    html: receiptHtml(data),
    text: `Thank you for your ${data.donationType === "monthly" ? "monthly" : "one-time"} gift of ${formatCad(
      data.amountCents,
    )} received on ${formatReceiptDate(data.dateIso)}. Receipt number ${data.receiptNumber}. Your PDF receipt is attached.`,
    attachments: [
      { filename: `hope-beyond-scarcity-receipt-${data.receiptNumber}.pdf`, content: pdfBase64 },
    ],
  });
}
