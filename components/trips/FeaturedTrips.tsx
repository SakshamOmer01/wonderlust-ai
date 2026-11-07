import { TRIPS, DESTINATIONS } from "@/lib/data";
import { TripCard } from "./TripCard";

/** Build a lookup from destination id -> destination for the featured trips. */
const destMap = new Map(DESTINATIONS.map((d) => [d.id, d]));

export function FeaturedTrips() {
  return (
    <section className="bg-white mt-24 sm:mt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold text-wonderlust-primary uppercase tracking-widest">
              Featured trips
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Hand-picked experiences
            </h2>
            <p className="mt-3 text-lg text-slate-500 max-w-xl">
              Each trip is fully curated, including transfers, accommodation,
              activities and 24/7 support from our travel experts.
            </p>
          </div>
        </div>

        {TRIPS.length > 0 && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            {TRIPS.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
