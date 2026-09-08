import { Router, Response } from 'express';
import { z } from 'zod';
import { exerciseInputSchema, localDateSchema, workoutAssignmentInputSchema, workoutCompletionInputSchema, workoutPlanInputSchema } from '@steady/shared';
import { authenticate, AuthenticatedRequest, requireClient, requireCoach, requireEmailVerified } from '../middleware/auth';
import { WorkoutsService } from '../services/workouts.service';

const router = Router();
const service = new WorkoutsService();
const protectedRoute = [authenticate, requireEmailVerified];

function failure(res: Response, error: unknown) {
  const message = error instanceof Error ? error.message : 'Workout request failed';
  res.status(message.includes('not found') ? 404 : 400).json({ success: false, message });
}

router.get('/exercises', ...protectedRoute, requireCoach, async (req: AuthenticatedRequest, res) => {
  res.json({ success: true, data: await service.listExercises(req.user!.id) });
});
router.post('/exercises', ...protectedRoute, requireCoach, async (req: AuthenticatedRequest, res) => {
  const parsed = exerciseInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, details: parsed.error.flatten() });
  res.status(201).json({ success: true, data: await service.createExercise(req.user!.id, parsed.data) });
});
router.patch('/exercises/:id', ...protectedRoute, requireCoach, async (req: AuthenticatedRequest, res) => {
  const parsed = exerciseInputSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, details: parsed.error.flatten() });
  const data = await service.updateExercise(req.user!.id, req.params.id, parsed.data);
  res.status(data ? 200 : 404).json({ success: Boolean(data), data });
});
router.delete('/exercises/:id', ...protectedRoute, requireCoach, async (req: AuthenticatedRequest, res) => {
  const deleted = await service.deleteExercise(req.user!.id, req.params.id);
  res.status(deleted ? 204 : 404).send();
});

router.get('/plans', ...protectedRoute, requireCoach, async (req: AuthenticatedRequest, res) => {
  res.json({ success: true, data: await service.listPlans(req.user!.id) });
});
router.get('/clients', ...protectedRoute, requireCoach, async (req: AuthenticatedRequest, res) => {
  res.json({ success: true, data: await service.listClients(req.user!.id) });
});
router.post('/plans', ...protectedRoute, requireCoach, async (req: AuthenticatedRequest, res) => {
  const parsed = workoutPlanInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, details: parsed.error.flatten() });
  try { res.status(201).json({ success: true, data: await service.createPlan(req.user!.id, parsed.data) }); } catch (error) { failure(res, error); }
});
router.put('/plans/:id', ...protectedRoute, requireCoach, async (req: AuthenticatedRequest, res) => {
  const parsed = workoutPlanInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, details: parsed.error.flatten() });
  try {
    const data = await service.updatePlan(req.user!.id, req.params.id, parsed.data);
    res.status(data ? 200 : 404).json({ success: Boolean(data), data });
  } catch (error) { failure(res, error); }
});
router.post('/assignments', ...protectedRoute, requireCoach, async (req: AuthenticatedRequest, res) => {
  const parsed = workoutAssignmentInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, details: parsed.error.flatten() });
  try { res.status(201).json({ success: true, data: await service.assignPlan(req.user!.id, parsed.data) }); } catch (error) { failure(res, error); }
});

router.get('/today', ...protectedRoute, requireClient, async (req: AuthenticatedRequest, res) => {
  const parsed = localDateSchema.safeParse(req.query.date);
  if (!parsed.success) return res.status(400).json({ success: false, message: 'date must use YYYY-MM-DD' });
  res.json({ success: true, data: await service.getToday(req.user!.id, parsed.data) });
});
router.put('/completions', ...protectedRoute, requireClient, async (req: AuthenticatedRequest, res) => {
  const parsed = workoutCompletionInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, details: parsed.error.flatten() });
  try { res.json({ success: true, data: await service.setCompletion(req.user!.id, parsed.data) }); } catch (error) { failure(res, error); }
});
router.get('/clients/:clientId/adherence', ...protectedRoute, requireCoach, async (req: AuthenticatedRequest, res) => {
  const parsed = z.object({ from: localDateSchema, to: localDateSchema }).safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ success: false, message: 'from and to must use YYYY-MM-DD' });
  try { res.json({ success: true, data: await service.getClientAdherence(req.user!.id, req.params.clientId, parsed.data.from, parsed.data.to) }); } catch (error) { failure(res, error); }
});

export default router;
