import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, requireCoach, requireClient, AuthenticatedRequest } from '../middleware/auth';
import { CoachesService } from '../services/coaches.service';
import { CoachingType } from '../database/entities/CoachProfile';

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
  // ── Original fields ───────────────────────────────────────────────────────
  body('bio').optional().isString().trim().isLength({ max: 2000 }).withMessage('Bio must be under 2000 characters'),
  body('specialties').optional().isArray().withMessage('Specialties must be an array'),
  body('specialties.*').optional().isString().trim(),
  body('sessionRateUSD').optional().isFloat({ min: 0 }).withMessage('Session rate must be a non-negative number'),
  body('certifications').optional().isArray().withMessage('Certifications must be an array'),
  body('certifications.*').optional().isString().trim(),
  body('acceptingClients').optional().isBoolean().withMessage('acceptingClients must be a boolean'),

  // ── Professional identity ─────────────────────────────────────────────────
  body('profileHeadline').optional().isString().trim().isLength({ max: 160 }).withMessage('Headline must be under 160 characters'),
  body('yearsOfExperience').optional().isInt({ min: 0, max: 60 }).withMessage('Years of experience must be 0–60'),
  body('coachingType').optional().isIn(Object.values(CoachingType)).withMessage(`coachingType must be one of: ${Object.values(CoachingType).join(', ')}`),
  body('trainingModalities').optional().isArray().withMessage('trainingModalities must be an array'),
  body('trainingModalities.*').optional().isString().trim(),
  body('targetClientTypes').optional().isArray().withMessage('targetClientTypes must be an array'),
  body('targetClientTypes.*').optional().isString().trim(),
  body('languagesSpoken').optional().isArray().withMessage('languagesSpoken must be an array'),
  body('languagesSpoken.*').optional().isString().trim(),

  // ── Scheduling & availability ─────────────────────────────────────────────
  body('timezone').optional().isString().trim().isLength({ max: 64 }).withMessage('Invalid timezone string'),
  body('sessionDurationMinutes').optional().isInt({ min: 15, max: 480 }).withMessage('Session duration must be 15–480 minutes'),
  body('maxClientCapacity').optional().isInt({ min: 1 }).withMessage('maxClientCapacity must be at least 1'),
  body('trialSessionAvailable').optional().isBoolean().withMessage('trialSessionAvailable must be a boolean'),
  body('trialSessionRateUSD').optional().isFloat({ min: 0 }).withMessage('Trial session rate must be non-negative'),

  // ── Media & social proof ──────────────────────────────────────────────────
  body('videoIntroUrl').optional({ nullable: true }).isURL().withMessage('videoIntroUrl must be a valid URL'),
  body('websiteUrl').optional({ nullable: true }).isURL().withMessage('websiteUrl must be a valid URL'),
  body('instagramHandle').optional().isString().trim().isLength({ max: 100 }).withMessage('Instagram handle must be under 100 characters'),

  // ── Business ─────────────────────────────────────────────────────────────
  body('totalClientsTrained').optional().isInt({ min: 0 }).withMessage('totalClientsTrained must be a non-negative integer'),
];

// ─── Public ──────────────────────────────────────────────────────────────────

/**
 * GET /api/coaches
 * Public list of coaches accepting clients.
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('coachingType').optional().isIn(Object.values(CoachingType)).withMessage(`coachingType must be one of: ${Object.values(CoachingType).join(', ')}`),
  query('trialOnly').optional().isBoolean().withMessage('trialOnly must be true or false'),
  query('search').optional().isString().trim().isLength({ max: 100 }),
], async (req: Request, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const page  = parseInt(req.query.page  as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const filters = {
      coachingType: req.query.coachingType as CoachingType | undefined,
      trialOnly:    req.query.trialOnly === 'true',
      search:       req.query.search as string | undefined,
    };

    const result = await coachesService.listCoaches(page, limit, filters);
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
 * List clients linked to this coach via users.coachId.
 */
router.get('/me/clients', authenticate, requireCoach, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const page  = parseInt(req.query.page  as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await coachesService.getLinkedClients(req.user!.id, page, limit);

    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Get coach clients error:', error);
    res.status(500).json({ error: 'Failed to get clients', message: 'Internal server error' });
  }
});

/**
 * GET /api/coaches/me/clients/:clientId
 * Returns a single client's full profile. Client must be linked to the authenticated coach.
 */
router.get('/me/clients/:clientId', authenticate, requireCoach, [
  param('clientId').isUUID().withMessage('clientId must be a valid UUID'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const result = await coachesService.getLinkedClient(req.user!.id, req.params.clientId);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error('Get single client error:', error);
    res.status(500).json({ error: 'Failed to get client', message: 'Internal server error' });
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

/**
 * GET /api/coaches/me/stats
 * Coach dashboard stats.
 */
router.get('/me/stats', authenticate, requireCoach, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await coachesService.getCoachStats(req.user!.id);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Get coach stats error:', error);
    res.status(500).json({ error: 'Failed to get stats', message: 'Internal server error' });
  }
});

/**
 * GET /api/coaches/me/clients (new — via User.coachId)
 * Coach gets the list of clients linked to them.
 */
router.get('/me/linked-clients', authenticate, requireCoach, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const page  = parseInt(req.query.page  as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await coachesService.getLinkedClients(req.user!.id, page, limit);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Get linked clients error:', error);
    res.status(500).json({ error: 'Failed to get clients', message: 'Internal server error' });
  }
});

/**
 * POST /api/coaches/connection-requests
 * Client sends a connection request to a coach.
 */
router.post('/connection-requests', authenticate, requireClient, [
  body('coachId').isUUID().withMessage('coachId must be a valid UUID'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const result = await coachesService.sendConnectionRequest(req.user!.id, req.body.coachId);
    const status = result.success ? 201
      : (result as any).errorCode === 'ALREADY_HAS_COACH' ? 409
      : result.message?.includes('already exists') || result.message?.includes('already connected') ? 409
      : 400;
    res.status(status).json(result);
  } catch (error) {
    console.error('Send connection request error:', error);
    res.status(500).json({ error: 'Failed to send request', message: 'Internal server error' });
  }
});

/**
 * GET /api/coaches/me/connection-requests
 * Coach gets their pending connection requests.
 */
router.get('/me/connection-requests', authenticate, requireCoach, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await coachesService.getConnectionRequests(req.user!.id);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Get connection requests error:', error);
    res.status(500).json({ error: 'Failed to get requests', message: 'Internal server error' });
  }
});

/**
 * PATCH /api/coaches/me/connection-requests/:requestId
 * Coach accepts or declines a connection request.
 */
router.patch('/me/connection-requests/:requestId', authenticate, requireCoach, [
  param('requestId').isUUID().withMessage('requestId must be a valid UUID'),
  body('action').isIn(['accept', 'decline']).withMessage('action must be "accept" or "decline"'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const result = await coachesService.respondToConnectionRequest(
      req.user!.id,
      req.params.requestId,
      req.body.action as 'accept' | 'decline',
    );
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Respond to connection request error:', error);
    res.status(500).json({ error: 'Failed to respond to request', message: 'Internal server error' });
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
