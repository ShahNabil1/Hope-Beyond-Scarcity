const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

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
  const lovableApiKey = process.env["LOVABLE_API_KEY"];
  const resendKey = process.env["RESEND_API_KEY"];
  if (!lovableApiKey || !resendKey) {
    return { sent: false, error: "Email is not configured (missing connector credentials)" };
  }

  const response = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableApiKey}`,
      "X-Connection-Api-Key": resendKey,
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
