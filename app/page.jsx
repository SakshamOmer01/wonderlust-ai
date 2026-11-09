import { HeroSection } from "@/components/HeroSection";
import { Stats } from "@/components/analytics/Stats";
import { DestinationSearch } from "@/components/DestinationSearch";
import { DestinationGrid } from "@/components/destinations/DestinationGrid";
import { FeaturedTrips } from "@/components/trips/FeaturedTrips";
import { TravelCategories } from "@/components/travel-categories/TravelCategories";
import { WhyChoose } from "@/components/features/WhyChoose";
import { Testimonials } from "@/components/testimonials/Testimonials";
import { Footer } from "@/components/layout/Footer";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Ordered by review activity, mirroring "most loved" intent. */
async function mostLovedDestinations() {
    try {
        return await prisma.destination.findMany({
        orderBy: { reviewCount: "desc" },
        take: 8,
        include: {
            reviews: {
                select: { rating: true },
                orderBy: { createdAt: "desc" },
                take: 1,
            },
        },
    });
    } catch {
        return [];
    }
}
export default async function HomePage() {
    const destinations = await mostLovedDestinations();
    return (<>
      <HeroSection />

      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Stats />
        </div>
      </div>

      <section className="bg-white -mt-10 sm:-mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center">
            <DestinationSearch />
          </div>
        </div>
      </section>

      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-wonderlust-primary uppercase tracking-widest">
              Popular
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Most loved destinations
            </h2>
            <p className="mt-3 text-lg text-slate-500">
              Based on millions of real traveller reviews.
            </p>
          </div>
          {destinations.length > 0 ? (<DestinationGrid destinations={destinations} showAction/>) : (<div className="text-center py-16">
              <p className="text-lg font-medium text-slate-800">No destinations found</p>
              <p className="mt-1 text-sm text-slate-500">
                Try adjusting your search or filters.
              </p>
            </div>)}
        </div>
      </div>

      <FeaturedTrips />

      <TravelCategories />

      <WhyChoose />

      <Testimonials />

      <Footer />
    </>);
}
