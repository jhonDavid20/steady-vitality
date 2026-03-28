import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticate, requireCoach, AuthenticatedRequest } from '../middleware/auth';
import { CoachesService } from '../services/coaches.service';

const router = Router();
const coachesService = new CoachesService();

const handleValidationErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: 'Validation failed', message: 'Please check your input data', details: errors.array() });
    return true;
  }
  return false;
};

const validateCoachProfile = [
  body('bio').optional().isString().trim().isLength({ max: 2000 }).withMessage('Bio must be under 2000 characters'),
  body('specialties').optional().isArray().withMessage('Specialties must be an array'),
  body('specialties.*').optional().isString().trim(),
  body('sessionRateUSD').optional().isFloat({ min: 0 }).withMessage('Session rate must be a non-negative number'),
  body('certifications').optional().isArray().withMessage('Certifications must be an array'),
  body('certifications.*').optional().isString().trim(),
  body('acceptingClients').optional().isBoolean().withMessage('acceptingClients must be a boolean'),
];

// ─── Public ──────────────────────────────────────────────────────────────────

/**
 * GET /api/coaches
 * Public list of coaches accepting clients.
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
], async (req: Request, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await coachesService.listCoaches(page, limit);

    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('List coaches error:', error);
    res.status(500).json({ error: 'Failed to list coaches', message: 'Internal server error' });
  }
});

// ─── Authenticated: coach-specific – MUST come before /:id ───────────────────

/**
 * GET /api/coaches/me
 * Coach's own profile.
 */
router.get('/me', authenticate, requireCoach, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await coachesService.getMyCoachProfile(req.user!.id);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error('Get my coach profile error:', error);
    res.status(500).json({ error: 'Failed to get coach profile', message: 'Internal server error' });
  }
});

/**
 * POST /api/coaches/me
 * Create CoachProfile for the current user.
 */
router.post('/me', authenticate, requireCoach, validateCoachProfile, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const result = await coachesService.createCoachProfile(req.user!.id, req.body);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error('Create coach profile error:', error);
    res.status(500).json({ error: 'Failed to create coach profile', message: 'Internal server error' });
  }
});

/**
 * PATCH /api/coaches/me
 * Update CoachProfile fields.
 */
router.patch('/me', authenticate, requireCoach, validateCoachProfile, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const result = await coachesService.updateCoachProfile(req.user!.id, req.body);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error('Update coach profile error:', error);
    res.status(500).json({ error: 'Failed to update coach profile', message: 'Internal server error' });
  }
});

/**
 * GET /api/coaches/me/clients
 * List active clients with their profiles.
 */
router.get('/me/clients', authenticate, requireCoach, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await coachesService.getCoachClients(req.user!.id, page, limit);

    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Get coach clients error:', error);
    res.status(500).json({ error: 'Failed to get clients', message: 'Internal server error' });
  }
});

/**
 * GET /api/coaches/me/dashboard
 * Summary stats for the coach.
 */
router.get('/me/dashboard', authenticate, requireCoach, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await coachesService.getCoachDashboard(req.user!.id);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Get coach dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard', message: 'Internal server error' });
  }
});

// ─── Public: parameterised – MUST come after /me routes ──────────────────────

/**
 * GET /api/coaches/:id
 * Public coach profile by userId.
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await coachesService.getCoachByUserId(req.params.id);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error('Get coach by id error:', error);
    res.status(500).json({ error: 'Failed to get coach profile', message: 'Internal server error' });
  }
});

export default router;
