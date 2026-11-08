import { cn } from "@/lib/utils";
export function EmptyState({ icon, title, description, action, className, }) {
    return (<div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center", className)}>
      {icon && <div className="mb-3 h-12 w-12 text-slate-400">{icon}</div>}
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {description && (<p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>)}
      {action && <div className="mt-5">{action}</div>}
    </div>);
}
