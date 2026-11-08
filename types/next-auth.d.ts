/**
 * Auth.js (NextAuth v5) type augmentation.
 *
 * Adds the Wonderlust-specific fields we attach to the session, user and JWT
 * so that `session.user.id`, `session.user.role`, `session.sessionVersion` and
 * `token.sv` are typed.
 */

import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
    /** Credential version this session was issued with. */
    sessionVersion: number;
  }

  interface User {
    role?: string;
    /** Credential version at sign-in; bumped when the password changes. */
    sessionVersion?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    /** Credential version (`User.sessionVersion`) captured at sign-in. */
    sv?: number;
  }
}
