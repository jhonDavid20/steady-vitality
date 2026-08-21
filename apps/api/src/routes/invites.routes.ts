import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, requireAdmin, requireCoach, AuthenticatedRequest } from '../middleware/auth';
import { InvitesService } from '../services/invites.service';
import { AuthService } from '../services/auth.service';

const router = Router();
const invitesService = new InvitesService();
const authService    = new AuthService();

const handleValidationErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: 'Validation failed', message: 'Please check your input data', details: errors.array() });
    return true;
  }
  return false;
};

/**
 * POST /api/invites
 * Admin creates an invite for a coach-to-be.
 */
router.post('/', authenticate, requireAdmin, [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('A valid email address is required'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const result = await invitesService.create(req.body.email, req.user!);
    // 409 Conflict when the email is already a registered user
    const statusCode = result.success ? 201
      : result.message?.includes('already registered') ? 409
      : 400;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Create invite route error:', error);
    res.status(500).json({ error: 'Failed to create invite', message: 'Internal server error' });
  }
});

/**
 * GET /api/invites/validate/:token
 * Public — check if a token is valid before showing the registration form.
 */
router.get('/validate/:token', async (req: Request, res: Response) => {
  try {
    const result = await invitesService.validate(req.params.token);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Validate invite route error:', error);
    res.status(500).json({ error: 'Failed to validate invite', message: 'Internal server error' });
  }
});

/**
 * GET /api/invites
 * Admin lists all invites (paginated).
 */
router.get('/', authenticate, requireAdmin, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await invitesService.listAll(page, limit);

    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('List invites route error:', error);
    res.status(500).json({ error: 'Failed to list invites', message: 'Internal server error' });
  }
});

/**
 * POST /api/invites/client
 * Coach creates a client invite link.
 */
router.post('/client', authenticate, requireCoach, [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('A valid email address is required'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const result = await invitesService.createClientInvite(req.body.email, req.user!);

    if (!result.success) {
      const statusCode = result.message?.includes('already registered') ? 409
        : result.message?.includes('pending invite already exists') ? 409
        : 400;
      res.status(statusCode).json(result);
      return;
    }

    const inviteUrl = `${process.env.FRONTEND_URL ?? 'https://yourdomain.com'}/en/invite/client/${result.data!.token}`;
    res.status(201).json({
      success: true,
      message: 'Client invite created',
      token: result.data!.token,
      inviteUrl,
    });
  } catch (error) {
    console.error('Create client invite route error:', error);
    res.status(500).json({ error: 'Failed to create client invite', message: 'Internal server error' });
  }
});

/**
 * GET /api/invites/validate/client/:token
 * Public — validate a coach-issued client invite token.
 */
router.get('/validate/client/:token', async (req: Request, res: Response) => {
  try {
    const result = await invitesService.validateClientInvite(req.params.token);
    res.status(result.valid ? 200 : 404).json(result);
  } catch (error) {
    console.error('Validate client invite route error:', error);
    res.status(500).json({ valid: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/invites/accept/client
 * Public — client submits the registration form from the invite link.
 * Token must be a valid, non-expired, non-used client invite.
 */
router.post('/accept/client', [
  body('token')
    .notEmpty()
    .withMessage('Invite token is required'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required (max 50 characters)'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required (max 50 characters)'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .withMessage('Password must be at least 8 characters and include uppercase, lowercase, number, and special character'),
], async (req: Request, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { token, firstName, lastName, password } = req.body;
    const ipAddress = req.ip ?? req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await authService.registerClient(
      { token, firstName, lastName, password },
      ipAddress,
      userAgent,
    );

    if (!result.success) {
      const status = result.errorCode === 'EMAIL_EXISTS'    ? 409
                   : result.errorCode === 'INVALID_TOKEN'   ? 400
                   : result.errorCode === 'INVALID_PASSWORD' ? 400
                   : 500;
      res.status(status).json({ success: false, message: result.message });
      return;
    }

    // 200 per spec (token was already validated on the invite page)
    res.status(200).json({
      success: true,
      message: 'Account created successfully',
      user: result.user,
      tokens: result.tokens,
    });
  } catch (error) {
    console.error('Accept client invite route error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * DELETE /api/invites/:id
 * Admin revokes a pending invite. Hard-deletes it so the email can be re-invited.
 * Only works on pending (not yet used) invites — use /permanent to delete any invite.
 */
router.delete('/:id', authenticate, requireAdmin, [
  param('id').isUUID().withMessage('id must be a valid UUID'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const result = await invitesService.revoke(req.params.id);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Revoke invite route error:', error);
    res.status(500).json({ error: 'Failed to revoke invite', message: 'Internal server error' });
  }
});

/**
 * DELETE /api/invites/:id/permanent
 * Admin permanently deletes any invite regardless of status (pending, used, expired).
 * Use when you need to fully purge a record — e.g. to re-invite an email that already accepted.
 */
router.delete('/:id/permanent', authenticate, requireAdmin, [
  param('id').isUUID().withMessage('id must be a valid UUID'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const result = await invitesService.deleteInvite(req.params.id);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error('Delete invite route error:', error);
    res.status(500).json({ error: 'Failed to delete invite', message: 'Internal server error' });
  }
});

export default router;
