import { cn } from "@/lib/utils";
export function FeatureCard({ icon, title, description, className, }) {
    return (<div className={cn("group rounded-2xl border border-border bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1", className)}>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100 text-teal-600 transition-transform duration-300 group-hover:scale-110 group-hover:bg-teal-500 group-hover:text-white">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
    </div>);
}
