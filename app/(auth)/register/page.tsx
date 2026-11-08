/**
 * Registration page for Wonderlust.
 *
 * Uses the shared AuthPage component, which creates the account through
 * POST /api/auth/register and then sends the user to the login page.
 */

import { Suspense } from "react";
import { Metadata } from "next";
import { AuthPage } from "@/components/auth/AuthPage";

export const metadata: Metadata = {
  title: "Create account | Wonderlust",
  description: "Create your Wonderlust account and start planning trips.",
};

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <AuthPage mode="register" />
    </Suspense>
  );
}
