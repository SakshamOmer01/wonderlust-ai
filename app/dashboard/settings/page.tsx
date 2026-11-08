/**
 * Account settings page.
 *
 * Requires authentication. Shows who is signed in and hosts the form for
 * changing the password while keeping this session alive.
 */

import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth.server";
import type { User as AppUser } from "@/types";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChangePasswordForm } from "@/components/dashboard/ChangePasswordForm";
import { Card, CardContent } from "@/ui/Card";
import { Alert, AlertTitle, AlertDescription } from "@/ui/Alert";
import { AlertCircle, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Settings | Wonderlust",
  description: "Manage your Wonderlust account and password",
};

export default async function SettingsPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50/40 px-4 py-12">
        <Alert variant="error" className="w-full max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unauthorized</AlertTitle>
          <AlertDescription>
            Please{" "}
            <Link href="/login" className="font-semibold text-red-500 hover:underline">
              sign in
            </Link>{" "}
            to manage your account.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!dbUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <Alert variant="error" className="w-full max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Account not found</AlertTitle>
          <AlertDescription>
            Your session is no longer valid. Please{" "}
            <Link href="/login" className="font-semibold text-red-500 hover:underline">
              sign in again
            </Link>
            .
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const user: AppUser = {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    avatar: dbUser.avatar,
    role: dbUser.role,
    createdAt: dbUser.createdAt.toISOString(),
    updatedAt: dbUser.updatedAt.toISOString(),
  };

  const memberSince = new Date(dbUser.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <DashboardLayout user={user}>
      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Account"
          title="Settings"
          description="Manage how you sign in to Wonderlust."
          className="py-8 sm:py-10 lg:py-12"
        />

        <div className="space-y-6">
          <ChangePasswordForm />

          <Card>
            <CardContent className="pt-5">
              <h2 className="text-lg font-semibold text-slate-900">Account</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500">Email</dt>
                  <dd className="text-right font-medium text-slate-900 break-all">
                    {dbUser.email}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500">Name</dt>
                  <dd className="text-right font-medium text-slate-900">
                    {dbUser.name ?? "Not set"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500">Role</dt>
                  <dd className="text-right font-medium capitalize text-slate-900">
                    {dbUser.role}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500">Member since</dt>
                  <dd className="text-right font-medium text-slate-900">{memberSince}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-wonderlust-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
