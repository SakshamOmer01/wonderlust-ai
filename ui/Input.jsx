import { forwardRef } from "react";
import { cn } from "@/lib/utils";
const Input = forwardRef(({ className, label, error, hideError, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-") ?? undefined;
    return (<div className="w-full">
        {label && (<label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
            {label}
          </label>)}
        <input id={inputId} ref={ref} className={cn("w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-wonderlust-primary/30 focus:border-wonderlust-primary transition-all duration-200", "disabled:opacity-50 disabled:pointer-events-none", error && !hideError && "border-red-400 focus:ring-red-400/30 focus:border-red-400", className)} aria-invalid={error ? "true" : "false"} aria-describedby={error && !hideError ? `${inputId}-error` : undefined} {...props}/>
        {error && !hideError && (<p id={`${inputId}-error`} className="mt-1 text-xs text-red-500">
            {error}
          </p>)}
      </div>);
});
Input.displayName = "Input";
export { Input };
