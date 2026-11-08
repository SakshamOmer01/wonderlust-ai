/**
 * Dashboard layout wrapper for Wonderlust.
 *
 * The document shell (html/body), site navigation and footer are provided by
 * the root layout, so this component only adds dashboard-specific spacing.
 */
export function DashboardLayout({ children }) {
    return <div className="min-h-screen bg-slate-50 pt-20">{children}</div>;
}
