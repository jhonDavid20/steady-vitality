import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { RelationshipsService } from '../services/relationships.service';

const router = Router();
const relationshipsService = new RelationshipsService();

/** GET /api/relationships/my-coach — client's active coach information. */
router.get('/my-coach', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await relationshipsService.getMyCoach(req.user!.id);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error('Get my coach error:', error);
    res.status(500).json({ error: 'Failed to get coach info', message: 'Internal server error' });
  }
});

/** PATCH /api/relationships/:id/end — either party ends an active relationship. */
router.patch('/:id/end', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await relationshipsService.endRelationship(req.params.id, req.user!.id);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('End relationship error:', error);
    res.status(500).json({ error: 'Failed to end relationship', message: 'Internal server error' });
  }
});

export default router;
