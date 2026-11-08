import { STATS } from "@/lib/data";
import { Map, Users, Compass, Star } from "lucide-react";
const ICON_MAP = {
    Map,
    Users,
    Compass,
    Star,
};
export function Stats() {
    return (<section className="bg-white border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {STATS.map((stat) => {
            const Icon = ICON_MAP[stat.icon] ?? Map;
            return (<div key={stat.label}>
                <p className="text-3xl sm:text-4xl font-bold text-slate-900">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
              </div>);
        })}
        </div>
      </div>
    </section>);
}
