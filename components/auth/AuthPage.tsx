"use client";

import { useState } from "react";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Card, CardContent } from "@/ui/Card";
import { Alert, AlertTitle, AlertDescription } from "@/ui/Alert";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

type Mode = "login" | "register" | "forgot";

interface AuthPageProps {
  mode: Mode;
  onSwitchMode?: () => void;
}

export function AuthPage({ mode, onSwitchMode }: AuthPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const searchParams = useSearchParams();

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Enter a valid email address";

    if (!password) next.password = "Password is required";
    else if (password.length < 8)
      next.password = "Password must be at least 8 characters";

    if (mode === "register" && password !== confirmPassword) {
      next.confirmPassword = "Passwords do not match";
    }

    setFormErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      if (mode === "login") {
        const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
          callbackUrl,
        });

        if (result?.error) {
          setErrors({ submit: "Invalid email or password" });
        } else if (result?.ok) {
          router.push(callbackUrl);
          router.refresh();
        }
      } else if (mode === "register") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            confirmPassword,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setErrors({ submit: data.error || "Registration failed" });
        } else {
          router.push("/login?registered=true");
        }
      } else if (mode === "forgot") {
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
          setErrors({ submit: data.error || "Failed to send reset link" });
        } else {
          router.push(`/login?reset=success`);
        }
      }
    } catch {
      setErrors((prev) => ({ ...prev, submit: "An unexpected error occurred" }));
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (field: string) =>
    cn(
      "w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-wonderlust-primary/30 focus:border-wonderlust-primary transition-all duration-200",
      errors[field] && "border-red-400 focus:ring-red-400/30 focus:border-red-400",
      !errors[field] && !formErrors[field] && "border-slate-200"
    );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50/40 px-4 py-12">
      <Button
        variant="ghost"
        className="absolute left-4 top-4"
        onClick={onSwitchMode ?? (() => router.push("/"))}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <div className="relative w-full max-w-md">
        {/* Decorative glass card */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full bg-wonderlust-primary/10 blur-2xl" />

        <Card className="relative p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-wonderlust-primary text-white shadow-lg">
              <Sparkles className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">
              {mode === "login" && "Welcome back"}
              {mode === "register" && "Create your account"}
              {mode === "forgot" && "Reset your password"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {mode === "login"
                ? "Sign in to continue your journey"
                : mode === "register"
                ? "Start planning your next adventure"
                : "Enter your email to receive a reset link"}
            </p>
          </div>

          {mode !== "login" && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Security</AlertTitle>
              <AlertDescription>
                {mode === "forgot" && "We won’t share your email with anyone."}
                {mode === "register" && "Your account helps us personalise your trips."}
              </AlertDescription>
            </Alert>
          )}

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <label htmlFor="auth-email" className="text-sm font-medium text-slate-700">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="auth-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(inputClass("email"), "pl-10")}
                    error={errors.email}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              {mode !== "forgot" && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="auth-password" className="text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="auth-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete={mode === "login" ? "current-password" : "new-password"}
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={cn(inputClass("password"), "pl-10")}
                        error={errors.password}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                    )}
                  </div>

                {mode === "register" && (
                  <div className="space-y-2">
                    <label htmlFor="auth-confirm-password" className="text-sm font-medium text-slate-700">
                      Confirm password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="auth-confirm-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Repeat your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={cn(inputClass("confirmPassword"), "pl-10")}
                        error={errors.confirmPassword}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>
                )}
              </>
            )}

            {mode === "forgot" && (
              <Alert variant="info" className="mb-4">
                <Mail className="h-4 w-4" />
                <AlertTitle>Check your inbox</AlertTitle>
                <AlertDescription>
                  We&apos;ll send a password reset link to your email within a few minutes.
                </AlertDescription>
              </Alert>
            )}

            {errors.submit && (
              <Alert variant="error">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Something went wrong</AlertTitle>
                <AlertDescription>{errors.submit}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
            >
              {mode === "login" && "Sign in"}
              {mode === "register" && "Create account"}
              {mode === "forgot" && "Send reset link"}
            </Button>

            {mode === "login" && (
              <div className="flex items-center gap-2 pt-2 text-sm">
                <span className="text-slate-500">Don&apos;t have an account?</span>
                <Button
                  type="button"
                  variant="ghost"
                  className="font-semibold text-wonderlust-primary"
                  onClick={onSwitchMode ?? (() => router.push("/register"))}
                >
                  Sign up
                </Button>
                <a
                  href="/forgot"
                  className="ml-auto text-sm font-medium text-slate-500 hover:text-wonderlust-primary"
                >
                  Forgot password?
                </a>
              </div>
            )}

              {mode === "register" && (
                <div className="flex items-center gap-2 pt-2 text-sm">
                  <span className="text-slate-500">Already have an account?</span>
                  <Button
                    type="button"
                    variant="ghost"
                    className="font-semibold text-wonderlust-primary"
                    onClick={onSwitchMode ?? (() => router.push("/login"))}
                  >
                    Sign in
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
