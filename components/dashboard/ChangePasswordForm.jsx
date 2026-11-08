"use client";
/**
 * Change-password form for the account settings page.
 *
 * Submits to PUT /api/users/password, which verifies the current password,
 * rotates the hash and signs out every other device. The calling browser keeps
 * its session because the endpoint re-issues this cookie with the new
 * credential version.
 */
import { useState } from "react";
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Card, CardContent } from "@/ui/Card";
import { Alert, AlertTitle, AlertDescription } from "@/ui/Alert";
import { cn } from "@/lib/utils";
const inputClass = cn("w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pl-10 pr-11 text-sm text-slate-900", "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-wonderlust-primary/30", "focus:border-wonderlust-primary transition-all duration-200");
export function ChangePasswordForm() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [reveal, setReveal] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [formError, setFormError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const validate = () => {
        const errors = {};
        if (!currentPassword) {
            errors.currentPassword = "Enter your current password";
        }
        if (newPassword.length < 8) {
            errors.newPassword = "Password must be at least 8 characters";
        }
        else if (newPassword.length > 72) {
            errors.newPassword = "Password must be 72 characters or fewer";
        }
        if (!confirmPassword) {
            errors.confirmPassword = "Confirm your new password";
        }
        else if (confirmPassword !== newPassword) {
            errors.confirmPassword = "Passwords do not match";
        }
        return errors;
    };
    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError(null);
        setSuccess(false);
        const errors = validate();
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0)
            return;
        setIsLoading(true);
        try {
            const response = await fetch("/api/users/password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                const code = typeof data.code === "string" ? data.code : "";
                if (code === "INVALID_CURRENT_PASSWORD") {
                    setFieldErrors({ currentPassword: "That password is not correct" });
                }
                else if (response.status === 401) {
                    setFormError("Your session has expired. Please sign in again.");
                }
                else if (response.status === 429) {
                    setFormError("Too many attempts. Please wait a few minutes and try again.");
                }
                else {
                    setFormError(data.error ?? "We couldn't update your password. Please try again.");
                }
                return;
            }
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setFieldErrors({});
            setSuccess(true);
        }
        catch {
            setFormError("Network error. Please check your connection and try again.");
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<Card>
      <CardContent className="pt-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-wonderlust-primary/10 text-wonderlust-primary">
            <KeyRound className="h-5 w-5"/>
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Password</h2>
            <p className="mt-1 text-sm text-slate-500">
              Changing your password signs you out on every other device. This
              browser stays signed in.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {success && (<Alert variant="success">
              <CheckCircle2 className="h-4 w-4"/>
              <AlertTitle>Password updated</AlertTitle>
              <AlertDescription>
                Other devices have been signed out. Use your new password next time.
              </AlertDescription>
            </Alert>)}

          {formError && (<Alert variant="error">
              <AlertCircle className="h-4 w-4"/>
              <AlertTitle>Couldn&apos;t update password</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>)}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <label htmlFor="current-password" className="text-sm font-medium text-slate-700">
                Current password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
                <Input id="current-password" name="currentPassword" type={reveal ? "text" : "password"} autoComplete="current-password" placeholder="Your existing password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} error={fieldErrors.currentPassword} hideError className={cn(inputClass, fieldErrors.currentPassword && "border-red-400")} aria-describedby={fieldErrors.currentPassword ? "current-password-error" : undefined}/>
                <button type="button" onClick={() => setReveal((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label={reveal ? "Hide passwords" : "Show passwords"}>
                  {reveal ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                </button>
              </div>
              {fieldErrors.currentPassword && (<p id="current-password-error" className="text-xs text-red-500">
                  {fieldErrors.currentPassword}
                </p>)}
            </div>

            <div className="space-y-2">
              <label htmlFor="new-password" className="text-sm font-medium text-slate-700">
                New password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
                <Input id="new-password" name="newPassword" type={reveal ? "text" : "password"} autoComplete="new-password" placeholder="At least 8 characters" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} error={fieldErrors.newPassword} hideError className={cn(inputClass, fieldErrors.newPassword && "border-red-400")} aria-describedby={fieldErrors.newPassword ? "new-password-error" : undefined}/>
                <button type="button" onClick={() => setReveal((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label={reveal ? "Hide passwords" : "Show passwords"}>
                  {reveal ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                </button>
              </div>
              {fieldErrors.newPassword && (<p id="new-password-error" className="text-xs text-red-500">
                  {fieldErrors.newPassword}
                </p>)}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-new-password" className="text-sm font-medium text-slate-700">
                Confirm new password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
                <Input id="confirm-new-password" name="confirmPassword" type={reveal ? "text" : "password"} autoComplete="new-password" placeholder="Repeat your new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} error={fieldErrors.confirmPassword} hideError className={cn(inputClass, fieldErrors.confirmPassword && "border-red-400")} aria-describedby={fieldErrors.confirmPassword ? "confirm-password-error" : undefined}/>
                <button type="button" onClick={() => setReveal((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label={reveal ? "Hide passwords" : "Show passwords"}>
                  {reveal ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                </button>
              </div>
              {fieldErrors.confirmPassword && (<p id="confirm-password-error" className="text-xs text-red-500">
                  {fieldErrors.confirmPassword}
                </p>)}
            </div>

            <Button type="submit" className="w-full sm:w-auto" isLoading={isLoading}>
              Update password
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>);
}
