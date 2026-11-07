import { Card } from "@/ui/Card";
import { Avatar, AvatarImage, AvatarFallback } from "@/ui/Avatar";
import { Button } from "@/ui/Button";
import { Star, MapPin, Calendar, User, Briefcase, DollarSign } from "lucide-react";

export function ProfileCard() {
  const stats = [
    { label: "Trips", value: "12", icon: <Calendar className="h-4 w-4" /> },
    { label: "Saved destinations", value: "24", icon: <MapPin className="h-4 w-4" /> },
    { label: "Rating", value: "4.9", icon: <Star className="h-4 w-4" /> },
    { label: "Spent", value: "$4,820", icon: <DollarSign className="h-4 w-4" /> },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="h-24 bg-gradient-to-br from-wonderlust-primary to-teal-400 sm:h-32" />
      <div className="px-5 pb-5">
        <Avatar className="h-20 w-20 border-4 border-white shadow-md">
          <AvatarImage src="https://i.pravatar.cc/300?img=11" alt="User" />
          <AvatarFallback className="rounded-xl bg-white text-slate-600">
            <User className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
        <h2 className="mt-4 text-xl font-bold text-slate-900">Alex Johnson</h2>
        <p className="text-sm text-slate-500">alex@wonderlust.com</p>
        <p className="mt-1 text-xs text-slate-400">
          Member since March 2024 · 5-star rated
        </p>
      </div>

      <div className="px-5 pb-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Overview
        </p>
        <div className="mt-3 grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl bg-slate-50 p-3">
              <div className="flex items-center gap-1.5 text-wonderlust-primary">
                {stat.icon}
                <span className="text-sm font-semibold text-slate-700">{stat.value}</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border px-5 py-4">
        <Button variant="outline" className="w-full" leftIcon={<MapPin className="h-4 w-4" />}>
          View saved destinations
        </Button>
        <Button variant="outline" className="w-full" leftIcon={<Calendar className="h-4 w-4" />}>
          Trip history
        </Button>
        <Button
          variant="outline"
          className="w-full text-amber-600 border-amber-200 hover:bg-amber-50"
        >
          Edit profile
        </Button>
      </div>
    </Card>
  );
}
