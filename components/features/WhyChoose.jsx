"use client";
import { FeatureCard } from "@/components/features/FeatureCard";
import { Star, Shield, Clock, Compass, Globe, Award, } from "lucide-react";
const FEATURES = [
    {
        icon: <Star className="h-5 w-5"/>,
        title: "Expert Curators",
        description: "Every trip is hand-picked by former travel journalists and destination experts who know the hidden gems.",
    },
    {
        icon: <Shield className="h-5 w-5"/>,
        title: "Full-Risk Insurance",
        description: "Comprehensive travel insurance included with every booking, covering medical emergencies, cancellation and flight disruptions.",
    },
    {
        icon: <Clock className="h-5 w-5"/>,
        title: "24/7 Travel Support",
        description: "Our dedicated support team is available around the clock, in your language, wherever you are in the world.",
    },
    {
        icon: <Compass className="h-5 w-5"/>,
        title: "Personalised Itineraries",
        description: "We tailor every itinerary to your interests, pace and travel style. No cookie-cutter itineraries here.",
    },
    {
        icon: <Globe className="h-5 w-5"/>,
        title: "Verified Local Partners",
        description: "All guides, hotels and activities are hand-picked and locally vetted by our travel experts.",
    },
    {
        icon: <Award className="h-5 w-5"/>,
        title: "Cypher Awards",
        description: "Recognised globally as one of the best travel experiences platforms, winning the 2026 Travellers' Choice award.",
    },
];
export function WhyChoose() {
    return (<section className="mt-24 sm:mt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-wonderlust-primary uppercase tracking-widest">
            Why Wonderlust
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Designed for the way you travel
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            We combine meticulous planning with local expertise to deliver journeys that feel personal, safe and unforgettable.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, index) => (<FeatureCard key={feature.title} icon={feature.icon} title={feature.title} description={feature.description}/>))}
        </div>
      </div>
    </section>);
}
