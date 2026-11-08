/**
 * Change password for the authenticated user.
 *
 * PUT /api/users/password
 *
 * Body: { currentPassword, newPassword, confirmPassword }
 *
 * The current password is required so that a stolen session cookie alone cannot
 * be turned into permanent account access.
 *
 * A password change bumps `User.sessionVersion`, which invalidates every token
 * issued before it — including the caller's. To satisfy "keep me signed in
 * here, sign me out everywhere else", the caller's cookie is re-issued with the
 * new version afterwards, signed so that the client cannot forge that update.
 */

import { NextResponse } from "next/server";

import { HttpError, parseJson, route } from "@/lib/api";
import { requireUser } from "@/lib/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { changePasswordSchema } from "@/lib/validation";
import { setUserPassword, verifyUserPassword } from "@/lib/passwords";
import { unstable_update } from "@/lib/auth";
import { signSessionVersion } from "@/lib/session-version";

export const PUT = route(async (request: Request) => {
  const user = await requireUser();

  // Counted per account, so one user's mistakes cannot lock out a shared IP.
  enforceRateLimit(`change-password:${user.id}`, 5, 15 * 60 * 1000);

  const { currentPassword, newPassword } = await parseJson(request, changePasswordSchema);

  if (!(await verifyUserPassword(user.id, currentPassword))) {
    throw new HttpError(
      "Your current password is incorrect",
      400,
      "INVALID_CURRENT_PASSWORD"
    );
  }

  const sessionVersion = await setUserPassword(user.id, newPassword);

  // Re-issue this browser's token with the new version. Other sessions still
  // carry the old version and are rejected on their next request.
  await unstable_update({
    sessionVersion,
    sessionVersionProof: signSessionVersion(user.id, sessionVersion),
  });

  return NextResponse.json({
    message: "Password updated. Other devices have been signed out.",
  });
});
