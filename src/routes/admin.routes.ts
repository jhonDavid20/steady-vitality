import { Router, Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { cleanupService } from '../services/cleanup.service';
import { AppDataSource } from '../database/data-source';
import { User, UserRole } from '../database/entities/User';
import { StatsService } from '../services/stats.service';

const handleValidationErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: 'Validation failed', message: 'Please check your input data', details: errors.array() });
    return true;
  }
  return false;
};

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only operations
 */

/**
 * @swagger
 * /api/admin/cleanup/sessions:
 *   post:
 *     summary: Manually trigger session cleanup
 *     description: Deletes expired sessions and old inactive/revoked sessions. Requires admin role.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cleanup completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Session cleanup completed
 *                 result:
 *                   type: object
 *                   properties:
 *                     expired:
 *                       type: number
 *                       description: Expired sessions deleted
 *                       example: 42
 *                     old:
 *                       type: number
 *                       description: Old inactive sessions deleted
 *                       example: 8
 *                     total:
 *                       type: number
 *                       example: 50
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/cleanup/sessions', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await cleanupService.runNow();

    res.status(200).json({
      success: true,
      message: 'Session cleanup completed',
      result: {
        expired: result.expired,
        old: result.old,
        total: result.expired + result.old,
      },
    });
  } catch (error) {
    console.error('Session cleanup endpoint error:', error);
    res.status(500).json({
      error: 'Cleanup failed',
      message: 'Internal server error',
    });
  }
});

// ─── User management ─────────────────────────────────────────────────────────

/**
 * GET /api/admin/users
 * Paginated user list with optional filters: role, isActive.
 */
router.get('/users', authenticate, requireAdmin, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(Object.values(UserRole)).withMessage(`role must be one of: ${Object.values(UserRole).join(', ')}`),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};
    if (req.query.role) where.role = req.query.role;
    if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true';

    const userRepository = AppDataSource.getRepository(User);
    const [users, total] = await userRepository.findAndCount({
      where,
      select: {
        id: true, email: true, username: true, firstName: true, lastName: true,
        role: true, isActive: true, isEmailVerified: true, hasCompletedOnboarding: true,
        lastLoginAt: true, createdAt: true, updatedAt: true,
      },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    res.status(200).json({ success: true, data: users, total, page, limit });
  } catch (error) {
    console.error('Admin list users error:', error);
    res.status(500).json({ error: 'Failed to list users', message: 'Internal server error' });
  }
});

/**
 * PATCH /api/admin/users/:id/role
 * Change a user's role.
 */
router.patch('/users/:id/role', authenticate, requireAdmin, [
  param('id').isUUID().withMessage('id must be a valid UUID'),
  body('role').isIn(Object.values(UserRole)).withMessage(`role must be one of: ${Object.values(UserRole).join(', ')}`),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.params.id } });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    user.role = req.body.role as UserRole;
    await userRepository.save(user);

    res.status(200).json({ success: true, message: 'Role updated', user: { id: user.id, role: user.role } });
  } catch (error) {
    console.error('Admin update role error:', error);
    res.status(500).json({ error: 'Failed to update role', message: 'Internal server error' });
  }
});

/**
 * PATCH /api/admin/users/:id/status
 * Toggle a user's isActive flag.
 */
router.patch('/users/:id/status', authenticate, requireAdmin, [
  param('id').isUUID().withMessage('id must be a valid UUID'),
  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.params.id } });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    user.isActive = req.body.isActive;
    await userRepository.save(user);

    res.status(200).json({ success: true, message: 'Status updated', user: { id: user.id, isActive: user.isActive } });
  } catch (error) {
    console.error('Admin update status error:', error);
    res.status(500).json({ error: 'Failed to update status', message: 'Internal server error' });
  }
});

const statsService = new StatsService();

/**
 * GET /api/admin/stats
 * Rich aggregate stats: user counts by role, new-this-week, invite summary,
 * and a 30-day signup-by-day series (gaps filled with 0).
 */
router.get('/stats', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await statsService.getStats();
    res.status(200).json({ success: true, stats });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve stats' });
  }
});

export default router;
