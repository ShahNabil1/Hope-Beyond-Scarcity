import { sendEmail } from "@/lib/email.server";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatCad(cents: number): string {
  return `$${(cents / 100).toFixed(2)} CAD`;
}

/** Notifies a monthly donor that their card was declined, with fix + retry links. */
export async function sendPaymentFailedEmail(options: {
  to: string;
  donorName?: string | undefined;
  amountCents: number;
  hostedInvoiceUrl?: string | null;
  dashboardUrl: string;
  attemptCount?: number | null;
  nextAttemptIso?: string | null;
}) {
  const greeting = options.donorName?.trim()
    ? `Hi ${escapeHtml(options.donorName.trim())},`
    : "Hi there,";
  const amount = formatCad(options.amountCents);
  const nextAttempt = options.nextAttemptIso
    ? new Date(options.nextAttemptIso).toLocaleDateString("en-CA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const html = `<!doctype html>
<html lang="en"><body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#17202b;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#0b4a99;border-radius:12px;padding:24px;color:#ffffff;">
      <div style="font-size:20px;font-weight:bold;">Hope Beyond Scarcity</div>
      <div style="font-size:11px;letter-spacing:1px;color:#d2e2f8;">CANADIAN NOT-FOR-PROFIT CORPORATION</div>
    </div>
    <h1 style="font-size:20px;margin:28px 0 12px;">We couldn't process your monthly gift</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 14px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 14px;">
      Your monthly gift of <strong>${amount}</strong> was declined by your bank. Nothing has been
      charged. Updating your card takes less than a minute and keeps your support going.
    </p>
    <p style="margin:24px 0;">
      <a href="${escapeHtml(options.dashboardUrl)}" style="background:#0b4a99;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold;display:inline-block;">Update card &amp; retry</a>
    </p>
    ${
      options.hostedInvoiceUrl
        ? `<p style="font-size:14px;line-height:1.6;margin:0 0 14px;">You can also pay this charge directly: <a href="${escapeHtml(options.hostedInvoiceUrl)}" style="color:#0b4a99;">view invoice</a>.</p>`
        : ""
    }
    ${
      nextAttempt
        ? `<p style="font-size:14px;color:#6b7480;margin:0 0 14px;">We will automatically try again on ${nextAttempt}.</p>`
        : ""
    }
    <p style="font-size:13px;color:#6b7480;margin:0;">Toronto, Ontario, Canada · info@hopebeyondscarcity.com</p>
  </div>
</body></html>`;

  return sendEmail({
    to: options.to,
    subject: `Action needed: your monthly gift of ${amount} was declined`,
    html,
    text: `Your monthly gift of ${amount} was declined. Update your card and retry at ${options.dashboardUrl}.`,
  });
}
