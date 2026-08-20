export async function sendIvyEmail(subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL_TO;

  if (!apiKey || !to) {
    console.warn(`[email skipped] ${subject}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    console.error(`Resend 이메일 발송 실패: ${res.status} ${await res.text()}`);
  }
}
