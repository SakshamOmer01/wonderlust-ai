import {
  forwardRef,
  type SelectHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
  hideError?: boolean;
  icon?: ReactNode;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, label, options, error, hideError, id, icon, ...props },
    ref
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-") ?? undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            {label}
            {icon && <span className="ml-1.5 inline-flex">{icon}</span>}
          </label>
        )}
        <select
          id={inputId}
          ref={ref}
          className={cn(
            "w-full appearance-none rounded-xl border border-border bg-white px-4 py-2.5 pr-8 text-sm text-slate-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-wonderlust-primary/30 focus:border-wonderlust-primary",
            "disabled:opacity-50 disabled:pointer-events-none",
            error && "border-red-400 focus:ring-red-400/30 focus:border-red-400",
            className
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            error && !hideError ? `${inputId}-error` : undefined
          }
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && !hideError && (
          <p id={`${inputId}-error`} className="mt-1 text-xs text-red-500">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
export type { SelectProps };
