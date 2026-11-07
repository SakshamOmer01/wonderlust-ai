import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
  type ComponentPropsWithoutRef,
  type ElementType,
  cloneElement,
  type ReactElement,
} from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      asChild,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus-ring active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

    const variants = {
      primary:
        "bg-wonderlust-primary text-white hover:bg-wonderlust-primary/90 shadow-sm hover:shadow",
      secondary:
        "bg-wonderlust-teal text-white hover:bg-wonderlust-teal/90 shadow-sm hover:shadow",
      ghost: "bg-transparent text-wonderlust-primary hover:bg-primary/10",
      outline:
        "border border-border bg-transparent text-slate-700 hover:bg-slate-100",
    };

    const sizes = {
      sm: "text-sm px-3 py-1.5",
      md: "text-sm px-5 py-2.5",
      lg: "text-base px-6 py-3",
    };

    const isChild = asChild === true;

    if (isChild) {
      // asChild: render the children element with Button styling applied
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const child = children as ReactElement<any>;
      return cloneElement(child, {
        className: String(cn(base, variants[variant], sizes[size], className)),
        ...props,
      });
    }

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            role="status"
            aria-hidden="true"
          />
        )}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps };
