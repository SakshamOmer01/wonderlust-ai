"use client";

import { useState, useDeferredValue } from "react";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Popover } from "./Popover";
import { Search, MapPin, Calendar, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DestinationSearchProps {
  className?: string;
  onSearch?: (query: string) => void;
}

const CONTINENTS = [
  { value: "all", label: "All continents" },
  { value: "asia", label: "Asia" },
  { value: "europe", label: "Europe" },
  { value: "north-america", label: "North America" },
  { value: "south-america", label: "South America" },
  { value: "africa", label: "Africa" },
  { value: "oceania", label: "Oceania" },
];

const CATEGORIES = [
  { value: "all", label: "All categories" },
  { value: "beach", label: "Beach" },
  { value: "mountain", label: "Mountain" },
  { value: "city", label: "City" },
  { value: "cultural", label: "Cultural" },
  { value: "adventure", label: "Adventure" },
  { value: "wellness", label: "Wellness" },
  { value: "nature", label: "Nature" },
];

export function DestinationSearch({
  className,
  onSearch,
}: DestinationSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [continent, setContinent] = useState("all");
  const [category, setCategory] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [travelers, setTravelers] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearch = useDeferredValue(searchQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(`${debouncedSearch} ${continent} ${category} ${dateFrom} ${dateTo} ${travelers}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "rounded-2xl border border-border bg-white shadow-sm",
        "p-3 sm:p-5",
        "max-w-4xl mx-auto",
        className
      )}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Where are you going?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Continent */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            Continent
          </label>
          <select
            value={continent}
            onChange={(e) => setContinent(e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-wonderlust-primary/30 focus:border-wonderlust-primary transition-all"
          >
            {CONTINENTS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-wonderlust-primary/30 focus:border-wonderlust-primary transition-all"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date & travelers row */}
        <div className="flex gap-2 sm:col-span-2 sm:grid sm:grid-cols-2">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="number"
              min={1}
              value={travelers}
              onChange={(e) => setTravelers(Number(e.target.value))}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="mt-3 w-full sm:mt-0 sm:w-auto"
        leftIcon={<Search />}
      >
        Search
      </Button>
    </form>
  );
}
