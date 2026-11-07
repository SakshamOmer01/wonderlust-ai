import Link from "next/link";
import { Card } from "@/ui/Card";
import { Button, type ButtonProps } from "@/ui/Button";
import { Star, MapPin, Calendar, Users, Clock, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Trip } from "@/types";

interface TripCardProps {
  trip: Trip;
}

export function TripCard({ trip }: TripCardProps) {
  const featured = trip.featured;

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="relative h-44 overflow-hidden bg-slate-200">
        <img
          src={trip.image}
          alt={trip.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        {featured && (
          <span className="absolute left-3 top-3 rounded-full bg-wonderlust-primary/90 px-3 py-1 text-xs font-semibold text-white">
            Featured
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      <div className="p-4 flex-1 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900 leading-snug">
            {trip.title}
          </h3>
          <span className="flex items-center gap-1 text-sm font-semibold text-slate-400">
            <Calendar className="h-4 w-4" />
            {trip.durationDays} days
          </span>
        </div>

        <p className="flex items-center gap-2 text-sm text-slate-500">
          <MapPin className="h-4 w-4" />
          {trip.destination.country}
        </p>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {trip.travelers} travellers
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {trip.startDate} - {trip.endDate}
          </span>
        </div>

        <div className="flex items-center gap-1 text-sm font-semibold text-amber-500">
          <Star className="h-4 w-4 fill-current" />
          {trip.destination.rating}
        </div>
      </div>

      <div className="flex border-t border-border px-4 py-3 pt-2">
        <div className="text-lg font-bold text-slate-900">
          {formatCurrency(trip.price)}
        </div>
        <Button
          className="ml-auto"
          size="sm"
          asChild
        >
          <Link href={`/trips/${trip.slug}`}>View trip</Link>
        </Button>
      </div>
    </Card>
  );
}
