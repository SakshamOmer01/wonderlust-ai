/**
 * Password reset request endpoint.
 *
 * POST /api/auth/forgot-password
 *
 * Body: { email }
 *
 * Always responds with the same generic message so the endpoint cannot be used
 * to enumerate registered accounts. Requests are rate limited per IP.
 *
 * IMPORTANT: transactional email delivery is not configured in Phase 2 — no
 * provider credentials are present in this environment. Once an email service
 * (e.g. Resend/Postmark) is configured, generate a single-use, time-limited
 * reset token here and email a link to /reset-password?token=… . Until then no
 * reset link is actually sent.
 */

import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { parseJson, route } from "@/lib/api";
import { clientKey, enforceRateLimit } from "@/lib/rate-limit";
import { forgotPasswordSchema } from "@/lib/validation";

export const POST = route(async (request: Request) => {
  enforceRateLimit(`forgot-password:${clientKey(request)}`, 3, 15 * 60 * 1000);

  const { email } = await parseJson(request, forgotPasswordSchema);

  // Look the account up so a reset token can be generated once email exists.
  // The result is intentionally not reflected in the response.
  await prisma.user.findUnique({ where: { email }, select: { id: true } });

  if (process.env.NODE_ENV !== "production") {
    console.info(`[forgot-password] reset requested for ${email}`);
  }

  return NextResponse.json({
    message:
      "If an account with this email exists, a reset link has been sent",
  });
});
