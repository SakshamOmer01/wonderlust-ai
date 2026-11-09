import Link from "next/link";
import { TripPlannerForm } from "@/components/tripplanner/TripPlannerForm";

export default function TripsPage() {
  // The site header is fixed, so the page needs top padding of its own.
  return (
    <div className="pt-20">
      <TripPlannerForm />
    </div>
  );
}
