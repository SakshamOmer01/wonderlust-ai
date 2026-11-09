/**
 * Smart budget planner for Wonderlust.
 *
 * Deterministic estimation of a trip's costs based on:
 *   - hotel cost per night (accommodation)
 *   - daily food cost per person
 *   - daily transport cost per person
 *   - per-day activity budget
 *   - miscellaneous/other
 *
 * The model is kept simple and consistent so that generated budgets always sum
 * together and the remaining balance is always total - sum(items). Values are
 * clamped to non-negative numbers and rounded to two decimals.
 */

export type BudgetStyle = "budget" | "standard" | "luxury";

/** Nightly hotel cost per room (single occupancy). */
const HOTEL_NIGHTLY: Record<BudgetStyle, number> = {
  budget: 45,
  standard: 120,
  luxury: 350,
};

/** Daily food cost per person. */
const FOOD_DAILY: Record<BudgetStyle, number> = {
  budget: 22,
  standard: 55,
  luxury: 140,
};

/** Daily local transport cost per person. */
const TRANSPORT_DAILY: Record<BudgetStyle, number> = {
  budget: 6,
  standard: 15,
  luxury: 45,
};

/** Daily activity budget per person. */
const ACTIVITY_DAILY: Record<BudgetStyle, number> = {
  budget: 18,
  standard: 40,
  luxury: 110,
};

/** Miscellaneous "other" cost per person per day. */
const OTHER_DAILY: Record<BudgetStyle, number> = {
  budget: 8,
  standard: 20,
  luxury: 45,
};

/**
 * Estimate the budget breakdown for a trip.
 */
export function breakdownForChart(breakdown: BudgetBreakdown, style: BudgetStyle): { label: string; value: number }[] {
  return [
    { label: "Accommodation", value: round2(breakdown.accommodation) },
    { label: "Food", value: round2(breakdown.food) },
    { label: "Transport", value: round2(breakdown.transportation) },
    { label: "Activity", value: round2(breakdown.activity) },
    { label: "Other", value: round2(breakdown.other) },
  ];
}

export function estimateBreakdown(
  style: BudgetStyle,
  _country: string,
  nights: number,
  travellers: number
): BudgetBreakdown {
  const hotel = HOTEL_NIGHTLY[style] * nights * travellers;
  const food = FOOD_DAILY[style] * nights * travellers;
  const transport = TRANSPORT_DAILY[style] * nights * travellers;
  const activity = ACTIVITY_DAILY[style] * nights * travellers;
  const other = OTHER_DAILY[style] * nights * travellers;
  const total = hotel + food + transport + activity + other;
  const remaining = Math.max(0, total);

  return {
    accommodation: round2(hotel),
    food: round2(food),
    transportation: round2(transport),
    activity: round2(activity),
    other: round2(other),
    total: round2(total),
    remaining: round2(remaining),
  };
}

export function remainingFromBudget(budget: BudgetBreakdown): number {
  return Math.max(0, budget.total - (budget.accommodation + budget.food + budget.transportation + budget.activity + budget.other));
}

export function buildBudgetPlan(
  style: BudgetStyle,
  country: string,
  start: Date,
  end: Date,
  travellers: number,
  budgetCap?: number
): BudgetPlanRow {
  const nights = nightsFromDates(start, end);
  const breakdown = estimateBreakdown(style, country, nights, travellers);
  const cap = typeof budgetCap === "number" && Number.isFinite(budgetCap) && budgetCap >= 0 ? budgetCap : null;
  const remaining = cap !== null ? Math.max(0, round2(cap - breakdown.total)) : 0;

  return {
    accommodation: breakdown.accommodation,
    food: breakdown.food,
    transportation: breakdown.transportation,
    activity: breakdown.activity,
    other: breakdown.other,
    total: breakdown.total,
    remaining,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/** A validated budget breakdown (used as the JSON shape in BudgetPlan). */
export interface BudgetBreakdown {
  accommodation: number;
  food: number;
  transportation: number;
  activity: number;
  other: number;
  total: number;
  remaining: number;
}

/** A persisted budget plan row for a single trip. */
export interface BudgetPlanRow {
  accommodation: number;
  food: number;
  transportation: number;
  activity: number;
  other: number;
  total: number;
  remaining: number;
  createdAt: string;
  updatedAt: string;
}

export function validateBudget(row: Partial<BudgetBreakdown>): row is BudgetBreakdown {
  const keys = ["accommodation", "food", "transportation", "activity", "other", "total", "remaining"] as const;
  return (
    typeof row === "object" &&
    row !== null &&
    keys.every((k) => typeof row[k] === "number" && Number.isFinite(row[k]) && row[k] >= 0)
  );
}

/** Round a monetary value to two decimals. */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Compute the number of nights between two dates. */
export function nightsFromDates(start: Date, end: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / msPerDay) - 1);
}
