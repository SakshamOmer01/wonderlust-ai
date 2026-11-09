/**
 * Password reset request endpoint.
 *
 * POST /api/auth/forgot-password
 *
 * Body: { email }
 *
 * Creates a single-use, 30-minute reset token and emails a link to
 * /reset-password?token=… .
 *
 * Security:
 *   - The response is always the same generic message, so the endpoint cannot
 *     be used to enumerate registered accounts.
 *   - Rate limited per client IP and per target address (prevents using the
 *     endpoint to flood someone's inbox).
 *   - Only a SHA-256 hash of the token is stored; requesting a new link
 *     invalidates the previous one.
 *   - In development, when SMTP is not configured, the link is logged and
 *     returned as `devResetUrl` so the flow can be exercised locally. This
 *     never happens in production or when email delivery is configured.
 */

import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { parseJson, route } from "@/lib/api";
import { clientKey, enforceRateLimit } from "@/lib/rate-limit";
import { forgotPasswordSchema } from "@/lib/validation";
import { isEmailConfigured, sendPasswordResetEmail } from "@/lib/email";
import {
  buildResetUrl,
  createPasswordResetToken,
} from "@/lib/password-reset";

const GENERIC_MESSAGE =
  "If an account with this email exists, a reset link has been sent";

export const POST = route(async (request: Request) => {
  enforceRateLimit(`forgot-password:${clientKey(request)}`, 3, 15 * 60 * 1000);

  const { email } = await parseJson(request, forgotPasswordSchema);

  // Second limit keyed on the address so one IP can't blast a single inbox.
  enforceRateLimit(`forgot-password:email:${email}`, 3, 60 * 60 * 1000);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }

  const { token } = await createPasswordResetToken(user.id);
  const resetUrl = buildResetUrl(token);

  let delivered = false;
  try {
    const result = await sendPasswordResetEmail({
      to: user.email,
      name: user.name ?? "there",
      resetUrl,
    });
    delivered = result.delivered;
  } catch (error) {
    // Delivery failures must not leak account existence or token details.
    console.error("[forgot-password] failed to send reset email:", error);
  }

  const devResetUrl =
    !delivered && !isEmailConfigured() && process.env.NODE_ENV !== "production"
      ? resetUrl
      : undefined;

  return NextResponse.json({
    message: GENERIC_MESSAGE,
    ...(devResetUrl ? { devResetUrl } : {}),
  });
});
