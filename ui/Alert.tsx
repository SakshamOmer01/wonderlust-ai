import { type ReactNode, type FC } from "react";
import { cn } from "@/lib/utils";

type AlertVariant = "info" | "success" | "warning" | "error";

const variants: Record<AlertVariant, string> = {
  info: "bg-sky-50 border-sky-200 text-sky-800",
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  error: "bg-red-50 border-red-200 text-red-800",
};

const icons: Record<AlertVariant, string> = {
  info: "M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z",
  success: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  warning: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z",
  error: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z",
};

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function Alert({ variant = "info", title, description, children, className }: AlertProps) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border p-4",
        variants[variant],
        className
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white",
          variant === "info" && "text-sky-500",
          variant === "success" && "text-emerald-500",
          variant === "warning" && "text-amber-500",
          variant === "error" && "text-red-500"
        )}
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={icons[variant]} />
        </svg>
      </span>
      <div className="flex-1 text-sm">
        {title && <p className="font-semibold">{title}</p>}
        {description && <p className="mt-0.5 text-slate-600">{description}</p>}
        {children}
      </div>
    </div>
  );
}

interface AlertTitleProps {
  children: ReactNode;
}

export const AlertTitle: FC<AlertTitleProps> = ({ children }) => {
  return <p className="text-sm font-semibold">{children}</p>;
};

interface AlertDescriptionProps {
  children: ReactNode;
}

export const AlertDescription: FC<AlertDescriptionProps> = ({ children }) => {
  return <p className="text-sm text-slate-600">{children}</p>;
};
