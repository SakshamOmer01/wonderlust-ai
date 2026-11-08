/**
 * Transactional email delivery for Wonderlust.
 *
 * Uses SMTP (nodemailer), so it works with any provider that offers SMTP
 * credentials (Postmark, Mailgun, Amazon SES, SendGrid, a Gmail app password,
 * a local MailHog instance, …) without binding the app to one vendor.
 *
 * Required environment variables for real delivery:
 *   SMTP_HOST   — SMTP server hostname
 *   SMTP_PORT   — 587 (STARTTLS, default) or 465 (implicit TLS)
 *   SMTP_USER   — SMTP username (optional for unauthenticated relays)
 *   SMTP_PASS   — SMTP password
 *   EMAIL_FROM  — verified sender, e.g. "Wonderlust <no-reply@example.com>"
 *
 * When SMTP is not configured, development builds log the message instead of
 * sending it and report `delivered: false`. Production never pretends an email
 * was sent: it throws and the caller decides how to handle the failure.
 */

import nodemailer, { type Transporter } from "nodemailer";

export class EmailNotConfiguredError extends Error {
  constructor() {
    super("Email delivery is not configured (set SMTP_HOST and EMAIL_FROM)");
    this.name = "EmailNotConfiguredError";
  }
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.EMAIL_FROM);
}

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  const port = Number.parseInt(process.env.SMTP_PORT ?? "587", 10);

  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number.isFinite(port) ? port : 587,
    secure: port === 465,
    ...(process.env.SMTP_USER
      ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
      : {}),
  });

  return cachedTransporter;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type SendResult = { delivered: boolean; reason?: "not_configured" };

/**
 * Send a password reset email.
 *
 * @throws EmailNotConfiguredError in production when SMTP is missing.
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  name?: string | null;
  resetUrl: string;
  expiresInMinutes: number;
}): Promise<SendResult> {
  const { to, name, resetUrl, expiresInMinutes } = params;
  const safeName = name?.trim() ? escapeHtml(name.trim().split(/\s+/)[0]!) : "there";
  const safeUrl = escapeHtml(resetUrl);

  const subject = "Reset your Wonderlust password";

  const text = [
    `Hi ${name?.trim() || "there"},`,
    "",
    "We received a request to reset your Wonderlust password.",
    `Open this link to choose a new password (valid for ${expiresInMinutes} minutes):`,
    resetUrl,
    "",
    "The link can be used once. If you didn't request this, you can ignore this email — your password will not change.",
    "",
    "— The Wonderlust team",
  ].join("\n");

  const html = `
    <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f172a">
      <h1 style="font-size:20px;margin:0 0 16px">Reset your password</h1>
      <p style="margin:0 0 12px">Hi ${safeName},</p>
      <p style="margin:0 0 16px">We received a request to reset your Wonderlust password. This link is valid for ${expiresInMinutes} minutes and can be used once.</p>
      <p style="margin:0 0 24px">
        <a href="${safeUrl}" style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">Choose a new password</a>
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:#64748b">If the button doesn't work, copy this link into your browser:</p>
      <p style="margin:0 0 24px;font-size:13px;word-break:break-all;color:#0d9488">${safeUrl}</p>
      <p style="margin:0;font-size:13px;color:#64748b">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `.trim();

  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      // Development affordance: make the flow usable without an SMTP server.
      console.info(
        `[email] SMTP not configured — password reset link for ${to}: ${resetUrl}`
      );
      return { delivered: false, reason: "not_configured" };
    }
    throw new EmailNotConfiguredError();
  }

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });

  return { delivered: true };
}
