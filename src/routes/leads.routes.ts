import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { LeadsService } from '../services/leads.service';
import { LeadStatus } from '../database/entities/Lead';

const router = Router();
const leadsService = new LeadsService();

const handleValidationErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: 'Validation failed', message: 'Please check your input data', details: errors.array() });
    return true;
  }
  return false;
};

/**
 * POST /api/leads
 * Public — capture an assessment submission from the landing page.
 */
router.post('/', [
  body('name').isString().trim().notEmpty().withMessage('name is required'),
  body('email').isEmail().withMessage('a valid email is required'),
  body('age').optional({ nullable: true }).isString(),
  body('gender').optional({ nullable: true }).isString(),
  body('height').optional({ nullable: true }),
  body('weight').optional({ nullable: true }),
  body('activityLevel').optional({ nullable: true }).isString(),
  body('goal').optional({ nullable: true }).isString(),
  body('experience').optional({ nullable: true }).isString(),
  body('bmi').optional({ nullable: true }),
  body('locale').optional({ nullable: true }).isString(),
], async (req: Request, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const result = await leadsService.createLead(req.body);
    res.status(result.success ? 201 : 500).json(result);
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ error: 'Failed to submit assessment', message: 'Internal server error' });
  }
});

/**
 * GET /api/leads
 * Admin — paginated list of captured leads.
 */
router.get('/', authenticate, requireAdmin, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(Object.values(LeadStatus)),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as LeadStatus | undefined;

    const result = await leadsService.listLeads(page, limit, status);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('List leads error:', error);
    res.status(500).json({ error: 'Failed to list leads', message: 'Internal server error' });
  }
});

/**
 * PATCH /api/leads/:id/status
 * Admin — update a lead's status (new / contacted / converted / archived).
 */
router.patch('/:id/status', authenticate, requireAdmin, [
  param('id').isUUID().withMessage('id must be a valid UUID'),
  body('status').isIn(Object.values(LeadStatus)).withMessage('invalid status'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const result = await leadsService.updateLeadStatus(req.params.id, req.body.status);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error('Update lead status error:', error);
    res.status(500).json({ error: 'Failed to update lead status', message: 'Internal server error' });
  }
});

export default router;
