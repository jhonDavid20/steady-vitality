import { Router, Response } from 'express';
import { z } from 'zod';
import {
  coachingMessageInputSchema,
  localDateSchema,
  mealCompletionInputSchema,
  mediaUploadInputSchema,
  nutritionAssignmentInputSchema,
  nutritionPlanInputSchema,
  waterLogInputSchema,
} from '@steady/shared';
import { authenticate, AuthenticatedRequest, requireClient, requireCoach, requireEmailVerified } from '../middleware/auth';
import { DailyService } from '../services/daily.service';
import { MediaService } from '../services/media.service';

const router = Router();
const service = new DailyService();
const media = new MediaService();
const protectedRoute = [authenticate, requireEmailVerified];

function failure(res: Response, error: unknown) {
  const message = error instanceof Error ? error.message : 'Daily request failed';
  res.status(message.includes('not found') ? 404 : 400).json({ success: false, message });
}

router.get('/nutrition/plans', ...protectedRoute, requireCoach, async (req: AuthenticatedRequest, res) => {
  res.json({ success: true, data: await service.listNutritionPlans(req.user!.id) });
});
router.post('/nutrition/plans', ...protectedRoute, requireCoach, async (req: AuthenticatedRequest, res) => {
  const parsed = nutritionPlanInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, details: parsed.error.flatten() });
  res.status(201).json({ success: true, data: await service.createNutritionPlan(req.user!.id, parsed.data) });
});
router.put('/nutrition/plans/:id', ...protectedRoute, requireCoach, async (req: AuthenticatedRequest, res) => {
  const parsed = nutritionPlanInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, details: parsed.error.flatten() });
  const data = await service.updateNutritionPlan(req.user!.id, req.params.id, parsed.data);
  res.status(data ? 200 : 404).json({ success: Boolean(data), data });
});
router.post('/nutrition/assignments', ...protectedRoute, requireCoach, async (req: AuthenticatedRequest, res) => {
  const parsed = nutritionAssignmentInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, details: parsed.error.flatten() });
  try { res.status(201).json({ success: true, data: await service.assignNutritionPlan(req.user!.id, parsed.data) }); } catch (error) { failure(res, error); }
});
router.put('/nutrition/completions', ...protectedRoute, requireClient, async (req: AuthenticatedRequest, res) => {
  const parsed = mealCompletionInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, details: parsed.error.flatten() });
  try { res.json({ success: true, data: await service.setMealCompletion(req.user!.id, parsed.data) }); } catch (error) { failure(res, error); }
});
router.put('/water', ...protectedRoute, requireClient, async (req: AuthenticatedRequest, res) => {
  const parsed = waterLogInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, details: parsed.error.flatten() });
  res.json({ success: true, data: await service.setWater(req.user!.id, parsed.data) });
});
router.get('/today', ...protectedRoute, requireClient, async (req: AuthenticatedRequest, res) => {
  const parsed = localDateSchema.safeParse(req.query.date);
  if (!parsed.success) return res.status(400).json({ success: false, message: 'date must use YYYY-MM-DD' });
  res.json({ success: true, data: await service.getToday(req.user!.id, parsed.data) });
});
router.get('/clients/:clientId/progress', ...protectedRoute, requireCoach, async (req: AuthenticatedRequest, res) => {
  const parsed = z.object({ from: localDateSchema, to: localDateSchema }).safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ success: false, message: 'from and to must use YYYY-MM-DD' });
  try { res.json({ success: true, data: await service.getClientProgress(req.user!.id, req.params.clientId, parsed.data.from, parsed.data.to) }); } catch (error) { failure(res, error); }
});
router.get('/messages/:peerId', ...protectedRoute, async (req: AuthenticatedRequest, res) => {
  const parsed = z.string().uuid().safeParse(req.params.peerId);
  if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid peer id' });
  const pagination = z.object({ before: z.string().datetime().optional(), limit: z.coerce.number().int().min(1).max(100).default(50) }).safeParse(req.query);
  if (!pagination.success) return res.status(400).json({ success: false, message: 'Invalid pagination' });
  try { res.json({ success: true, data: await service.getConversation(req.user!.id, parsed.data, pagination.data.before, pagination.data.limit) }); } catch (error) { failure(res, error); }
});
router.get('/messages', ...protectedRoute, async (req: AuthenticatedRequest, res) => {
  res.json({ success: true, data: await service.listPeers(req.user!.id) });
});
router.post('/messages', ...protectedRoute, async (req: AuthenticatedRequest, res) => {
  const parsed = coachingMessageInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, details: parsed.error.flatten() });
  try { res.status(201).json({ success: true, data: await service.sendMessage(req.user!.id, parsed.data) }); } catch (error) { failure(res, error); }
});
router.post('/media/upload-url', ...protectedRoute, async (req: AuthenticatedRequest, res) => {
  const parsed = mediaUploadInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, details: parsed.error.flatten() });
  try { res.json({ success: true, data: await media.createUpload(req.user!.id, parsed.data.contentType, parsed.data.size) }); } catch (error) { failure(res, error); }
});

export default router;
