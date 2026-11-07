import { TripCard } from "./TripCard";
import { EmptyState } from "@/ui/EmptyState";
import { Button } from "@/ui/Button";
import { Map, Plus } from "lucide-react";
import type { Trip } from "@/types";

const MOCK_TRIPS: Trip[] = [
  {
    id: "t1",
    title: "Bali Highlands Retreat",
    slug: "bali-highlands-retreat",
    destination: {
      id: "dalat-vietnam",
      name: "Da Lat",
      slug: "dalat-vietnam",
      country: "Vietnam",
      continent: "asia",
      category: "mountain",
      image: "https://images.unsplash.com/photo-1503349511420-432254252ad6?w=1600&q=80",
      rating: 4.8,
      reviewCount: 1240,
      summary: "A misty highland paradise known as the City of Eternal Spring.",
      bestTimeToVisit: "February - August",
    },
    destinationId: "dalat-vietnam",
    startDate: "2027-03-12",
    endDate: "2027-03-26",
    travelers: 2,
    budget: "luxury",
    durationDays: 14,
    image: "https://images.unsplash.com/photo-1503349511420-432254252ad6?w=1600&q=80",
    price: 4850,
    featured: true,
    createdAt: "2025-03-01",
  },
  {
    id: "t2",
    title: "Mauritius Island Hopping",
    slug: "mauritius-island-hopping",
    destination: {
      id: "mauritius",
      name: "Mauritius",
      slug: "mauritius",
      country: "Mauritius",
      continent: "africa",
      category: "beach",
      image: "https://images.unsplash.com/photo-1537996194471-188b87376b25?w=1600&q=80",
      rating: 4.9,
      reviewCount: 2103,
      summary: "A tropical gem where turquoise lagoons and coral reefs meet French colonial charm.",
      bestTimeToVisit: "October - April",
    },
    destinationId: "mauritius",
    startDate: "2026-12-02",
    endDate: "2026-12-16",
    travelers: 3,
    budget: "standard",
    durationDays: 14,
    image: "https://images.unsplash.com/photo-1537996194471-188b87376b25?w=1600&q=80",
    price: 2980,
    createdAt: "2025-01-15",
  },
];

export function MyTrips() {
  if (MOCK_TRIPS.length === 0) {
    return (
      <EmptyState
        icon={<Map className="h-12 w-12 text-slate-300" />}
        title="No trips yet"
        description="You haven't planned any trips with Wonderlust. Create your first trip to get started."
        action={
          <Button leftIcon={<Plus />}>Create your first trip</Button>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {MOCK_TRIPS.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </div>
  );
}
