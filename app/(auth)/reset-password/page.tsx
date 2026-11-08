/**
 * Password reset page.
 *
 * Reached from the emailed link: /reset-password?token=…
 * The form posts the token and new password to /api/auth/reset-password.
 */

import { Suspense } from "react";
import { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Choose a new password | Wonderlust",
  description: "Set a new password for your Wonderlust account.",
};

// The token arrives in the query string, so render per request.
export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
