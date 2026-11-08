/**
 * Dashboard layout wrapper for Wonderlust.
 *
 * The document shell (html/body), site navigation and footer are provided by
 * the root layout, so this component only adds dashboard-specific spacing.
 */

import { ReactNode } from "react";
import { User } from "@/types";

interface DashboardLayoutProps {
  children: ReactNode;
  user: User;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return <div className="min-h-screen bg-slate-50 pt-20">{children}</div>;
}
