import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "text-center",
        "px-4 py-12 sm:py-16 lg:py-20",
        "max-w-3xl mx-auto",
        className
      )}
    >
      {eyebrow && (
        <p className="text-sm font-semibold text-wonderlust-primary uppercase tracking-widest">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
        {title}
      </h1>
      {description && (
        <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
