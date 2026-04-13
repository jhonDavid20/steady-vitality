import { Router, Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { authenticate, requireCoach, requireClient, AuthenticatedRequest } from '../middleware/auth';
import { PackagesService } from '../services/packages.service';
import { ClientPackageStatus } from '../database/entities/ClientPackage';

const router = Router();
const packagesService = new PackagesService();

const handleValidationErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: 'Validation failed', message: 'Please check your input data', details: errors.array() });
    return true;
  }
  return false;
};

const validatePackage = [
  body('name').isString().trim().isLength({ min: 1, max: 255 }).withMessage('Name is required (max 255 chars)'),
  body('description').optional().isString().trim().withMessage('Description must be a string'),
  body('durationWeeks').isInt({ min: 1 }).withMessage('durationWeeks must be a positive integer'),
  body('sessionsIncluded').isInt({ min: 1 }).withMessage('sessionsIncluded must be a positive integer'),
  body('priceUSD').isFloat({ min: 0 }).withMessage('priceUSD must be a non-negative number'),
  body('features').optional({ nullable: true }).isArray().withMessage('features must be an array'),
  body('features.*').optional().isString().trim().withMessage('Each feature must be a string'),
];

const validatePackageUpdate = [
  body('name').optional().isString().trim().isLength({ min: 1, max: 255 }).withMessage('Name must be 1-255 chars'),
  body('description').optional().isString().trim(),
  body('durationWeeks').optional().isInt({ min: 1 }).withMessage('durationWeeks must be a positive integer'),
  body('sessionsIncluded').optional().isInt({ min: 1 }).withMessage('sessionsIncluded must be a positive integer'),
  body('priceUSD').optional().isFloat({ min: 0 }).withMessage('priceUSD must be a non-negative number'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('features').optional({ nullable: true }).isArray().withMessage('features must be an array'),
  body('features.*').optional().isString().trim().withMessage('Each feature must be a string'),
];

// ─── Static paths – MUST come before /:id routes ─────────────────────────────

/**
 * GET /api/packages/me/active
 * Client's currently active package — full enriched shape including endDate.
 */
router.get('/me/active', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await packagesService.getClientActivePackage(req.user!.id);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error('Get active package error:', error);
    res.status(500).json({ error: 'Failed to get active package', message: 'Internal server error' });
  }
});

/**
 * GET /api/packages/coach/:coachId
 * Public list of a coach's active packages.
 */
router.get('/coach/:coachId', [
  param('coachId').isUUID().withMessage('coachId must be a valid UUID'),
], async (req: Request, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const result = await packagesService.listCoachPackages(req.params.coachId);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error('List coach packages error:', error);
    res.status(500).json({ error: 'Failed to list packages', message: 'Internal server error' });
  }
});

/**
 * PATCH /api/packages/client/:id/status
 * Coach updates a client package's status (pending → active, active → completed/cancelled).
 */
router.patch('/client/:id/status', authenticate, requireCoach, [
  param('id').isUUID().withMessage('id must be a valid UUID'),
  body('status')
    .isIn(Object.values(ClientPackageStatus))
    .withMessage(`status must be one of: ${Object.values(ClientPackageStatus).join(', ')}`),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const result = await packagesService.updateClientPackageStatus(
      req.user!.id,
      req.params.id,
      req.body.status as ClientPackageStatus,
    );
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error('Update client package status error:', error);
    res.status(500).json({ error: 'Failed to update status', message: 'Internal server error' });
  }
});

/**
 * PATCH /api/packages/client/:id
 * Coach updates notes, goals, and/or sessionsCompleted on an existing assignment.
 * Auth: bearer token must belong to the assigned coach.
 */
router.patch('/client/:id', authenticate, requireCoach, [
  param('id').isUUID().withMessage('id must be a valid UUID'),
  body('notes')
    .optional({ nullable: true })
    .isString()
    .trim()
    .withMessage('notes must be a string'),
  body('goals')
    .optional({ nullable: true })
    .isArray()
    .withMessage('goals must be an array'),
  body('goals.*')
    .optional()
    .isString()
    .trim()
    .withMessage('Each goal must be a string'),
  body('sessionsCompleted')
    .optional()
    .isInt({ min: 0 })
    .withMessage('sessionsCompleted must be a non-negative integer'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { notes, goals, sessionsCompleted } = req.body;
    const result = await packagesService.updateClientPackage(
      req.user!.id,
      req.params.id,
      { notes, goals, sessionsCompleted },
    );
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error('Update client package error:', error);
    res.status(500).json({ error: 'Failed to update client package', message: 'Internal server error' });
  }
});

/**
 * POST /api/packages/:packageId/request
 * Client requests a package from their coach. Creates a ClientPackage with status = 'pending'.
 * Coach must activate it via PATCH /api/packages/client/:id/status.
 */
router.post('/:packageId/request', authenticate, requireClient, [
  param('packageId').isUUID().withMessage('packageId must be a valid UUID'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const result = await packagesService.requestPackage(req.user!.id, req.params.packageId);
    const httpStatus = (result as any).status ?? (result.success ? 201 : 400);
    res.status(httpStatus).json(
      result.success
        ? { message: result.message, clientPackage: (result as any).clientPackage }
        : { message: result.message },
    );
  } catch (error) {
    console.error('Request package error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/packages/client/:clientId
 * Coach fetches the most recent package assigned to one of their clients.
 */
router.get('/client/:clientId', authenticate, requireCoach, [
  param('clientId').isUUID().withMessage('clientId must be a valid UUID'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const result = await packagesService.getClientPackage(req.user!.id, req.params.clientId);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error('Get client package error:', error);
    res.status(500).json({ error: 'Failed to get client package', message: 'Internal server error' });
  }
});

// ─── Coach CRUD ───────────────────────────────────────────────────────────────

/**
 * POST /api/packages
 * Coach creates a package template.
 */
router.post('/', authenticate, requireCoach, validatePackage, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const result = await packagesService.createPackage(req.user!.id, req.body);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error('Create package error:', error);
    res.status(500).json({ error: 'Failed to create package', message: 'Internal server error' });
  }
});

/**
 * PATCH /api/packages/:id
 * Coach updates their own package template (including features).
 */
router.patch('/:id', authenticate, requireCoach, validatePackageUpdate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const result = await packagesService.updatePackage(req.user!.id, req.params.id, req.body);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error('Update package error:', error);
    res.status(500).json({ error: 'Failed to update package', message: 'Internal server error' });
  }
});

/**
 * DELETE /api/packages/:id
 * Coach soft-deletes (sets isActive false) a package.
 */
router.delete('/:id', authenticate, requireCoach, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await packagesService.deletePackage(req.user!.id, req.params.id);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error('Delete package error:', error);
    res.status(500).json({ error: 'Failed to delete package', message: 'Internal server error' });
  }
});

/**
 * POST /api/packages/:id/assign
 * Coach assigns a package to a client with optional notes, goals, and startDate.
 */
router.post('/:id/assign', authenticate, requireCoach, [
  param('id').isUUID().withMessage('id must be a valid UUID'),
  body('clientId').isUUID().withMessage('clientId must be a valid UUID'),
  body('startDate').optional().isISO8601().withMessage('startDate must be a valid ISO 8601 date'),
  body('notes').optional({ nullable: true }).isString().trim().withMessage('notes must be a string'),
  body('goals').optional({ nullable: true }).isArray().withMessage('goals must be an array'),
  body('goals.*').optional().isString().trim().withMessage('Each goal must be a string'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const result = await packagesService.assignPackage(req.user!.id, req.params.id, {
      clientId:  req.body.clientId,
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      notes:     req.body.notes,
      goals:     req.body.goals,
    });
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error('Assign package error:', error);
    res.status(500).json({ error: 'Failed to assign package', message: 'Internal server error' });
  }
});

export default router;
