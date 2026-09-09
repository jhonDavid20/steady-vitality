import { z } from 'zod';

export const checkoutInputSchema = z.object({ packageId: z.string().uuid(), locale: z.enum(['en', 'es']).default('en') });
export const matchingInputSchema = z.object({
  fitnessGoal: z.string().trim().min(1).max(50),
  activityLevel: z.string().trim().min(1).max(50),
  communicationPreference: z.enum(['messages', 'calls', 'mixed']),
  trainingExperience: z.enum(['beginner', 'intermediate', 'advanced']),
});

export type MatchingInput = z.infer<typeof matchingInputSchema>;
