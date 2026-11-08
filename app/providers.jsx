"use client";
import { SessionProvider } from "next-auth/react";
/**
 * Client-side providers for Wonderlust.
 *
 * `SessionProvider` exposes the Auth.js session to client components
 * (`useSession`, `signIn`, `signOut`).
 */
export function Providers({ children }) {
    return <SessionProvider>{children}</SessionProvider>;
}
