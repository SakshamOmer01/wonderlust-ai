"use client";
import { useState } from "react";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Search, Filter, X, Compass } from "lucide-react";
import { DESTINATIONS, CONTINENTS, CATEGORIES } from "@/lib/data";
import { DestinationGrid } from "@/components/destinations/DestinationGrid";
export function ExplorePage() {
    const [search, setSearch] = useState("");
    const [continent, setContinent] = useState("all");
    const [category, setCategory] = useState("all");
    const [showFilters, setShowFilters] = useState(false);
    const filtered = DESTINATIONS.filter((d) => {
        const q = search.toLowerCase();
        const matchesSearch = !q ||
            d.name.toLowerCase().includes(q) ||
            d.country.toLowerCase().includes(q) ||
            d.category.toLowerCase().includes(q);
        const matchesContinent = continent === "all" || d.continent === continent;
        const matchesCategory = category === "all" || d.category === category;
        return matchesSearch && matchesContinent && matchesCategory;
    });
    return (<div className="bg-white">
      {/* Page header */}
      <div className="bg-gradient-to-b from-white to-slate-50 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-wonderlust-primary uppercase tracking-widest">
            Explore
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
            Discover your next destination
          </h1>
          <p className="mt-4 text-lg text-slate-500">
            Browse our curated collection of the world&apos;s most breathtaking places.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Search */}
        <div className="relative max-w-xl mb-6">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"/>
          <Input type="search" placeholder="Search destinations, countries, activities..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" label="Search"/>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex gap-2">
            <Button variant={continent === "all" ? "primary" : "outline"} size="sm" onClick={() => setContinent("all")}>
              All regions
            </Button>
            {CONTINENTS.map((c) => (<Button key={c} variant={continent === c ? "primary" : "outline"} size="sm" onClick={() => setContinent(c)}>
                {c.replace(/-/g, " ")}
              </Button>))}
          </div>

          <Button variant="outline" size="sm" onClick={() => setShowFilters((v) => !v)}>
            <Filter className="h-4 w-4 mr-2"/>
            Filters
            {showFilters && <span className="ml-1 text-xs">✕</span>}
          </Button>
        </div>

        {/* Advanced filters */}
        {showFilters && (<div className="mb-6 flex flex-wrap gap-4 border border-border rounded-xl bg-slate-50 p-4">
            <div className="flex-1 min-w-[160px]">
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Country
              </label>
              <select className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm" onChange={(e) => setCategory(e.target.value)} value="all">
                <option value="all">All countries</option>
                {DESTINATIONS.map((d) => (<option key={d.id} value={d.country}>
                    {d.country}
                  </option>))}
              </select>
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Category
              </label>
              <select className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm" onChange={(e) => setCategory(e.target.value)} value="all">
                <option value="all">All categories</option>
                {CATEGORIES.map((c) => (<option key={c.id} value={c.id}>
                    {c.label}
                  </option>))}
              </select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" size="sm" onClick={() => {
                setSearch("");
                setContinent("all");
                setCategory("all");
                setShowFilters(false);
            }}>
                <X className="h-4 w-4 mr-2"/>
                Clear
              </Button>
            </div>
          </div>)}

        {/* Results */}
        {filtered.length > 0 ? (<>
            <p className="mb-4 text-sm text-slate-500">
              Showing <span className="font-semibold text-slate-700">{filtered.length}</span>{" "}
              destinations
            </p>
            <DestinationGrid destinations={filtered}/>
          </>) : (<div className="text-center py-20">
            <Compass className="mx-auto h-12 w-12 text-slate-300"/>
            <h3 className="mt-4 text-lg font-semibold text-slate-700">
              No destinations match
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Try a different search or clear the filters.
            </p>
            <Button variant="outline" className="mt-6" onClick={() => {
                setSearch("");
                setContinent("all");
                setCategory("all");
            }}>
              Reset filters
            </Button>
          </div>)}
      </div>
    </div>);
}
