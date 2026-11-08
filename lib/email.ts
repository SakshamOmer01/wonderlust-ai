/**
 * Email delivery for Wonderlust password resets.
 *
 * Sends transactional emails over SMTP. In development (no SMTP configured),
 * the password reset link is logged instead of being sent.
 */

import nodemailer from "nodemailer";
import { env } from "@/lib/env";

export interface ResetEmailParams {
  to: string;
  name: string;
  resetUrl: string;
  callbackUrl?: string;
}

/** Create a nodemailer transporter, or null when no SMTP is configured. */
export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_PORT);
}

export function createTransporter(): nodemailer.Transporter | null {
  const host = env.SMTP_HOST;
  const port = env.SMTP_PORT;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;

  if (!host || !port) {
    return null;
  }

  return nodemailer.createTransport(
    {
      host,
      port: parseInt(port, 10),
      secure: port === "465",
      auth: user && pass ? { user, pass } : undefined,
    } as unknown as nodemailer.TransportOptions & { host: string; port: number },
  );
}

/**
 * Send the password reset email.
 *
 * When SMTP is not configured, logs the reset URL instead of sending an email.
 */
export async function sendPasswordResetEmail(params: ResetEmailParams): Promise<{ delivered: boolean; to: string }> {
  const transporter = createTransporter();

  if (!transporter) {
    // Development fallback: log the reset link so the operator can still reset
    // their password from the browser URL.
    console.log(
      `[email] Password reset requested for ${params.to}\n` +
      `  Reset URL: ${params.resetUrl}\n` +
      `  Callback URL: ${params.callbackUrl}`
    );
    return { delivered: false, to: params.to };
  }

  const info = await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: params.to,
    subject: "Reset your Wonderlust password",
    text: `Hello,

You requested a password reset for your Wonderlust account. Click the link below to reset your password:

${params.resetUrl}

If you did not request this reset, please ignore this email.

Thanks,
The Wonderlust Team`,
    html: `
      <p>Hello,</p>
      <p>You requested a password reset for your Wonderlust account. Click the link below to reset your password:</p>
      <p><a href="${params.resetUrl}">${params.resetUrl}</a></p>
      <p>If you did not request this reset, please ignore this email.</p>
      <p>Thanks,<br/>The Wonderlust Team</p>
    `,
  });
  return { delivered: true, to: params.to };
}
