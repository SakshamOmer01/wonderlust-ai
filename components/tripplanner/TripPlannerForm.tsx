"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Select } from "@/ui/Select";
import { Textarea } from "@/ui/Textarea";
import { Alert, AlertTitle, AlertDescription } from "@/ui/Alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/Card";
import { Save, Sparkles, Loader2 } from "lucide-react";

type Destination = { id: string; name: string; country?: string; slug?: string };

type PlanDay = { day: number; morning?: string[]; afternoon?: string[]; evening?: string[]; foods?: string[]; transport?: string[]; tips?: string[] };

type Plan = {
  title?: string;
  destination?: { name?: string; country?: string };
  start?: string; end?: string; travelers?: number; style?: string; interests?: string[];
  itinerary?: PlanDay[];
  budget?: { accommodation?: number; food?: number; transportation?: number; activity?: number; other?: number; total?: number; remaining?: number };
};

const TRAVEL_STYLES = [
  { value: "standard", label: "Standard" },
  { value: "budget", label: "Budget" },
  { value: "luxury", label: "Luxury" },
  { value: "adventure", label: "Adventure" },
  { value: "family", label: "Family" },
  { value: "romantic", label: "Romantic" },
];

export function TripPlannerForm() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [form, setForm] = useState({
    title: "",
    destinationId: "",
    destinationName: "",
    startDate: "",
    endDate: "",
    travelers: 2,
    budget: "standard" as "budget" | "standard" | "luxury",
    budgetTotal: "",
    travelStyle: "standard",
    interests: "",
    travelPreferences: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ trip?: any; ai?: any } | null>(null);

  useEffect(() => {
    fetch("/api/destinations?limit=100")
      .then((r) => r.json())
      .then((d) => setDestinations(Array.isArray(d?.destinations) ? d.destinations : []))
      .catch(() => setDestinations([]));
  }, []);

  const destOptions = useMemo(
    () => [{ value: "", label: "Select a destination" }, ...destinations.map((d) => ({ value: d.id, label: `${d.name}${d.country ? `, ${d.country}` : ""}` }))],
    [destinations]
  );

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) { setForm((p) => ({ ...p, [k]: v })); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setResult(null);
    if (!form.title.trim() || !form.destinationId || !form.startDate || !form.endDate) {
      setError("Please fill in title, destination, start date and end date."); return;
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) { setError("End date must be after start date."); return; }
    const budgetTotal = form.budgetTotal.trim() ? Number(form.budgetTotal) : undefined;
    if (budgetTotal !== undefined && (!Number.isFinite(budgetTotal) || budgetTotal < 0)) { setError("Total budget must be a valid non-negative number."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/trips/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          destinationId: form.destinationId,
          startDate: form.startDate,
          endDate: form.endDate,
          travelers: Number(form.travelers) || 1,
          budget: form.budget,
          image: "",
          budgetTotal,
          interests: form.interests.trim(),
          travelStyle: form.travelStyle,
          travelPreferences: form.travelPreferences.trim(),
          ai: {
            destination: form.destinationName || undefined,
            start: form.startDate,
            end: form.endDate,
            travelers: Number(form.travelers) || 1,
            budget: form.budget,
            budgetTotal,
            interests: form.interests.trim(),
            travelStyle: form.travelStyle,
            travelPreferences: form.travelPreferences.trim(),
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate trip.");
    } finally {
      setLoading(false);
    }
  }

  const plan: Plan | null = result?.trip?.aiPlan ?? null;
  const days: PlanDay[] = Array.isArray(plan?.itinerary) ? plan!.itinerary : [];
  const budget = plan?.budget ?? (typeof result?.trip?.budget === "object" ? result.trip.budget : null);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-wonderlust-primary">AI Travel Planner</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Plan your trip with AI</h1>
        <p className="mt-3 text-lg text-slate-500">Generate a day-by-day itinerary and budget estimate, then save and manage your trip.</p>
      </div>

      {error && <Alert variant="error"><AlertTitle>Could not generate trip</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

      <Card>
        <CardHeader><CardTitle>Trip details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Trip title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Kyoto spring adventure" required />
            <Select label="Destination" options={destOptions} value={form.destinationId} onChange={(e) => { const d = destinations.find((x) => x.id === e.target.value); set("destinationId", e.target.value); set("destinationName", d ? `${d.name}${d.country ? `, ${d.country}` : ""}` : ""); }} />
            <Input label="Start date" type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} required />
            <Input label="End date" type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} required />
            <Input label="Number of travelers" type="number" min={1} max={50} value={form.travelers} onChange={(e) => set("travelers", Number(e.target.value))} />
            <Input label="Total budget (cap, optional)" type="number" min={0} step="0.01" value={form.budgetTotal} onChange={(e) => set("budgetTotal", e.target.value)} placeholder="e.g. 3000" />
            <Select label="Budget style" options={[{ value: "budget", label: "Budget" }, { value: "standard", label: "Standard" }, { value: "luxury", label: "Luxury" }]} value={form.budget} onChange={(e) => set("budget", e.target.value as any)} />
            <Select label="Travel style" options={TRAVEL_STYLES} value={form.travelStyle} onChange={(e) => set("travelStyle", e.target.value)} />
            <div className="md:col-span-2"><Textarea label="Interests & activities" value={form.interests} onChange={(e) => set("interests", e.target.value)} placeholder="e.g. culture, food, museums, hiking" rows={2} /></div>
            <div className="md:col-span-2"><Textarea label="Travel preferences" value={form.travelPreferences} onChange={(e) => set("travelPreferences", e.target.value)} placeholder="e.g. relaxed pace, family-friendly, avoid long transfers" rows={2} /></div>
            <div className="md:col-span-2 flex items-center gap-3">
              <Button type="submit" disabled={loading} leftIcon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}>
                {loading ? "Generating…" : "Generate Trip"}
              </Button>
              <span className="text-xs text-slate-500">Server-side AI; API keys are never exposed to the browser.</span>
            </div>
          </form>
        </CardContent>
      </Card>

      {result?.trip && (
        <div className="space-y-6">
          {result.ai && !result.ai.configured && (
            <Alert><AlertTitle>Demo / fallback plan</AlertTitle><AlertDescription>No real AI key is configured on the server (<code>AI_API_KEY</code>). A deterministic server-side plan was generated instead of a live AI response.</AlertDescription></Alert>
          )}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">{plan?.title || result.trip.title || "Your trip plan"}</h2>
            {result.trip.id && <Link href={`/trips/${result.trip.id}`} className="text-sm font-semibold text-wonderlust-primary hover:underline">Open trip (edit, regenerate, assistant) →</Link>}
          </div>

          {budget && (
            <Card>
              <CardHeader><CardTitle>Smart budget estimate</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-7">
                  {[ ["Accommodation", budget.accommodation],["Food", budget.food],["Transportation", budget.transportation],["Activities", budget.activity],["Other", budget.other],["Total est.", budget.total],["Remaining", budget.remaining] ].map(([label, val]) => (
                    <div key={String(label)} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div className="text-slate-500">{label}</div>
                      <div className="font-semibold text-slate-900">${Number(val ?? 0).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">Remaining = total budget cap − estimated total (0 if no cap provided). Estimates are approximate.</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Day-by-day itinerary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {days.length === 0 && <p className="text-sm text-slate-500">No structured days returned.</p>}
              {days.map((d) => (
                <div key={d.day} className="rounded-xl border border-slate-200 p-4">
                  <div className="font-semibold text-slate-900">Day {d.day}</div>
                  <div className="mt-2 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                    <div><span className="font-medium">Morning:</span> {(d.morning || []).join("; ") || "—"}</div>
                    <div><span className="font-medium">Afternoon:</span> {(d.afternoon || []).join("; ") || "—"}</div>
                    <div><span className="font-medium">Evening:</span> {(d.evening || []).join("; ") || "—"}</div>
                    <div><span className="font-medium">Food:</span> {(d.foods || []).join("; ") || "—"}</div>
                    <div><span className="font-medium">Transport/cost notes:</span> {(d.transport || []).join("; ") || "—"}</div>
                    <div><span className="font-medium">Tips:</span> {(d.tips || []).join("; ") || "—"}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
