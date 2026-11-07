import { HeroSection } from "@/components/HeroSection";
import { Stats } from "@/components/analytics/Stats";
import { DestinationSearch } from "@/components/DestinationSearch";
import { DestinationGrid } from "@/components/destinations/DestinationGrid";
import { FeaturedTrips } from "@/components/trips/FeaturedTrips";
import { TravelCategories } from "@/components/travel-categories/TravelCategories";
import { WhyChoose } from "@/components/features/WhyChoose";
import { Testimonials } from "@/components/testimonials/Testimonials";
import { Footer } from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <>
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
          <DestinationGrid destinations={[]} showAction />
        </div>
      </div>

      <FeaturedTrips />

      <TravelCategories />

      <WhyChoose />

      <Testimonials />

      <Footer />
    </>
  );
}
