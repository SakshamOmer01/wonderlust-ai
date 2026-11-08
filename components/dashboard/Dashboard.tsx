"use client";

import { ProfileCard } from "@/components/users/ProfileCard";
import { MyTrips } from "@/components/trips/MyTrips";
import { SavedDestinations } from "./SavedDestinations";
import { User } from "@/types";
import { PageHeader } from "./../layout/PageHeader";
import { Button } from "@/ui/Button";
import { Plus, Star, MapPin, Compass, ArrowRight } from "lucide-react";

interface DashboardProps {
  user: User;
}

export function Dashboard({ user }: DashboardProps) {
  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-b from-white to-slate-50 px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-wonderlust-primary uppercase tracking-widest">
            Welcome back
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Alex, ready for your next adventure?
          </h1>
          <p className="mt-3 text-lg text-slate-500">
            Here&apos;s an overview of your trips, saved destinations and profile.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">
            <MyTrips />
            <SavedDestinations />
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <ProfileCard user={user} />
            <div className="flex gap-3">
              <div className="flex-1 rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Star className="h-4 w-4 text-amber-400" />
                  Rating
                </div>
                <p className="mt-1 text-2xl font-bold text-slate-900">4.9</p>
                <p className="text-xs text-slate-500">1,847 reviews</p>
              </div>
              <div className="flex-1 rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Compass className="h-4 w-4 text-wonderlust-primary" />
                  Wishlist
                </div>
                <p className="mt-1 text-2xl font-bold text-slate-900">12</p>
                <p className="text-xs text-slate-500">destinations saved</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
