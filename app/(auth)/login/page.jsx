/**
 * Login page for Wonderlust.
 *
 * Uses the shared AuthPage component, which signs in through Auth.js
 * (`signIn("credentials")`) and therefore sets a real session cookie.
 */
import { Suspense } from "react";
import { AuthPage } from "@/components/auth/AuthPage";
export const metadata = {
    title: "Sign in | Wonderlust",
    description: "Sign in to your Wonderlust account.",
};
// The form reads `callbackUrl` from the query string, so render per request.
export const dynamic = "force-dynamic";
export default function LoginPage() {
    return (<Suspense fallback={null}>
      <AuthPage mode="login"/>
    </Suspense>);
}
