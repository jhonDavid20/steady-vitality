import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticate, requireCoach, AuthenticatedRequest } from '../middleware/auth';
import { RelationshipsService } from '../services/relationships.service';

const router = Router();
const relationshipsService = new RelationshipsService();

const handleValidationErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: 'Validation failed', message: 'Please check your input data', details: errors.array() });
    return true;
  }
  return false;
};

// ─── Static paths – MUST come before /:id routes ─────────────────────────────

/**
 * GET /api/relationships/my-coach
 * Client's active coach info.
 */
router.get('/my-coach', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await relationshipsService.getMyCoach(req.user!.id);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error('Get my coach error:', error);
    res.status(500).json({ error: 'Failed to get coach info', message: 'Internal server error' });
  }
});

/**
 * GET /api/relationships/pending
 * Coach sees list of pending requests.
 */
router.get('/pending', authenticate, requireCoach, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await relationshipsService.getPendingRequests(req.user!.id, page, limit);

    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ error: 'Failed to get pending requests', message: 'Internal server error' });
  }
});

/**
 * POST /api/relationships/request
 * Client sends a coach request.
 */
router.post('/request', authenticate, [
  body('coachId').isUUID().withMessage('coachId must be a valid UUID'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const result = await relationshipsService.requestCoach(req.user!.id, req.body.coachId);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error('Request coach error:', error);
    res.status(500).json({ error: 'Failed to send request', message: 'Internal server error' });
  }
});

// ─── Parameterised ───────────────────────────────────────────────────────────

/**
 * PATCH /api/relationships/:id/accept
 * Coach accepts a pending request.
 */
router.patch('/:id/accept', authenticate, requireCoach, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await relationshipsService.acceptRelationship(req.params.id, req.user!.id);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error('Accept relationship error:', error);
    res.status(500).json({ error: 'Failed to accept request', message: 'Internal server error' });
  }
});

/**
 * PATCH /api/relationships/:id/decline
 * Coach declines a pending request.
 */
router.patch('/:id/decline', authenticate, requireCoach, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await relationshipsService.declineRelationship(req.params.id, req.user!.id);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error('Decline relationship error:', error);
    res.status(500).json({ error: 'Failed to decline request', message: 'Internal server error' });
  }
});

/**
 * PATCH /api/relationships/:id/end
 * Either party ends an active relationship.
 */
router.patch('/:id/end', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await relationshipsService.endRelationship(req.params.id, req.user!.id);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error('End relationship error:', error);
    res.status(500).json({ error: 'Failed to end relationship', message: 'Internal server error' });
  }
});

export default router;
