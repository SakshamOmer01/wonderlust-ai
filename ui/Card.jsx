import { cn } from "@/lib/utils";
export function Card({ children, className }) {
    return (<div className={cn("rounded-2xl border border-border bg-white text-slate-900 shadow-sm transition-shadow duration-200 hover:shadow-lg", className)}>
      {children}
    </div>);
}
export function CardHeader({ children, className }) {
    return (<div className={cn("px-5 pt-5 pb-2", "border-b border-border", className)}>
      {children}
    </div>);
}
export function CardTitle({ children, className }) {
    return (<h3 className={cn("text-lg font-semibold tracking-tight text-slate-900", className)}>
      {children}
    </h3>);
}
export function CardDescription({ children, className }) {
    return (<p className={cn("text-sm text-slate-500", className)}>{children}</p>);
}
export function CardContent({ children, className }) {
    return <div className={cn("px-5 pb-5", className)}>{children}</div>;
}
export function CardFooter({ children, className }) {
    return (<div className={cn("flex flex-col gap-3 px-5 pb-5", "border-t border-border", "pt-4", className)}>
      {children}
    </div>);
}
