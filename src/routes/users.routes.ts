import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { UsersService } from '../services/users.service';
import { ActivityLevel, FitnessGoal, Gender } from '../database/entities/UserProfile';
import { OnboardingRequest } from '../services/users.service';

const router = Router();
const usersService = new UsersService();

// ─── Avatar upload config ─────────────────────────────────────────────────────
const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');
const AVATARS_DIR  = path.join(UPLOADS_ROOT, 'avatars');

// Ensure the directory exists at startup (safe on every cold start)
fs.mkdirSync(AVATARS_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATARS_DIR),
  filename: (req: AuthenticatedRequest, _file, cb) => {
    // Use userId as the base name so re-uploads always overwrite the same slot.
    // Keep the original extension to preserve MIME-type hints.
    const ext = _file.originalname.split('.').pop()?.toLowerCase() ?? 'jpg';
    cb(null, `${req.user!.id}.${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`));
    }
  },
});

// Helper: handle express-validator errors (same pattern as auth.routes.ts)
const handleValidationErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your input data',
      details: errors.array()
    });
    return true;
  }
  return false;
};

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile management
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user with full profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/UserWithProfile'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(400).json({
        error: 'User not found',
        message: 'Invalid user session'
      });
      return;
    }

    const result = await usersService.getProfile(userId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Get profile route error:', error);
    res.status(500).json({
      error: 'Failed to get profile',
      message: 'Internal server error'
    });
  }
});

const validateUpdateProfile = [
  body('fitnessGoal')
    .optional()
    .isIn(Object.values(FitnessGoal))
    .withMessage(`fitnessGoal must be one of: ${Object.values(FitnessGoal).join(', ')}`),
  body('activityLevel')
    .optional()
    .isIn(Object.values(ActivityLevel))
    .withMessage(`activityLevel must be one of: ${Object.values(ActivityLevel).join(', ')}`),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('dateOfBirth must be a valid ISO 8601 date (e.g. 1990-05-20)'),
  body('gender')
    .optional()
    .isIn(Object.values(Gender))
    .withMessage(`gender must be one of: ${Object.values(Gender).join(', ')}`),
  body('height')
    .optional()
    .isFloat({ min: 50, max: 300 })
    .withMessage('height must be a number between 50 and 300 (cm)'),
  body('weight')
    .optional()
    .isFloat({ min: 30, max: 500 })
    .withMessage('weight must be a number between 30 and 500 (kg)'),
  body('targetWeight')
    .optional()
    .isFloat({ min: 30, max: 500 })
    .withMessage('targetWeight must be a number between 30 and 500 (kg)'),
  body('medicalConditions').optional().isArray().withMessage('medicalConditions must be an array'),
  body('medicalConditions.*').optional().isString().trim(),
  body('injuries').optional().isArray().withMessage('injuries must be an array'),
  body('injuries.*').optional().isString().trim(),
  body('medications').optional().isArray().withMessage('medications must be an array'),
  body('medications.*').optional().isString().trim(),
  body('allergies').optional().isArray().withMessage('allergies must be an array'),
  body('allergies.*').optional().isString().trim(),
  body('preferredWorkoutTime').optional().isString().trim().isLength({ max: 100 }),
  body('gymLocation').optional().isString().trim().isLength({ max: 255 }),
  body('timezone').optional().isString().trim().isLength({ max: 100 }),
  body('phone').optional().isString().trim().isLength({ max: 20 })
];

/**
 * @swagger
 * /api/users/me/profile:
 *   patch:
 *     summary: Update user profile (partial)
 *     description: Updates any subset of profile fields. All fields are optional — only the fields sent will be updated.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OnboardingRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 profile:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/me/profile', authenticate, validateUpdateProfile, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const userId = req.user?.id;

    if (!userId) {
      res.status(400).json({ error: 'User not found', message: 'Invalid user session' });
      return;
    }

    const result = await usersService.updateProfile(userId, req.body);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Update profile route error:', error);
    res.status(500).json({ error: 'Update failed', message: 'Internal server error' });
  }
});

const validateOnboarding = [
  // Step 1 - Goal
  body('fitnessGoal')
    .isIn(Object.values(FitnessGoal))
    .withMessage(`fitnessGoal must be one of: ${Object.values(FitnessGoal).join(', ')}`),
  body('activityLevel')
    .isIn(Object.values(ActivityLevel))
    .withMessage(`activityLevel must be one of: ${Object.values(ActivityLevel).join(', ')}`),

  // Step 2 - Physical data
  body('dateOfBirth')
    .isISO8601()
    .withMessage('dateOfBirth must be a valid ISO 8601 date (e.g. 1990-05-20)'),
  body('gender')
    .isIn(Object.values(Gender))
    .withMessage(`gender must be one of: ${Object.values(Gender).join(', ')}`),
  body('height')
    .isFloat({ min: 50, max: 300 })
    .withMessage('height must be a number between 50 and 300 (cm)'),
  body('weight')
    .isFloat({ min: 30, max: 500 })
    .withMessage('weight must be a number between 30 and 500 (kg)'),
  body('targetWeight')
    .optional()
    .isFloat({ min: 30, max: 500 })
    .withMessage('targetWeight must be a number between 30 and 500 (kg)'),

  // Step 3 - Health
  body('medicalConditions')
    .optional()
    .isArray()
    .withMessage('medicalConditions must be an array of strings'),
  body('medicalConditions.*')
    .optional()
    .isString()
    .trim(),
  body('injuries')
    .optional()
    .isArray()
    .withMessage('injuries must be an array of strings'),
  body('injuries.*')
    .optional()
    .isString()
    .trim(),
  body('medications')
    .optional()
    .isArray()
    .withMessage('medications must be an array of strings'),
  body('medications.*')
    .optional()
    .isString()
    .trim(),
  body('allergies')
    .optional()
    .isArray()
    .withMessage('allergies must be an array of strings'),
  body('allergies.*')
    .optional()
    .isString()
    .trim(),

  // Step 4 - Preferences
  body('preferredWorkoutTime')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('preferredWorkoutTime must be a string of max 100 characters'),
  body('gymLocation')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('gymLocation must be a string of max 255 characters'),
  body('timezone')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('timezone must be a string of max 100 characters'),
  body('phone')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 20 })
    .withMessage('phone must be a string of max 20 characters')
];

/**
 * @swagger
 * /api/users/me/onboarding:
 *   patch:
 *     summary: Complete user onboarding
 *     description: Saves all onboarding data in a single call, upserts the user profile, and sets hasCompletedOnboarding to true. Can be called multiple times to update profile data.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OnboardingRequest'
 *     responses:
 *       200:
 *         description: Onboarding completed successfully
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
 *                   example: Onboarding completed successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 profile:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * GET /api/users/me/onboarding
 * Check whether the current user has completed onboarding.
 */
router.get('/me/onboarding', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      hasCompletedOnboarding: req.user!.hasCompletedOnboarding,
    });
  } catch (error) {
    console.error('Check onboarding status error:', error);
    res.status(500).json({ error: 'Failed to check onboarding status', message: 'Internal server error' });
  }
});

router.patch('/me/onboarding', authenticate, validateOnboarding, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const userId = req.user?.id;

    if (!userId) {
      res.status(400).json({
        error: 'User not found',
        message: 'Invalid user session'
      });
      return;
    }

    const onboardingData: OnboardingRequest = req.body;
    const result = await usersService.completeOnboarding(userId, onboardingData);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Onboarding route error:', error);
    res.status(500).json({
      error: 'Onboarding failed',
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/users/me/profile
 * Return the user_profile record for the current user.
 */
router.get('/me/profile', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await usersService.getUserProfileOnly(req.user!.id);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Get user profile route error:', error);
    res.status(500).json({ error: 'Failed to get profile', message: 'Internal server error' });
  }
});

const validateUpdateUser = [
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('First name must be 1-50 characters'),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Last name must be 1-50 characters'),
  body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
  body('timezone').optional().isString().trim().isLength({ max: 100 }).withMessage('Timezone must be a string under 100 chars'),
];

/**
 * PATCH /api/users/me
 * Update firstName, lastName, avatar, timezone.
 */
router.patch('/me', authenticate, validateUpdateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const result = await usersService.updateUser(req.user!.id, req.body);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Update user route error:', error);
    res.status(500).json({ error: 'Failed to update user', message: 'Internal server error' });
  }
});

/**
 * POST /api/users/me/onboarding
 * Set hasCompletedOnboarding true + upsert profile.
 */
router.post('/me/onboarding', authenticate, validateOnboarding, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const result = await usersService.completeOnboarding(req.user!.id, req.body as OnboardingRequest);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Onboarding (POST) route error:', error);
    res.status(500).json({ error: 'Onboarding failed', message: 'Internal server error' });
  }
});

const validateChangePassword = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .withMessage('New password must be at least 8 characters with uppercase, lowercase, number, and special character'),
];

/**
 * PATCH /api/users/me/password
 * Verify current password, hash and save new one.
 */
router.patch('/me/password', authenticate, validateChangePassword, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const result = await usersService.changePassword(
      req.user!.id,
      req.body.currentPassword,
      req.body.newPassword,
    );
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Change password route error:', error);
    res.status(500).json({ error: 'Failed to change password', message: 'Internal server error' });
  }
});

/**
 * PATCH /api/users/me/avatar
 * Upload a profile photo. Accepts multipart/form-data with field name "file".
 * Replaces any previous local avatar file on disk, then updates users.avatar.
 */
router.patch(
  '/me/avatar',
  authenticate,
  (req: AuthenticatedRequest, res: Response, next) => {
    avatarUpload.single('file')(req as any, res, (err) => {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ message: 'File too large. Maximum size is 5 MB.' });
        return;
      }
      if (err) {
        res.status(400).json({ message: err.message });
        return;
      }
      next();
    });
  },
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;

      if (!file) {
        res.status(400).json({ message: 'No file uploaded. Send a file under the "file" field.' });
        return;
      }

      // Before saving the new record we need to delete the *old* file if it has a
      // different filename (different extension). When extensions match, multer's
      // diskStorage already overwrites the file on disk — nothing extra needed.
      const user = await usersService.getUserAvatarPath(req.user!.id);
      if (user?.avatar && user.avatar.includes('/uploads/avatars/')) {
        const oldFilename = user.avatar.split('/uploads/avatars/')[1];
        const newFilename = file.filename;
        if (oldFilename !== newFilename) {
          const oldPath = path.join(AVATARS_DIR, oldFilename);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const url = `${baseUrl}/uploads/avatars/${file.filename}`;

      const result = await usersService.updateAvatar(req.user!.id, file.path, url);

      if (!result.success) {
        // Clean up the just-uploaded file to avoid orphans
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        res.status(500).json({ message: result.message });
        return;
      }

      res.status(200).json({ url: result.url, message: result.message });
    } catch (error) {
      console.error('Avatar upload route error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
);

/**
 * DELETE /api/users/me/avatar
 * Remove the current avatar — deletes the local file and sets users.avatar to null.
 */
router.delete('/me/avatar', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await usersService.deleteAvatar(req.user!.id, UPLOADS_ROOT);
    res.status(result.success ? 200 : 400).json({ message: result.message });
  } catch (error) {
    console.error('Delete avatar route error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * DELETE /api/users/me
 * Soft delete – set isActive false.
 */
router.delete('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await usersService.softDelete(req.user!.id);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Delete user route error:', error);
    res.status(500).json({ error: 'Failed to deactivate account', message: 'Internal server error' });
  }
});

export default router;
