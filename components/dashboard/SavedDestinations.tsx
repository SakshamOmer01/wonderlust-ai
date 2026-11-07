import { DestinationCard } from "./../destinations/DestinationCard";
import { Button } from "@/ui/Button";
import { Plus, Heart, X } from "lucide-react";
import { EmptyState } from "@/ui/EmptyState";
import { Card } from "@/ui/Card";
import type { Destination } from "@/types";

const MOCK_SAVED: Destination[] = [
  {
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
  {
    id: "kyoto",
    name: "Kyoto",
    slug: "kyoto",
    country: "Japan",
    continent: "asia",
    category: "cultural",
    image: "https://images.unsplash.com/photo-1561839561-b6d35e047228?w=1600&q=80",
    rating: 4.9,
    reviewCount: 1967,
    summary: "A city of ten thousand temples, ancient gardens and timeless traditions.",
    bestTimeToVisit: "March - May, October - November",
  },
  {
    id: "patagonia",
    name: "Patagonia",
    slug: "patagonia",
    country: "Argentina",
    continent: "south-america",
    category: "adventure",
    image: "https://images.unsplash.com/photo-1515259625813-8c28b4c95707?w=1600&q=80",
    rating: 4.8,
    reviewCount: 1198,
    summary: "Towering peaks, glacier-laced lakes and windswept steppes where wildness still feels untamed.",
    bestTimeToVisit: "October - April",
  },
];

export function SavedDestinations() {
  if (MOCK_SAVED.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <EmptyState
            icon={<Heart className="h-12 w-12 text-slate-300" />}
            title="No saved destinations"
            description="Tap the heart on any destination to save it here."
            action={
              <Button variant="outline" leftIcon={<Plus />}>
                Explore destinations
              </Button>
            }
          />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-wonderlust-primary/10 text-wonderlust-primary">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Saved</h2>
            <p className="text-sm text-slate-500">
              {MOCK_SAVED.length} destinations saved
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" leftIcon={<Plus />}>
          Add destination
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
        {MOCK_SAVED.map((dest) => (
          <DestinationCard key={dest.id} destination={dest} showAction={false} />
        ))}
      </div>
    </Card>
  );
}
