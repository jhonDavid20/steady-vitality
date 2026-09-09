import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest, requireClient, requireEmailVerified } from '../middleware/auth';
import { RetentionService } from '../services/retention.service';

const router = Router();
const service = new RetentionService();
const protectedClient = [authenticate, requireEmailVerified, requireClient];
function failure(res: Response, error: unknown) { const message = error instanceof Error ? error.message : 'Retention request failed'; res.status(message.includes('not found') ? 404 : 400).json({ success: false, message }); }

router.post('/reviews', ...protectedClient, async (req: AuthenticatedRequest, res) => {
  const parsed = z.object({ clientPackageId: z.string().uuid(), rating: z.number().int().min(1).max(5), text: z.string().trim().max(3000).nullable().optional(), anonymous: z.boolean().optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, details: parsed.error.flatten() });
  try { res.status(201).json({ success: true, data: await service.createReview(req.user!.id, parsed.data) }); } catch (error) { failure(res, error); }
});
router.get('/reviews/coach/:coachId', async (req, res) => { res.json({ success: true, data: await service.listCoachReviews(req.params.coachId) }); });
router.get('/nudges', ...protectedClient, async (req: AuthenticatedRequest, res) => { res.json({ success: true, data: await service.getNudges(req.user!.id) }); });
export default router;
