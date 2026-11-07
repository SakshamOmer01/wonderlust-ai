import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  message?: string;
  retry?: () => void;
  className?: string;
}

export function ErrorState({
  message,
  retry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500">
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-red-800">Something went wrong</h3>
      {message && (
        <p className="text-sm text-red-600">{message}</p>
      )}
      {retry && (
        <button
          type="button"
          onClick={retry}
          className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
