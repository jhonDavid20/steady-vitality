import { Router, Response } from 'express';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { cleanupService } from '../services/cleanup.service';

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

export default router;
