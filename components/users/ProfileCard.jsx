import { Card } from "@/ui/Card";
import { Avatar, AvatarImage, AvatarFallback } from "@/ui/Avatar";
import { Button } from "@/ui/Button";
import { Star, MapPin, Calendar, User, DollarSign } from "lucide-react";
/**
 * Profile summary card for the dashboard.
 *
 * Renders the authenticated user's stored profile data and, when supplied,
 * their real activity statistics.
 */
export function ProfileCard({ user, stats }) {
    const initials = user.name
        ?.trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || user.email[0]?.toUpperCase() || "?";
    const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });
    const items = [
        {
            label: "Trips",
            value: stats ? String(stats.trips) : "—",
            icon: <Calendar className="h-4 w-4"/>,
        },
        {
            label: "Saved destinations",
            value: stats ? String(stats.savedDestinations) : "—",
            icon: <MapPin className="h-4 w-4"/>,
        },
        {
            label: "Avg. review rating",
            value: stats ? stats.averageRating : "—",
            icon: <Star className="h-4 w-4"/>,
        },
        {
            label: "Booking total",
            value: stats ? stats.totalSpent : "—",
            icon: <DollarSign className="h-4 w-4"/>,
        },
    ];
    return (<Card className="overflow-hidden">
      <div className="h-24 bg-gradient-to-br from-wonderlust-primary to-teal-400 sm:h-32"/>
      <div className="px-5 pb-5">
        <Avatar className="h-20 w-20 border-4 border-white shadow-md">
          {user.avatar ? (<AvatarImage src={user.avatar} alt={user.name ?? "User avatar"}/>) : null}
          <AvatarFallback className="rounded-xl bg-white text-slate-600">
            {user.avatar ? <User className="h-6 w-6"/> : initials}
          </AvatarFallback>
        </Avatar>
        <h2 className="mt-4 text-xl font-bold text-slate-900">
          {user.name ?? "Traveller"}
        </h2>
        <p className="text-sm text-slate-500">{user.email}</p>
        <p className="mt-1 text-xs text-slate-400">Member since {memberSince}</p>

        <div className="px-0 pb-0 pt-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Overview
          </p>
          <div className="mt-3 grid grid-cols-2 gap-4">
            {items.map((stat) => (<div key={stat.label} className="rounded-xl bg-slate-50 p-3">
                <div className="flex items-center gap-1.5 text-wonderlust-primary">
                  {stat.icon}
                  <span className="text-sm font-semibold text-slate-700">
                    {stat.value}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{stat.label}</p>
              </div>))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border px-5 py-4">
        <Button variant="outline" className="w-full" leftIcon={<MapPin className="h-4 w-4"/>} asChild>
          <a href="/dashboard#saved">View saved destinations</a>
        </Button>
        <Button variant="outline" className="w-full" leftIcon={<Calendar className="h-4 w-4"/>} asChild>
          <a href="/trips">Trip history</a>
        </Button>
        <Button variant="outline" className="w-full" asChild>
          <a href="/profile">Edit profile</a>
        </Button>
      </div>
    </Card>);
}
