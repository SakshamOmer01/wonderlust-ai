/**
 * Forgot password page for Wonderlust.
 *
 * Submits a reset request to POST /api/auth/forgot-password. The endpoint
 * always answers generically so accounts cannot be enumerated.
 */

import { Suspense } from "react";
import { Metadata } from "next";
import { AuthPage } from "@/components/auth/AuthPage";

export const metadata: Metadata = {
  title: "Reset password | Wonderlust",
  description: "Request a password reset link for your Wonderlust account.",
};

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <AuthPage mode="forgot" />
    </Suspense>
  );
}
