import { cn } from "@/lib/utils";

interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({ label = "Loading", className }: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16",
        className
      )}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-wonderlust-primary border-t-transparent" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}
