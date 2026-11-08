/**
 * Saved Destinations component for Wonderlust.
 *
 * Fetches the authenticated user's saved destinations from the backend API.
 *
 * Requires authentication.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Alert, AlertTitle, AlertDescription } from "@/ui/Alert";
import { AlertCircle } from "lucide-react";
import { DestinationCard } from "@/components/destinations/DestinationCard";
import type { Destination } from "@/types";

interface SavedDestination {
  id: string;
  destination: Destination;
}

export function SavedDestinations() {
  const { data: session } = useSession();
  const [savedDestinations, setSavedDestinations] = useState<SavedDestination[]>([]);

  // Helper to get a destination's continent name
  const getContinentLabel = (continent: string) => {
    const labels: Record<string, string> = {
      "asia": "Asia",
      "europe": "Europe",
      "north-america": "North America",
      "south-america": "South America",
      "africa": "Africa",
      "oceania": "Oceania",
    };
    return labels[continent] || continent;
  };

  // Format date helper
  const formatDate = (date: string | Date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString();
  };

  // Convert a saved destination to the full Destination type
  const convertSavedDestination = (destination: Destination): Destination => ({
    id: destination.id,
    slug: destination.slug,
    name: destination.name,
    country: destination.country,
    continent: destination.continent,
    category: destination.category,
    image: destination.image,
    rating: destination.rating,
    reviewCount: destination.reviewCount,
    summary: destination.summary,
    bestTimeToVisit: destination.bestTimeToVisit,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSaved = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Scoped server-side to the authenticated user via the session cookie.
      const response = await fetch("/api/saved/destinations");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch saved destinations");
      }

      const data = await response.json();
      setSavedDestinations(data.destinations || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch saved destinations");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Saved Destinations</h2>
        <a
          href="/explore"
          className="text-sm font-semibold text-wonderlust-primary hover:underline"
        >
          Explore all
        </a>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading saved destinations...</p>}

      {error && (
        <Alert variant="error">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {savedDestinations.length > 0 ? (
            savedDestinations.map((saved) => (
              <DestinationCard
                key={saved.destination.id}
                destination={convertSavedDestination(saved.destination)}
              />
            ))
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No saved destinations</AlertTitle>
              <AlertDescription>
                You haven&apos;t saved any destinations yet. Start exploring and
                save your favorites!
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
