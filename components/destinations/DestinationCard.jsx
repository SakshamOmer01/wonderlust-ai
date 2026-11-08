import Link from "next/link";
import { Card } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Star, MapPin, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
export function DestinationCard({ destination, showAction = true, className, }) {
    return (<Link href={`/explore/${destination.slug}`} className={cn("block", className)}>
      <Card className="overflow-hidden h-full">
        <div className="relative h-44 overflow-hidden">
          <img src={destination.image} alt={destination.name} className="h-full w-full object-cover transition-transform duration-500 hover:scale-110" loading="lazy"/>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"/>
          <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
            {destination.category}
          </span>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {destination.name}
              </h3>
              <p className="text-sm text-slate-500">{destination.country}</p>
            </div>
            <span className="flex items-center gap-1 text-sm font-semibold text-amber-500">
              <Star className="h-4 w-4 fill-current"/>
              {destination.rating}
            </span>
          </div>

          <p className="text-sm text-slate-500 leading-relaxed">
            {destination.summary}
          </p>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5"/>
              {destination.continent}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5"/>
              {destination.bestTimeToVisit}
            </span>
          </div>
        </div>

        {showAction && (<div className="flex border-t border-border px-4 py-3 pt-0"><Button variant="outline" size="sm" className="w-full" asChild>
              <Link href={`/explore/${destination.slug}`}>
                Explore
              </Link>
            </Button>
          </div>)}
      </Card>
    </Link>);
}
