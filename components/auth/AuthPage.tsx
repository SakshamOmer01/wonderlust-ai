"use client";

import { useState } from "react";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    // NOTE: Backend auth endpoint replaces this simulated submission.
    setTimeout(() => {
      setIsSubmitting(false);
      // In a production app, redirect to /dashboard after successful auth.
    }, 1200);
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
        onClick={onSwitchMode}
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
            {mode !== "login" && (
              <>
                <div className="space-y-2">
                  <label htmlFor="auth-email" className="text-sm font-medium text-slate-700">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="auth-email"
                      type="email"
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

                {mode === "register" && (
                  <div className="space-y-2">
                    <label htmlFor="auth-password" className="text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="auth-password"
                        type={showPassword ? "text" : "password"}
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
                )}

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

            <Button
              type="submit"
              className="w-full"
              isLoading={isSubmitting}
            >
              {mode === "login" && "Sign in"}
              {mode === "register" && "Create account"}
              {mode === "forgot" && "Send reset link"}
            </Button>

            {mode === "login" && (
              <div className="flex items-center gap-2 pt-2 text-sm">
                <span className="text-slate-500">Don&apos;t have an account?</span>
                <Button
                  variant="ghost"
                  className="font-semibold text-wonderlust-primary"
                  onClick={onSwitchMode}
                >
                  Sign up
                </Button>
              </div>
            )}

            {mode === "register" && (
              <div className="flex items-center gap-2 pt-2 text-sm">
                <span className="text-slate-500">Already have an account?</span>
                <Button
                  variant="ghost"
                  className="font-semibold text-wonderlust-primary"
                  onClick={onSwitchMode}
                >
                  Sign in
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
