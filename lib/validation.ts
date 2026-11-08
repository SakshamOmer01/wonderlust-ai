/**
 * Zod validation schemas for Wonderlust API request bodies.
 *
 * Every write endpoint validates its input against one of these schemas before
 * touching the database, so handlers can rely on strongly typed, sanitised data.
 */

import { z } from "zod";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Email address is too long")
  .regex(EMAIL_PATTERN, "Please enter a valid email address");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be 72 characters or fewer");

const dateSchema = z
  .string()
  .refine((value) => !Number.isNaN(new Date(value).getTime()), "Invalid date");

const budgetSchema = z.enum(["budget", "standard", "luxury"], {
  message: "Budget must be 'budget', 'standard' or 'luxury'",
});

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    name: z.string().trim().min(1).max(80).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(20, "Invalid reset token").max(200),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1, "Name cannot be empty").max(80).optional(),
    avatar: z.string().trim().max(2048).optional(),
    bio: z.string().trim().max(500).optional(),
    website: z.string().trim().max(2048).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });

export const itineraryItemSchema = z.object({
  dayNumber: z.number().int().min(1).max(365),
  activity: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).optional(),
  startTime: z.string().trim().max(16).optional(),
  endTime: z.string().trim().max(16).optional(),
  location: z.string().trim().max(160).optional(),
});

export const createTripSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(120),
    destinationId: z.string().trim().min(1, "Destination is required"),
    startDate: dateSchema,
    endDate: dateSchema,
    travelers: z.number().int().min(1).max(50).default(1),
    budget: budgetSchema,
    durationDays: z.number().int().min(1).max(365).optional(),
    image: z.string().trim().max(2048).optional(),
    price: z.number().min(0).max(1_000_000).optional(),
    itinerary: z.array(itineraryItemSchema).max(100).optional(),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after the start date",
    path: ["endDate"],
  });

export const updateTripSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    destinationId: z.string().trim().min(1).optional(),
    startDate: dateSchema.optional(),
    endDate: dateSchema.optional(),
    travelers: z.number().int().min(1).max(50).optional(),
    budget: budgetSchema.optional(),
    durationDays: z.number().int().min(1).max(365).optional(),
    image: z.string().trim().max(2048).optional(),
    price: z.number().min(0).max(1_000_000).optional(),
    isFavorite: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  })
  .refine(
    (data) =>
      !data.startDate ||
      !data.endDate ||
      new Date(data.endDate) > new Date(data.startDate),
    { message: "End date must be after the start date", path: ["endDate"] }
  );

export const saveDestinationSchema = z.object({
  destinationId: z.string().trim().min(1, "Destination is required"),
});

export const createBookingSchema = z.object({
  tripId: z.string().trim().min(1, "Trip is required"),
  travelers: z.number().int().min(1).max(50).optional(),
});

export const updateBookingSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "completed"], {
    message: "Invalid booking status",
  }),
});

export const createReviewSchema = z
  .object({
    destinationId: z.string().trim().min(1).optional(),
    tripId: z.string().trim().min(1).optional(),
    rating: z
      .number()
      .int("Rating must be a whole number")
      .min(1, "Rating must be between 1 and 5")
      .max(5, "Rating must be between 1 and 5"),
    comment: z.string().trim().max(2000).optional(),
  })
  .refine((data) => data.destinationId || data.tripId, {
    message: "A destination or trip is required",
    path: ["destinationId"],
  });

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
