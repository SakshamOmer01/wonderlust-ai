/**
 * Registration endpoint for Wonderlust.
 *
 * POST /api/auth/register
 *
 * Body: { email, password, confirmPassword, name? }
 *
 * Security:
 *   - zod validation (email format, password length, matching confirmation)
 *   - rate limited per client IP to slow bulk account creation
 *   - bcrypt hashing (cost 12); the hash is never returned
 *   - duplicate emails return 409 without revealing database internals
 */
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";
import { errorResponse, parseJson, route } from "@/lib/api";
import { clientKey, enforceRateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validation";
export const POST = route(async (request) => {
    enforceRateLimit(`register:${clientKey(request)}`, 10, 15 * 60 * 1000);
    const { email, password, name } = await parseJson(request, registerSchema);
    const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
    });
    if (existing) {
        return errorResponse("An account with this email already exists", 409, "EMAIL_IN_USE");
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const displayName = name?.trim() || email.split("@")[0];
    try {
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name: displayName,
                role: "user",
                profile: { create: {} },
            },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                role: true,
                createdAt: true,
            },
        });
        return NextResponse.json({ message: "Account created successfully", user }, { status: 201 });
    }
    catch (error) {
        // Handle the race between the uniqueness check above and the insert.
        if (error instanceof Error &&
            (error.code === "P2002" || error.code === "P2025")) {
            return errorResponse("An account with this email already exists", 409, "EMAIL_IN_USE");
        }
        throw error;
    }
});
