import { z } from 'zod';
import { localDateSchema } from './workouts';

export const nutritionPlanItemSchema = z.object({
  mealId: z.string().uuid().optional(),
  dayOfWeek: z.number().int().min(0).max(6),
  order: z.number().int().min(0),
  mealType: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).nullable().optional(),
  calories: z.number().int().min(0).max(10000).nullable().optional(),
});
export const nutritionPlanInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  waterTargetMl: z.number().int().min(0).max(10000).default(2000),
  items: z.array(nutritionPlanItemSchema).min(1),
});
export const nutritionAssignmentInputSchema = z.object({
  planId: z.string().uuid(),
  clientId: z.string().uuid(),
  timezone: z.string().trim().min(1).max(100),
  startsOn: localDateSchema,
  endsOn: localDateSchema.nullable().optional(),
});
export const mealCompletionInputSchema = z.object({
  assignmentId: z.string().uuid(),
  mealId: z.string().uuid(),
  localDate: localDateSchema,
  completed: z.boolean(),
});
export const waterLogInputSchema = z.object({
  localDate: localDateSchema,
  amountMl: z.number().int().min(0).max(20000),
});
export const coachingMessageInputSchema = z.object({
  recipientId: z.string().uuid(),
  clientRequestId: z.string().uuid(),
  kind: z.enum(['message', 'check_in']).default('message'),
  body: z.string().trim().min(1).max(4000),
});
export const mediaUploadInputSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']),
  size: z.number().int().positive().max(50 * 1024 * 1024),
});

export type NutritionPlanInput = z.infer<typeof nutritionPlanInputSchema>;
export type NutritionAssignmentInput = z.infer<typeof nutritionAssignmentInputSchema>;
export type MealCompletionInput = z.infer<typeof mealCompletionInputSchema>;
export type WaterLogInput = z.infer<typeof waterLogInputSchema>;
export type CoachingMessageInput = z.infer<typeof coachingMessageInputSchema>;
