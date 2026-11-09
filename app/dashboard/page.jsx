export const dynamic = "force-dynamic";
/**
 * Dashboard page for Wonderlust.
 *
 * Server component that fetches real user data from the backend API.
 *
 * Requires authentication. Redirects to /login if the user is not authenticated.
 */
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth.server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TripCard } from "@/components/trips/TripCard";
import { ProfileCard } from "@/components/users/ProfileCard";
import { SavedDestinations } from "@/components/dashboard/SavedDestinations";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert, AlertTitle, AlertDescription } from "@/ui/Alert";
import { AlertCircle, Star, Compass, Plus } from "lucide-react";
export const metadata = {
    title: "Dashboard | Wonderlust",
    description: "Your Wonderlust travel dashboard",
};
export default async function DashboardPage() {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
        return (<div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50/40 px-4 py-12">
        <Alert variant="error" className="w-full max-w-md">
          <AlertCircle className="h-4 w-4"/>
          <AlertTitle>Unauthorized</AlertTitle>
          <AlertDescription>
            Please{" "}
            <a href="/login" className="font-semibold text-red-500 hover:underline">
              sign in
            </a>{" "}
            to access your dashboard.
          </AlertDescription>
        </Alert>
      </div>);
    }
    // Load the full profile from the database so the UI reflects real stored
    // data rather than only the fields carried in the session token.
    const dbUser = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            role: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    if (!dbUser) {
        return (<div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <Alert variant="error" className="w-full max-w-md">
          <AlertCircle className="h-4 w-4"/>
          <AlertTitle>Account not found</AlertTitle>
          <AlertDescription>
            Your session is no longer valid. Please{" "}
            <a href="/login" className="font-semibold text-red-500 hover:underline">
              sign in again
            </a>
            .
          </AlertDescription>
        </Alert>
      </div>);
    }
    const user = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        avatar: dbUser.avatar,
        role: dbUser.role,
        createdAt: dbUser.createdAt.toISOString(),
        updatedAt: dbUser.updatedAt.toISOString(),
    };
    // Fetch user's trips
    const tripsPromise = prisma.trip.findMany({
        where: {
            userId: user.id,
        },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: {
            destination: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    country: true,
                    continent: true,
                    category: true,
                    rating: true,
                    image: true,
                    reviewCount: true,
                    summary: true,
                    bestTimeToVisit: true,
                },
            },
        },
    });
    const trips = await tripsPromise;
    // Aggregate figures for the profile card and stats panel.
    const [tripCount, bookingSpend] = await Promise.all([
        prisma.trip.count({ where: { userId: user.id } }),
        prisma.booking.aggregate({
            where: { userId: user.id, status: { not: "cancelled" } },
            _sum: { totalPrice: true },
        }),
    ]);
    // Convert dates to strings and budget to lowercase for the Trip type
    const tripsWithStrings = trips.map((trip) => ({
        ...trip,
        startDate: trip.startDate.toISOString(),
        endDate: trip.endDate.toISOString(),
        createdAt: trip.createdAt.toISOString(),
        budget: (trip.budget || "standard").toLowerCase(),
    }));
    // Fetch saved destinations
    const savedDestinations = await prisma.savedDestination.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 4,
        include: {
            destination: {
                select: {
                    id: true,
                    slug: true,
                    name: true,
                    country: true,
                    category: true,
                    rating: true,
                    image: true,
                    reviewCount: true,
                },
            },
        },
    });
    // Fetch user's bookings
    const bookings = await prisma.booking.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: {
            trip: {
                select: {
                    id: true,
                    title: true,
                    destinationName: true,
                    startDate: true,
                    endDate: true,
                    travelers: true,
                    budget: true,
                    image: true,
                    price: true,
                },
            },
        },
    });
    // Get user's average rating
    const reviews = await prisma.review.findMany({
        where: { userId: user.id },
        select: { rating: true },
    });
    const averageRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : "0";
    // Get total saved destinations
    const savedCount = await prisma.savedDestination.count({
        where: { userId: user.id },
    });
    return (<DashboardLayout user={user}>
      {/* Hero */}
      <div className="bg-gradient-to-b from-white to-slate-50 px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-wonderlust-primary uppercase tracking-widest">
            Welcome back
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            {user.name
            ? `Hi ${user.name}, ready for your next adventure?`
            : "Ready for your next adventure?"}
          </h1>
          <p className="mt-3 text-lg text-slate-500">
            Here&apos;s an overview of your trips, saved destinations, and profile.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming trips */}
            <div className="space-y-4">
              <PageHeader title="Upcoming Trips" description="Trips you&apos;re planning or have booked" action={<a href="/trips" className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-wonderlust-primary hover:bg-primary/10 transition-colors">
                    <Plus className="h-4 w-4"/>
                    New Trip
                  </a>}/>
              <div className="space-y-4">
                {tripsWithStrings.length > 0 ? (tripsWithStrings.map((trip) => (<TripCard key={trip.id} trip={trip}/>))) : (<Alert>
                    <AlertCircle className="h-4 w-4"/>
                    <AlertTitle>No trips yet</AlertTitle>
                    <AlertDescription>
                      Start planning your next adventure by creating a new trip or
                      saving a destination.
                    </AlertDescription>
                  </Alert>)}
              </div>
            </div>

            {/* Recent bookings */}
            <div className="space-y-4">
              <PageHeader title="Your Bookings" description="Current and past bookings"/>
              <div className="space-y-4">
                {bookings.length > 0 ? (bookings.map((booking) => (<div key={booking.id} className="rounded-xl border border-border bg-white p-4">
                      <div className="flex items-center gap-4">
                        <img src={booking.trip.image} alt={booking.trip.title} className="h-16 w-20 rounded-lg object-cover"/>
                        <div className="flex-1 min-w-0">
                          <h3 className="truncate font-semibold text-slate-900">
                            {booking.trip.title}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {booking.trip.startDate
                ? new Date(booking.trip.startDate).toLocaleDateString()
                : ""}{" "}
                            —{" "}
                            {booking.trip.endDate
                ? new Date(booking.trip.endDate).toLocaleDateString()
                : ""}
                          </p>
                          <p className="text-sm font-medium text-wonderlust-primary">
                            {booking.trip.travelers} traveler{booking.trip.travelers !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">
                            {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(booking.totalPrice)}
                          </p>
                          <p className="text-xs text-slate-500 capitalize">
                            {booking.status}
                          </p>
                        </div>
                      </div>
                    </div>))) : (<Alert>
                    <AlertCircle className="h-4 w-4"/>
                    <AlertTitle>No bookings yet</AlertTitle>
                    <AlertDescription>
                      Book your first trip to see it here.
                    </AlertDescription>
                  </Alert>)}
              </div>
            </div>

            {/* Saved destinations */}
            <SavedDestinations />
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <ProfileCard user={user} stats={{
            trips: tripCount,
            savedDestinations: savedCount,
            reviews: reviews.length,
            averageRating,
            totalSpent: new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
            }).format(bookingSpend._sum.totalPrice ?? 0),
        }}/>

            <div className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Star className="h-4 w-4 text-amber-400"/>
                Your Stats
              </div>
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Your trips</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {tripsWithStrings.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Saved destinations</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {savedCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Your reviews</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {reviews.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Average rating</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {averageRating}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-gradient-to-br from-wonderlust-primary to-wonderlust-teal p-4 text-white shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Compass className="h-4 w-4"/>
                Get Started
              </div>
              <p className="mt-2 text-sm text-white/80">
                Plan your next adventure today.
              </p>
              <button className="mt-3 w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-wonderlust-primary hover:bg-wonderlust-teal hover:text-white transition-colors shadow">
                Explore Destinations
              </button>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>);
}
