export const RECEIPT_FROM = "Hope Beyond Scarcity <no-reply@hopebeyondscarcity.com>";

export type EmailAttachment = {
  filename: string;
  /** base64-encoded file content */
  content: string;
};

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}): Promise<{ sent: true; id?: string } | { sent: false; error: string }> {
  const resendKey = process.env["RESEND_API_KEY"];
  if (!resendKey) {
    return { sent: false, error: "Email is not configured (missing RESEND_API_KEY)" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from: RECEIPT_FROM,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      ...(options.text && { text: options.text }),
      ...(options.attachments?.length && { attachments: options.attachments }),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Resend request failed [${response.status}]: ${body}`);
    return { sent: false, error: `Email send failed [${response.status}]: ${body}` };
  }

  const data = (await response.json().catch(() => ({}))) as { id?: string };
  return { sent: true, ...(data.id && { id: data.id }) };
}
