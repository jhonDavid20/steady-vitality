import { z } from "zod";

/**
 * Onboarding contracts (client fitness profile + coach profile).
 * Enum values mirror the backend entities exactly (UserProfile / CoachProfile).
 */

export const FITNESS_GOALS = [
  "weight_loss",
  "muscle_gain",
  "maintenance",
  "strength",
  "endurance",
  "flexibility",
  "general_fitness",
] as const;
export type FitnessGoal = (typeof FITNESS_GOALS)[number];

export const PROFILE_ACTIVITY_LEVELS = [
  "sedentary",
  "lightly_active",
  "moderately_active",
  "very_active",
  "extremely_active",
] as const;
export type ProfileActivityLevel = (typeof PROFILE_ACTIVITY_LEVELS)[number];

export const PROFILE_GENDERS = ["male", "female", "other", "prefer_not_to_say"] as const;
export type ProfileGender = (typeof PROFILE_GENDERS)[number];

export const COACHING_TYPES = ["online", "in_person", "hybrid"] as const;
export type CoachingType = (typeof COACHING_TYPES)[number];

// ── Client onboarding ────────────────────────────────────────────────────────

export const clientOnboardingSchema = z.object({
  // Goal
  fitnessGoal: z.enum(FITNESS_GOALS),
  activityLevel: z.enum(PROFILE_ACTIVITY_LEVELS),
  // Physical data
  dateOfBirth: z.string().min(1, "Requerido"), // YYYY-MM-DD
  gender: z.enum(PROFILE_GENDERS),
  height: z.coerce.number().min(50, "50–300 cm").max(300, "50–300 cm"),
  weight: z.coerce.number().min(30, "30–500 kg").max(500, "30–500 kg"),
  targetWeight: z.coerce.number().min(30).max(500).optional(),
  // Health (optional)
  medicalConditions: z.array(z.string()).optional(),
  injuries: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  // Preferences (optional)
  preferredWorkoutTime: z.string().optional(),
  gymLocation: z.string().optional(),
  timezone: z.string().optional(),
  phone: z.string().optional(),
});
export type ClientOnboardingInput = z.infer<typeof clientOnboardingSchema>;

// ── Coach onboarding ─────────────────────────────────────────────────────────

export const coachOnboardingSchema = z.object({
  profileHeadline: z.string().max(160).optional(),
  bio: z.string().max(2000).optional(),
  specialties: z.array(z.string()).optional(),
  coachingType: z.enum(COACHING_TYPES).optional(),
  yearsOfExperience: z.coerce.number().int().min(0).max(60).optional(),
  sessionRateUSD: z.coerce.number().min(0).optional(),
  acceptingClients: z.boolean().optional(),
});
export type CoachOnboardingInput = z.infer<typeof coachOnboardingSchema>;
