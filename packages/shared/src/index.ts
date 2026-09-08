import { z } from "zod";

export * from "./auth";
export * from "./onboarding";
export * from "./workouts";
export * from "./daily";
export * from "./commerce";

/**
 * @steady/shared — single source of truth for cross-app contracts.
 *
 * Both the web app (landing / assessment form) and the API (leads endpoint)
 * import the schemas and types from here, so the assessment payload can never
 * drift between frontend and backend again.
 */

// ── Domain option sets ───────────────────────────────────────────────────────

export const GENDERS = ["male", "female", "other"] as const;
export type Gender = (typeof GENDERS)[number];

export const ACTIVITY_LEVELS = [
  "sedentary",
  "light",
  "moderate",
  "very-active",
  "extremely-active",
] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

export const GOALS = [
  "lose-weight",
  "build-muscle",
  "tone-up",
  "improve-fitness",
  "maintain-weight",
  "athletic-performance",
] as const;
export type Goal = (typeof GOALS)[number];

export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const LEAD_STATUSES = ["new", "contacted", "converted", "archived"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

// ── Assessment form (web) ────────────────────────────────────────────────────

/**
 * Shape the landing assessment form binds to (react-hook-form).
 * All fields are strings because they come straight from inputs/selects.
 * Replaces the interface that used to be duplicated across three files.
 */
export interface AssessmentFormValues {
  name: string;
  email: string;
  age: string;
  gender: string;
  height: string;
  weight: string;
  activityLevel: string;
  goal: string;
  experience: string;
}

// ── Assessment payload (web → API) ───────────────────────────────────────────

/**
 * What the client sends and the API validates. `name`/`email` are required;
 * everything else is optional. Height/weight/bmi accept string or number so the
 * raw form values pass through and the API coerces.
 */
export const assessmentPayloadSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  email: z.string().trim().email("a valid email is required"),
  age: z.string().trim().optional().nullable(),
  gender: z.string().trim().optional().nullable(),
  height: z.union([z.string(), z.number()]).optional().nullable(),
  weight: z.union([z.string(), z.number()]).optional().nullable(),
  activityLevel: z.string().trim().optional().nullable(),
  goal: z.string().trim().optional().nullable(),
  experience: z.string().trim().optional().nullable(),
  bmi: z.union([z.string(), z.number()]).optional().nullable(),
  locale: z.string().trim().optional().nullable(),
});

export type AssessmentPayload = z.infer<typeof assessmentPayloadSchema>;

// ── Generic API envelope ─────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

/** BMI = weight(kg) / height(m)^2, rounded to one decimal. */
export function computeBmi(
  heightCm: number | null | undefined,
  weightKg: number | null | undefined,
): number | null {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;
  const meters = heightCm / 100;
  return Math.round((weightKg / (meters * meters)) * 10) / 10;
}
