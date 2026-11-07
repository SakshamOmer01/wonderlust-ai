"use client";

import { useState } from "react";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Select } from "@/ui/Select";
import { Textarea } from "@/ui/Textarea";import { Alert, AlertTitle, AlertDescription } from "@/ui/Alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/Card";
import { Calendar, Users, DollarSign, MapPin, Image, Save } from "lucide-react";
import { DESTINATIONS } from "@/lib/data";

import { cn } from "@/lib/utils";
import type { TripFormData } from "@/types";const destList = DESTINATIONS;

const BUDGET_OPTIONS = [
  { value: "budget", label: "Budget ($1,000 - $2,000)", icon: <DollarSign className="h-4 w-4" /> },
  { value: "standard", label: "Standard ($2,000 - $4,000)", icon: <DollarSign className="h-4 w-4" /> },
  { value: "luxury", label: "Luxury ($4,000+)", icon: <DollarSign className="h-4 w-4" /> },
] as const;

export function TripPlannerForm() {
  const [form, setForm] = useState<TripFormData>({
    title: "",
    destinationId: "",
    destinationSlug: "",
    startDate: "",
    endDate: "",
    travelers: 1,
    budget: "standard",
    durationDays: 7,
    image: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TripFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = (): boolean => {
    const next: Partial<Record<keyof TripFormData, string>> = {};

    if (!form.title.trim()) next.title = "Trip title is required";
    else if (form.title.trim().length < 3)
      next.title = "Trip title must be at least 3 characters";

    if (!form.destinationId) next.destinationId = "Please select a destination";
    if (!form.startDate)
      next.startDate = "Travel start date is required";
    else {
      const start = new Date(form.startDate);
      if (start.getTime() < Date.now() - 86_400_000)
        next.startDate = "Start date cannot be in the past";
    }
    if (!form.endDate) next.endDate = "Travel end date is required";
    else {
      const end = new Date(form.endDate);
      if (end < new Date(form.startDate))
        next.endDate = "End date must be after start date";
    }
    if (form.travelers < 1) next.travelers = "At least 1 traveller";
    else if (form.travelers > 20) next.travelers = "Max 20 travellers";

    if (!form.budget) next.budget = "Please choose a budget";

    if (!form.image.trim())
      next.image = "Upload a trip cover image";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = <K extends keyof TripFormData>(
    key: K,
    value: TripFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    // NOTE: In the next phase this sends the payload to the backend API.
    // For now this just simulates a submission and clears the form.
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
      setForm({
        title: "",
        destinationId: "",
        destinationSlug: "",
        startDate: "",
        endDate: "",
        travelers: 1,
        budget: "standard",
        durationDays: 7,
        image: "",
      });
      setTimeout(() => setSuccess(false), 4000);
    }, 1200);
  };

  const inputClass = (error?: string) =>
    cn(
      "w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-wonderlust-primary/30 focus:border-wonderlust-primary transition-all duration-200",
      error && "border-red-400 focus:ring-red-400/30 focus:border-red-400"
    );

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <p className="text-sm font-semibold text-wonderlust-primary uppercase tracking-widest">
              Trip planner
            </p>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Create a new trip
            </h1>
            <p className="mt-3 text-lg text-slate-500">
              Fill in the details and we&apos;ll take care of the rest.
            </p>
          </div>

          {/* Success alert */}
          {success && (
            <Alert variant="success" className="mb-6">
              <Save className="h-5 w-5" />
              <AlertTitle>Saved!</AlertTitle>
              <AlertDescription>
                Your trip plan has been created successfully.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Trip details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Trip title <span className="text-red-400">*</span>
                  </label>
                  <Input
                    id="title"
                    placeholder="e.g. Bali Highlands Retreat"
                    value={form.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    error={errors.title}
                    className={inputClass(errors.title)}
                  />
                </div>

                {/* Origin (optional note) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="origin" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Origin
                    </label>
                    <Input
                      id="origin"
                      placeholder="e.g. New York"
                      defaultValue="New York"
                    />
                  </div>
                  <div>
                    <label htmlFor="departure" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Departure
                    </label>
                    <Input
                      id="departure"
                      type="date"
                      className={inputClass()}
                    />
                  </div>
                </div>

                {/* Destination */}
                <div>
                  <label htmlFor="destinationId" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Destination <span className="text-red-400">*</span>
                  </label>
                  <Select
                    id="destinationId"
                    options={
                      destList.map((d) => ({
                        value: d.id,
                        label: `${d.name} — ${d.country}`,
                      })) || []
                    }
                    value={form.destinationId}
                    onChange={(e) => {
                      const sel = destList.find((d) => d.id === e.target.value);
                      handleChange("destinationId", e.target.value);
                      handleChange("destinationSlug", sel?.slug ?? "");
                    }}
                    error={errors.destinationId}
                  />
                </div>

                {/* Travel dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Travel start date <span className="text-red-400">*</span>
                    </label>
                    <Input
                      id="startDate"
                      type="date"
                      className={inputClass(errors.startDate)}
                      value={form.startDate}
                      onChange={(e) => handleChange("startDate", e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Travel end date <span className="text-red-400">*</span>
                    </label>
                    <Input
                      id="endDate"
                      type="date"
                      className={inputClass(errors.endDate)}
                      value={form.endDate}
                      onChange={(e) => handleChange("endDate", e.target.value)}
                    />
                  </div>
                </div>

                {/* Travelers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="travelers" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Number of travellers <span className="text-red-400">*</span>
                    </label>
                    <Input
                      id="travelers"
                      type="number"
                      min={1}
                      max={20}
                      className={inputClass(errors.travelers)}
                      value={form.travelers}
                      onChange={(e) => handleChange("travelers", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label htmlFor="durationDays" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Duration (days)
                    </label>
                    <Input
                      id="durationDays"
                      type="number"
                      min={1}
                      value={form.durationDays}
                      onChange={(e) =>
                        handleChange("durationDays", Number(e.target.value))
                      }
                    />
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Budget <span className="text-red-400">*</span>
                  </span>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {BUDGET_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleChange("budget", opt.value)}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200",
                          form.budget === opt.value
                            ? "border-wonderlust-primary bg-wonderlust-primary text-white shadow-sm"
                            : "border-border bg-white text-slate-600 hover:border-wonderlust-primary hover:text-wonderlust-primary"
                        )}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {errors.budget && (
                    <p className="mt-1 text-xs text-red-500">{errors.budget}</p>
                  )}
                </div>

                {/* Cover image */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Cover image URL
                    <span className="ml-2 text-xs text-slate-400">
                      (optional, remote image)
                    </span>
                  </label>
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={form.image}
                    onChange={(e) => handleChange("image", e.target.value)}
                    error={errors.image}
                    className={inputClass(errors.image)}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="flex-1"
                    leftIcon={<Save />}
                    isLoading={isSubmitting}
                  >
                    Save trip
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setForm({ title: "", destinationId: "", destinationSlug: "", startDate: "", endDate: "", travelers: 1, budget: "standard", durationDays: 7, image: "" })}
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
