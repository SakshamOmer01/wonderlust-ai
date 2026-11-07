"use client";

import { CATEGORIES } from "@/lib/data";
import {
  Map,
  Mountain,
  Globe,
  Compass,
  Zap,
  Heart,
  TreePine,
} from "lucide-react";
import { Card } from "@/ui/Card";
import { Star } from "lucide-react";

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  beach: Map,
  mountain: Mountain,
  city: Globe,
  cultural: Compass,
  adventure: Zap,
  wellness: Heart,
  nature: TreePine,
};

const HERO_IMAGES = [
  "/images/homepage-1.jpg",
  "/images/homepage-2.jpg",
  "/images/homepage-3.jpg",
  "/images/homepage-4.jpg",
];

const CATEGORY_HEROES = [
  {
    category: "adventure" as const,
    image: "https://images.unsplash.com/photo-1582719508461-b508923b0e7a?w=1200&q=80",
    label: "High-adrenaline expeditions",
  },
  {
    category: "wellness" as const,
    image: "https://images.unsplash.com/photo-1540555700476-180098423b19?w=1200&q=80",
    label: "Rejuvenating escapes",
  },
  {
    category: "cultural" as const,
    image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&q=80",
    label: "Immersive cultural journeys",
  },
  {
    category: "beach" as const,
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80",
    label: "Tropical sunsets",
  },
];

export function TravelCategories() {
  return (
    <section className="bg-white mt-24 sm:mt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-wonderlust-primary uppercase tracking-widest">
              Categories
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Travel by category
            </h2>
            <p className="mt-3 text-lg text-slate-500">
              Find the perfect trip for your preferences and mood.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-px bg-border" />
            <div className="flex -space-x-2">
              {HERO_IMAGES.slice(0, 4).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt="Category"
                  className="h-10 w-10 rounded-full border-2 border-white object-cover"
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Category icons */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = ICON_MAP[cat.id] ?? Map;
            return (
              <Card key={cat.id} className="p-4 text-center hover:shadow-md transition-shadow">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100 text-teal-600 transition-transform duration-300 hover:scale-110 hover:bg-teal-500 hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-xs font-semibold text-slate-700">
                  {cat.label}
                </p>
              </Card>
            );
          })}
        </div>

        {/* Featured category heroes */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORY_HEROES.map((item, i) => (
            <div
              key={item.category}
              className="group relative overflow-hidden rounded-2xl"
            >
              <img
                src={item.image}
                alt={item.label}
                className="h-56 w-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-lg font-bold text-white">{item.label}</h3>
                <a
                  href="#"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-white hover:text-teal-300 transition-colors"
                >
                  Explore <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
