/**
 * My Trips component for Wonderlust.
 *
 * Fetches the authenticated user's trips from the backend API.
 *
 * Requires authentication.
 */
"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { TripCard } from "./TripCard";
import { Alert, AlertTitle, AlertDescription } from "@/ui/Alert";
import { AlertCircle } from "lucide-react";
export function MyTrips() {
    const { data: session } = useSession();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchTrips = useCallback(async () => {
        if (!session?.user?.id) {
            setLoading(false);
            return;
        }
        try {
            // The session cookie identifies the user; no user ID is sent from the
            // client. `mine=1` scopes the query to the authenticated account.
            const response = await fetch("/api/trips?mine=1");
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to fetch trips");
            }
            const data = await response.json();
            setTrips(data.trips || []);
            setError(null);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch trips");
        }
        finally {
            setLoading(false);
        }
    }, [session]);
    useEffect(() => {
        fetchTrips();
    }, [fetchTrips]);
    return (<div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">My Trips</h2>
        <a href="/trips" className="text-sm font-semibold text-wonderlust-primary hover:underline">
          View all
        </a>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading trips...</p>}

      {error && (<Alert variant="error">
          <AlertCircle className="h-4 w-4"/>
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>)}

      {!loading && !error && (<div className="space-y-4">
          {trips.length > 0 ? (trips.map((trip) => <TripCard key={trip.id} trip={trip}/>)) : (<Alert>
              <AlertCircle className="h-4 w-4"/>
              <AlertTitle>No trips yet</AlertTitle>
              <AlertDescription>
                You haven&apos;t created any trips yet. Start planning your next
                adventure!
              </AlertDescription>
            </Alert>)}
        </div>)}
    </div>);
}
