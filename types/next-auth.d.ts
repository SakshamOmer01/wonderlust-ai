/**
 * Auth.js (NextAuth v5) type augmentation.
 *
 * Adds the Wonderlust-specific fields we attach to the session, user and JWT
 * so that `session.user.id`, `session.user.role` and `token.role` are typed.
 */

import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}
