/**
 * Auth.js (NextAuth v5) configuration for Wonderlust.
 *
 * Strategy: email + password (Credentials provider) with bcrypt hashes stored
 * in PostgreSQL, and stateless JWT sessions kept in a signed, HttpOnly cookie.
 *
 * Required environment variables (see .env.example):
 *   DATABASE_URL   — PostgreSQL connection string
 *   AUTH_SECRET    — Signing secret (openssl rand -base64 32)
 *   AUTH_URL       — Canonical deployment URL
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

import { prisma } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Auth.js types credential values as `unknown`; normalise them to
        // strings so the remainder of the function is fully typed.
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });

        // Unknown account, or an account without a local password.
        if (!user?.passwordHash) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "user";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "user";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  trustHost: true,
});
