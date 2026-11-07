import { DestinationCard } from "./DestinationCard";
import type { Destination } from "@/types";

interface DestinationGridProps {
  destinations: Destination[];
  showAction?: boolean;
  className?: string;
}

export function DestinationGrid({
  destinations,
  showAction = true,
  className,
}: DestinationGridProps) {
  if (destinations.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-lg font-medium text-slate-800">No destinations found</p>
        <p className="text-sm text-slate-500 mt-1">
          Try adjusting your search or filters.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 ${className}`}
    >
      {destinations.map((destination) => (
        <DestinationCard
          key={destination.id}
          destination={destination}
          showAction={showAction}
        />
      ))}
    </div>
  );
}
