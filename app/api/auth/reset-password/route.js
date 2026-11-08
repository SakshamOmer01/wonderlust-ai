/**
 * Password reset completion endpoint.
 *
 * POST /api/auth/reset-password
 *
 * Body: { token, password, confirmPassword }
 *
 * Consumes a single-use reset token and stores a new bcrypt password hash.
 *
 * Security:
 *   - Token is looked up by SHA-256 hash and claimed atomically, so it cannot
 *     be replayed even by concurrent requests.
 *   - Expired, unknown and already-used tokens all receive the same generic
 *     error, so the endpoint reveals nothing about token state.
 *   - All other outstanding tokens for the account are invalidated.
 *   - Rate limited per client IP.
 */
import { NextResponse } from "next/server";
import { HttpError, parseJson, route } from "@/lib/api";
import { clientKey, enforceRateLimit } from "@/lib/rate-limit";
import { resetPasswordSchema } from "@/lib/validation";
import { claimPasswordResetToken } from "@/lib/password-reset";
import { setUserPassword } from "@/lib/passwords";
const INVALID_TOKEN_MESSAGE = "This reset link is invalid or has expired. Please request a new one.";
export const POST = route(async (request) => {
    enforceRateLimit(`reset-password:${clientKey(request)}`, 5, 15 * 60 * 1000);
    const { token, password } = await parseJson(request, resetPasswordSchema);
    const claim = await claimPasswordResetToken(token);
    if (!claim) {
        throw new HttpError(INVALID_TOKEN_MESSAGE, 400, "INVALID_RESET_TOKEN");
    }
    // Stores the new bcrypt hash and bumps the credential version, which
    // immediately revokes every session issued before this reset.
    await setUserPassword(claim.userId, password);
    return NextResponse.json({
        message: "Password updated. You can now sign in with your new password.",
    });
});
