import { Resend } from 'resend';

let resendClient: Resend | null = null;

export function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY env var is not set.');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

interface SendAuditEmailParams {
  to: string;
  auditId: string;
  totalMonthlySavings: number;
  topRecommendations: string[];
  highSavings: boolean;
}

export async function sendAuditEmail({
  to,
  auditId,
  totalMonthlySavings,
  topRecommendations,
  highSavings,
}: SendAuditEmailParams): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://model-meter.vercel.app';
  const auditUrl = `${appUrl}/audit/${auditId}`;
  const annualSavings = totalMonthlySavings * 12;

  const recommendationsList = topRecommendations
    .slice(0, 2)
    .map((r) => `<li style="margin: 8px 0;">${r}</li>`)
    .join('');

  const ctaBlock = highSavings
    ? `<p style="background:#fef3c7;border-radius:6px;padding:16px;margin:24px 0;color:#92400e;">
        <strong>A Credex advisor will be in touch within 1 business day</strong> to help you capture these savings through discounted AI credits.
      </p>`
    : `<p style="color:#6b7280;margin:24px 0;">
        We'll reach out when new optimizations become available for your stack.
      </p>`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1e293b;background:#fff;">
      <div style="border-bottom:2px solid #3b82f6;padding-bottom:16px;margin-bottom:24px;">
        <h1 style="margin:0;font-size:24px;color:#1e293b;">Model-meter AI Spend Audit</h1>
        <p style="margin:4px 0 0;color:#64748b;font-size:14px;">Powered by Credex</p>
      </div>

      <div style="background:#f0fdf4;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center;">
        <p style="margin:0 0 4px;color:#15803d;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Potential Monthly Savings</p>
        <p style="margin:0;font-size:36px;font-weight:700;color:#15803d;">$${Math.round(totalMonthlySavings).toLocaleString()}/month</p>
        <p style="margin:4px 0 0;color:#166534;font-size:14px;">$${Math.round(annualSavings).toLocaleString()}/year</p>
      </div>

      ${topRecommendations.length > 0 ? `
      <h2 style="font-size:16px;margin:0 0 12px;">Top Recommendations</h2>
      <ul style="padding-left:20px;margin:0 0 24px;">${recommendationsList}</ul>
      ` : ''}

      ${ctaBlock}

      <a href="${auditUrl}" style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-bottom:24px;">
        View Your Full Audit Report →
      </a>

      <p style="color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0;padding-top:16px;margin:0;">
        Model-meter by Credex · <a href="${appUrl}" style="color:#94a3b8;">model-meter.vercel.app</a>
      </p>
    </body>
    </html>
  `;

  const text = [
    'Your Model-meter AI Spend Audit',
    '',
    `Total potential savings: $${Math.round(totalMonthlySavings)}/month ($${Math.round(annualSavings)}/year)`,
    '',
    topRecommendations.length > 0
      ? `Top recommendations:\n${topRecommendations.slice(0, 2).map((r) => `- ${r}`).join('\n')}`
      : '',
    '',
    `View your full audit: ${auditUrl}`,
    '',
    highSavings
      ? 'A Credex advisor will be in touch within 1 business day to help you capture these savings.'
      : "We'll reach out when new optimizations become available for your stack.",
  ]
    .filter((l) => l !== undefined)
    .join('\n');

  const resend = getResend();
  await resend.emails.send({
    from: 'Model-meter <audit@model-meter.com>',
    to,
    subject: 'Your Model-meter AI Spend Audit',
    html,
    text,
  });
}
