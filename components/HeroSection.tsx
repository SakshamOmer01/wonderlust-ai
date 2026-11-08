"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/ui/Button";
import { Search, MapPin, Calendar, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroSectionProps {
  className?: string;
}

const DESTINATION_IMAGES = [
  "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1920&q=80",
  "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1920&q=80",
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1920&q=80",
];

export function HeroSection({ className }: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [transiting, setTransiting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTransiting(true);
      setTimeout(() => {
        setCurrentSlide((s) => (s + 1) % DESTINATION_IMAGES.length);
        setTimeout(() => setTransiting(false), 600);
      }, 300);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <section className={cn("relative overflow-hidden bg-white", className)}>
      {/* Hero slide background */}
      <div className="relative h-[calc(100vh-4rem)] min-h-[520px] sm:h-[70vh]">
        {DESTINATION_IMAGES.map((src, i) => (
          <div
            key={src}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-out",
              i === currentSlide ? "opacity-100" : "opacity-0"
            )}
          >
            <img
              src={src}
              alt={`Wonderlust destination ${i + 1}`}
              className="h-full w-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          </div>
        ))}

        {/* Slide indicators */}
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-2">
          {DESTINATION_IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setTransiting(true);
                setTimeout(() => {
                  setCurrentSlide(i);
                  setTimeout(() => setTransiting(false), 600);
                }, 300);
              }}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === currentSlide
                  ? "w-8 bg-white"
                  : "w-2 bg-white/60 hover:bg-white/80"
              )}
              aria-label={`Go to slide ${i + 1}`}
              tabIndex={i === currentSlide ? 0 : -1}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-28 sm:pb-20">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              New destinations added every week
            </p>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-[5rem] font-bold leading-tight tracking-tight text-white">
              Find Your
              <span className="text-teal-300"> Next</span> Adventure
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-white/80 max-w-xl">
              Wonderlust curates the world&apos;s most beautiful journeys.
              Let us help you discover the place you&apos;ve always dreamed of.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button size="lg" leftIcon={<Search />}>
                Explore destinations
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                Book a call
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
