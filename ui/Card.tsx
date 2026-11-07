import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-white text-slate-900 shadow-sm transition-shadow duration-200 hover:shadow-lg",
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children?: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div
      className={cn(
        "px-5 pt-5 pb-2",
        "border-b border-border",
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3
      className={cn(
        "text-lg font-semibold tracking-tight text-slate-900",
        className
      )}
    >
      {children}
    </h3>
  );
}

interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return (
    <p className={cn("text-sm text-slate-500", className)}>{children}</p>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn("px-5 pb-5", className)}>{children}</div>;
}

interface CardFooterProps {
  children?: ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-5 pb-5",
        "border-t border-border",
        "pt-4",
        className
      )}
    >
      {children}
    </div>
  );
}
