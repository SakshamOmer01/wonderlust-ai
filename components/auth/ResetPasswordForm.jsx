"use client";
/**
 * Set-a-new-password form.
 *
 * Reads the single-use token from the query string and submits it with the new
 * password to POST /api/auth/reset-password.
 */
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Card, CardContent } from "@/ui/Card";
import { Alert, AlertTitle, AlertDescription } from "@/ui/Alert";
import { cn } from "@/lib/utils";
export function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") ?? "";
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const inputClass = cn("w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pl-10 text-sm text-slate-900", "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-wonderlust-primary/30", "focus:border-wonderlust-primary transition-all duration-200");
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (!token) {
            setError("This page needs a reset link. Please request a new one.");
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password, confirmPassword }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(data.error ?? "We couldn't reset your password. Please try again.");
                return;
            }
            setSuccess(true);
            setPassword("");
            setConfirmPassword("");
            router.push("/login?reset=success");
        }
        catch {
            setError("Network error. Please check your connection and try again.");
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50/40 px-4 py-12">
      <div className="relative w-full max-w-md">
        <div className="absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-wonderlust-primary/10 blur-2xl"/>

        <Card className="relative p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-wonderlust-primary text-white shadow-lg">
              <Sparkles className="h-6 w-6"/>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">
              Choose a new password
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Your reset link is valid for one use and expires after 30 minutes.
            </p>
          </div>

          <CardContent className="space-y-4">
            {success && (<Alert>
                <CheckCircle2 className="h-4 w-4"/>
                <AlertTitle>Password updated</AlertTitle>
                <AlertDescription>Redirecting you to sign in…</AlertDescription>
              </Alert>)}

            {error && (<Alert variant="error">
                <AlertCircle className="h-4 w-4"/>
                <AlertTitle>Couldn&apos;t reset password</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>)}

            {!token && (<Alert variant="error">
                <AlertCircle className="h-4 w-4"/>
                <AlertTitle>Missing reset token</AlertTitle>
                <AlertDescription>
                  Open the link from your reset email, or{" "}
                  <a href="/forgot" className="font-semibold text-red-500 hover:underline">
                    request a new one
                  </a>
                  .
                </AlertDescription>
              </Alert>)}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-medium text-slate-700">
                  New password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
                  <Input id="new-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass}/>
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? (<EyeOff className="h-4 w-4"/>) : (<Eye className="h-4 w-4"/>)}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirm-new-password" className="text-sm font-medium text-slate-700">
                  Confirm new password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
                  <Input id="confirm-new-password" name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Repeat your new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClass}/>
                </div>
              </div>

              <Button type="submit" className="w-full" isLoading={isLoading} disabled={!token || success}>
                Update password
              </Button>

              <p className="pt-2 text-center text-sm text-slate-500">
                Remembered it?{" "}
                <a href="/login" className="font-semibold text-wonderlust-primary hover:underline">
                  Back to sign in
                </a>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>);
}
