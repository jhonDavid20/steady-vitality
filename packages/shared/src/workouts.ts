import { z } from 'zod';

export const localDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const exerciseInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  muscleGroup: z.string().trim().min(1).max(100),
  description: z.string().trim().max(2000).nullable().optional(),
  videoUrl: z.string().url().max(500).nullable().optional(),
});
export const workoutPlanItemSchema = z.object({
  exerciseId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  order: z.number().int().min(0),
});
export const workoutPlanInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).nullable().optional(),
  items: z.array(workoutPlanItemSchema).min(1),
});
export const workoutAssignmentInputSchema = z.object({
  planId: z.string().uuid(),
  clientId: z.string().uuid(),
  timezone: z.string().trim().min(1).max(100),
  startsOn: localDateSchema,
  endsOn: localDateSchema.nullable().optional(),
});
export const workoutCompletionInputSchema = z.object({
  assignmentId: z.string().uuid(),
  actionId: z.string().uuid(),
  localDate: localDateSchema,
  completed: z.boolean(),
});

export type ExerciseInput = z.infer<typeof exerciseInputSchema>;
export type WorkoutPlanInput = z.infer<typeof workoutPlanInputSchema>;
export type WorkoutAssignmentInput = z.infer<typeof workoutAssignmentInputSchema>;
export type WorkoutCompletionInput = z.infer<typeof workoutCompletionInputSchema>;
