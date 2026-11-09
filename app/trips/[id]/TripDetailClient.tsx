"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Textarea } from "@/ui/Textarea";
import { Select } from "@/ui/Select";
import { Alert, AlertTitle, AlertDescription } from "@/ui/Alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/Card";
import { Loader2, Trash2, RefreshCw, Save, MessageSquare } from "lucide-react";

type PlanDay = { day: number; morning?: string[]; afternoon?: string[]; evening?: string[]; foods?: string[]; transport?: string[]; tips?: string[] };

function parsePlan(contents: any): { days: PlanDay[]; budget: any } {
  if (!contents) return { days: [], budget: null };
  const obj = typeof contents === "string" ? (() => { try { return JSON.parse(contents); } catch { return null; } })() : contents;
  const days = Array.isArray(obj?.itinerary) ? obj.itinerary : [];
  return { days, budget: obj?.budget ?? null };
}

function BudgetView({ budget }: { budget: any }) {
  if (!budget) return <p className="text-sm text-slate-500">No budget estimate yet.</p>;
  const rows: [string, any][] = [["Accommodation", budget.accommodation],["Food", budget.food],["Transportation", budget.transportation],["Activities", budget.activity],["Other", budget.other],["Total estimated", budget.total],["Remaining budget", budget.remaining]];
  return (
    <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-7">
      {rows.map(([label, val]) => (
        <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <div className="text-slate-500">{label}</div>
          <div className="font-semibold text-slate-900">${Number(val ?? 0).toFixed(2)}</div>
        </div>
      ))}
    </div>
  );
}

function Assistant({ tripId, trip }: { tripId: string; trip: any }) {
  const [conversationId] = useState(() => `trip-${tripId}-${Math.random().toString(36).slice(2)}`);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);

  async function send() {
    const msg = input.trim(); if (!msg || loading) return;
    setInput(""); setError(null);
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId, message: msg, tripId,
          tripContext: { title: trip?.title, destination: trip?.destinationName || trip?.destination?.name, start: trip?.startDate, end: trip?.endDate, travelers: trip?.travelers, budget: trip?.budget },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
      if (!data?.ai?.configured) setDemo(true);
      const reply = (data?.reply && String(data.reply).trim()) ? String(data.reply) : (data?.ai?.configured ? "(No reply returned.)" : "Demo mode: configure AI_API_KEY on the server for live AI responses. I can still help if you describe what to change.");
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assistant request failed.");
    } finally { setLoading(false); }
  }

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />AI travel assistant</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {demo && <Alert><AlertTitle>Demo / fallback</AlertTitle><AlertDescription>Live AI is not configured (<code>AI_API_KEY</code> missing or unavailable). Responses may be limited.</AlertDescription></Alert>}
        {error && <Alert variant="error"><AlertTitle>Assistant error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
        <div className="max-h-72 space-y-2 overflow-auto rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
          {messages.length === 0 && <p className="text-slate-500">Ask travel questions, request destination suggestions, or ask to modify this trip.</p>}
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-slate-900" : "text-slate-700"}><span className="font-semibold">{m.role === "user" ? "You" : "Assistant"}:</span> {m.text}</div>
          ))}
          {loading && <div className="text-slate-500 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Thinking…</div>}
        </div>
        <div className="flex gap-2">
          <Textarea label="" className="flex-1" rows={2} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your trip, destinations, or request a change…" />
        </div>
        <Button type="button" onClick={send} disabled={loading || !input.trim()}>{loading ? "Sending…" : "Send"}</Button>
      </CardContent>
    </Card>
  );
}

export default function TripDetailClient({ tripId }: { tripId: string }) {
  const [trip, setTrip] = useState<any>(null);
  const [itinerary, setItinerary] = useState<any[]>([]);
  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [regenDay, setRegenDay] = useState("1");
  const [edit, setEdit] = useState({ title: "", startDate: "", endDate: "", travelers: "2", budget: "standard" });

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [tRes, iRes] = await Promise.all([
        fetch(`/api/trips/${tripId}`),
        fetch(`/api/trips/${tripId}/itinerary`),
      ]);
      const t = await tRes.json().catch(() => ({}));
      const it = await iRes.json().catch(() => ({}));
      if (!tRes.ok) throw new Error(t?.error || t?.message || `Trip load failed (${tRes.status})`);
      setTrip(t.trip);
      setItinerary(Array.isArray(it?.itinerary) ? it.itinerary : (Array.isArray(t.trip?.itinerary) ? t.trip.itinerary : []));
      setBudget(it?.estimatedBudget ?? t.trip?.budgetPlan ?? t.trip?.tripAiPlan?.contents?.budget ?? null);
      setEdit({
        title: t.trip?.title || "", startDate: (t.trip?.startDate || "").slice(0,10), endDate: (t.trip?.endDate || "").slice(0,10),
        travelers: String(t.trip?.travelers ?? 2), budget: t.trip?.budget || "standard",
      });
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to load trip."); }
    finally { setLoading(false); }
  }, [tripId]);

  useEffect(() => { load(); }, [load]);

  const planInfo = useMemo(() => parsePlan(trip?.tripAiPlan?.contents), [trip]);
  const displayDays: PlanDay[] = planInfo.days.length ? planInfo.days : itinerary.map((r: any) => ({ day: r.dayNumber, morning: [r.activity].filter(Boolean), afternoon: r.description ? [r.description] : [], evening: [], foods: [], transport: [], tips: [] }));

  async function saveEdit() {
    setBusy("save"); setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: edit.title, startDate: edit.startDate, endDate: edit.endDate, travelers: Number(edit.travelers), budget: edit.budget }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error || d?.message || "Update failed");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Update failed."); }
    finally { setBusy(null); }
  }

  async function deleteTrip() {
    if (!confirm("Delete this trip? This cannot be undone.")) return;
    setBusy("delete"); setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}`, { method: "DELETE" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error || d?.message || "Delete failed");
      window.location.href = "/trips";
    } catch (e) { setError(e instanceof Error ? e.message : "Delete failed."); setBusy(null); }
  }

  async function regenerateSelectedDay() {
    const day = Number(regenDay);
    if (!Number.isInteger(day) || day < 1) { setError("Select a valid day number."); return; }
    setBusy("regen"); setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ day }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error || d?.message || "Regeneration failed");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Regeneration failed."); }
    finally { setBusy(null); }
  }

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-12 text-slate-500 flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" />Loading trip…</div>;
  if (error && !trip) return <div className="mx-auto max-w-6xl px-4 py-12"><Alert variant="error"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert><Link href="/trips" className="mt-4 inline-block text-wonderlust-primary">Back to trips</Link></div>;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/trips" className="text-sm text-wonderlust-primary hover:underline">← Trips</Link>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">{trip?.title || "Trip"}</h1>
          <p className="text-slate-500">{trip?.destinationName || trip?.destination?.name} · {(trip?.startDate||"").slice(0,10)} to {(trip?.endDate||"").slice(0,10)} · {trip?.travelers} traveler(s)</p>
        </div>
        <Button variant="outline" onClick={deleteTrip} disabled={busy==="delete"} leftIcon={<Trash2 className="h-4 w-4" />}>{busy==="delete"?"Deleting…":"Delete trip"}</Button>
      </div>

      {error && <Alert variant="error"><AlertTitle>Action failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

      <Card>
        <CardHeader><CardTitle>Budget planner</CardTitle></CardHeader>
        <CardContent><BudgetView budget={budget || planInfo.budget} /><p className="mt-2 text-xs text-slate-500">Categories: accommodation, food, transportation, activities, other. Total and remaining are validated as non-negative.</p></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Itinerary (day-by-day)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="w-32"><Input label="Regenerate day" type="number" min={1} value={regenDay} onChange={(e)=>setRegenDay(e.target.value)} /></div>
            <Button type="button" onClick={regenerateSelectedDay} disabled={busy==="regen"} leftIcon={busy==="regen"?<Loader2 className="h-4 w-4 animate-spin"/>:<RefreshCw className="h-4 w-4" />}>{busy==="regen"?"Regenerating…":"Regenerate selected day"}</Button>
            <span className="text-xs text-slate-500">Only the selected day is regenerated (server-side); others are preserved when possible.</span>
          </div>
          {displayDays.length === 0 && <p className="text-sm text-slate-500">No itinerary days yet.</p>}
          {displayDays.map((d) => (
            <div key={d.day} className="rounded-xl border border-slate-200 p-4">
              <div className="font-semibold text-slate-900">Day {d.day}</div>
              <div className="mt-2 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <div><span className="font-medium">Morning activities:</span> {(d.morning||[]).join("; ") || "—"}</div>
                <div><span className="font-medium">Afternoon activities:</span> {(d.afternoon||[]).join("; ") || "—"}</div>
                <div><span className="font-medium">Evening activities:</span> {(d.evening||[]).join("; ") || "—"}</div>
                <div><span className="font-medium">Attractions / food recommendations:</span> {(d.foods||[]).join("; ") || "—"}</div>
                <div><span className="font-medium">Travel cost estimates / transport:</span> {(d.transport||[]).join("; ") || "—"}</div>
                <div><span className="font-medium">Practical tips:</span> {(d.tips||[]).join("; ") || "—"}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Edit trip</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label="Title" value={edit.title} onChange={(e)=>setEdit({...edit,title:e.target.value})} />
          <Input label="Travelers" type="number" min={1} value={edit.travelers} onChange={(e)=>setEdit({...edit,travelers:e.target.value})} />
          <Input label="Start date" type="date" value={edit.startDate} onChange={(e)=>setEdit({...edit,startDate:e.target.value})} />
          <Input label="End date" type="date" value={edit.endDate} onChange={(e)=>setEdit({...edit,endDate:e.target.value})} />
          <Select label="Budget style" value={edit.budget} onChange={(e)=>setEdit({...edit,budget:e.target.value})} options={[{value:"budget",label:"Budget"},{value:"standard",label:"Standard"},{value:"luxury",label:"Luxury"}]} />
          <div className="flex items-end"><Button type="button" onClick={saveEdit} disabled={busy==="save"} leftIcon={busy==="save"?<Loader2 className="h-4 w-4 animate-spin"/>:<Save className="h-4 w-4" />}>{busy==="save"?"Saving…":"Save changes"}</Button></div>
        </CardContent>
      </Card>

      <Assistant tripId={tripId} trip={trip} />
    </div>
  );
}
