import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/auth.service';
import { InvitesService } from '../services/invites.service';
import { CoachesService } from '../services/coaches.service';
import { CoachingType } from '../database/entities/CoachProfile';
import { authenticate, requireCoach, AuthenticatedRequest } from '../middleware/auth';
import {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  UpdateProfileRequest
} from '../types/auth';

const router = Router();
const authService = new AuthService();
const invitesService = new InvitesService();
const coachesService = new CoachesService();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization
 */

// Validation middleware
const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .withMessage('Password must be at least 8 characters and include uppercase, lowercase, number, and special character'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters')
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('Remember me must be a boolean')
];

const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
];

const validateForgotPassword = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

const validateResetPassword = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
];

const validateVerifyEmail = [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required')
];

const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
];

const validateUpdateProfile = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL')
];

// Helper function to handle validation errors
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

// Helper function to get client info
const getClientInfo = (req: Request) => ({
  ipAddress: (req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim(),
  userAgent: req.headers['user-agent']
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 example: johndoe
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: SecurePass123!
 *               firstName:
 *                 type: string
 *                 maxLength: 50
 *                 example: John
 *               lastName:
 *                 type: string
 *                 maxLength: 50
 *                 example: Doe
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', validateRegister, async (req: Request, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const registerData: RegisterRequest = req.body;
    const { ipAddress, userAgent } = getClientInfo(req);

    const result = await authService.register(registerData, ipAddress, userAgent);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Register route error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: SecurePass123!
 *               rememberMe:
 *                 type: boolean
 *                 default: false
 *                 example: true
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', validateLogin, async (req: Request, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const loginData: LoginRequest = req.body;
    const { ipAddress, userAgent } = getClientInfo(req);

    const result = await authService.login(loginData, ipAddress, userAgent);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('Login route error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user (current session)
 * @access Private
 */
router.post('/logout', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessionId = req.session?.id;
    
    if (!sessionId) {
      res.status(400).json({
        error: 'Logout failed',
        message: 'No active session found'
      });
      return;
    }

    const result = await authService.logout(sessionId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Logout route error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/auth/logout-all
 * @desc Logout user from all sessions
 * @access Private
 */
router.post('/logout-all', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(400).json({
        error: 'Logout failed',
        message: 'User not found'
      });
      return;
    }

    const result = await authService.logoutAll(userId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Logout all route error:', error);
    res.status(500).json({
      error: 'Logout all failed',
      message: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh', validateRefreshToken, async (req: Request, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const refreshData: RefreshTokenRequest = req.body;
    const result = await authService.refreshToken(refreshData);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('Refresh token route error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
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
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
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

    const user = await authService.getCurrentUser(userId);
    
    if (!user) {
      res.status(404).json({
        error: 'User not found',
        message: 'User account may have been disabled or deleted'
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get current user route error:', error);
    res.status(500).json({
      error: 'Failed to get user info',
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   patch:
 *     summary: Update current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 maxLength: 50
 *                 example: John
 *               lastName:
 *                 type: string
 *                 maxLength: 50
 *                 example: Doe
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 example: johndoe
 *               avatar:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/avatar.png
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
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or username taken
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
router.patch('/me', authenticate, validateUpdateProfile, async (req: AuthenticatedRequest, res: Response) => {
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

    const updateData: UpdateProfileRequest = req.body;
    const result = await authService.updateProfile(userId, updateData);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Update profile route error:', error);
    res.status(500).json({
      error: 'Profile update failed',
      message: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/auth/sessions
 * @desc Get user's active sessions
 * @access Private
 */
router.get('/sessions', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(400).json({
        error: 'User not found',
        message: 'Invalid user session'
      });
      return;
    }

    const sessions = await authService.getUserSessions(userId);
    
    res.status(200).json({
      success: true,
      sessions: sessions.map(session => ({
        id: session.id,
        deviceType: session.deviceType,
        browser: session.browser,
        os: session.os,
        country: session.country,
        city: session.city,
        ipAddress: session.ipAddress,
        lastAccessedAt: session.lastAccessedAt,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        isActive: session.isActive
      }))
    });
  } catch (error) {
    console.error('Get sessions route error:', error);
    res.status(500).json({
      error: 'Failed to get sessions',
      message: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.post('/change-password', authenticate, validateChangePassword, async (req: AuthenticatedRequest, res: Response) => {
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

    const changePasswordData: ChangePasswordRequest = req.body;
    const result = await authService.changePassword(userId, changePasswordData);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Change password route error:', error);
    res.status(500).json({
      error: 'Password change failed',
      message: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/auth/forgot-password
 * @desc Send password reset email
 * @access Public
 */
router.post('/forgot-password', validateForgotPassword, async (req: Request, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const forgotPasswordData: ForgotPasswordRequest = req.body;
    const result = await authService.forgotPassword(forgotPasswordData);

    // Always return success to prevent email enumeration
    res.status(200).json(result);
  } catch (error) {
    console.error('Forgot password route error:', error);
    res.status(500).json({
      error: 'Password reset request failed',
      message: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post('/reset-password', validateResetPassword, async (req: Request, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const resetPasswordData: ResetPasswordRequest = req.body;
    const result = await authService.resetPassword(resetPasswordData);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Reset password route error:', error);
    res.status(500).json({
      error: 'Password reset failed',
      message: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/auth/verify-email
 * @desc Verify email with token
 * @access Public
 */
router.post('/verify-email', validateVerifyEmail, async (req: Request, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const verifyEmailData: VerifyEmailRequest = req.body;
    const result = await authService.verifyEmail(verifyEmailData);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Verify email route error:', error);
    res.status(500).json({
      error: 'Email verification failed',
      message: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/auth/coach/setup/:token
 * @desc Validate a coach invite token and return the pre-filled email
 * @access Public
 */
router.get('/coach/setup/:token', async (req: Request, res: Response) => {
  try {
    const result = await invitesService.validate(req.params.token);

    if (!result.success || !result.data) {
      res.status(400).json({
        valid: false,
        message: result.message ?? 'Invalid invite token',
      });
      return;
    }

    res.status(200).json({ valid: true, email: result.data.email });
  } catch (error) {
    console.error('Coach setup route error:', error);
    res.status(500).json({ valid: false, message: 'Internal server error' });
  }
});

const validateCoachRegister = [
  body('token')
    .notEmpty()
    .withMessage('Invite token is required'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .withMessage('Password must be at least 8 characters and include uppercase, lowercase, number, and special character'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your password'),
];

/**
 * @route POST /api/auth/coach/register
 * @desc Register a coach account via an invite token
 * @access Public
 */
router.post('/coach/register', validateCoachRegister, async (req: Request, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { token, firstName, lastName, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Passwords do not match',
      });
      return;
    }

    const { ipAddress, userAgent } = getClientInfo(req);
    const result = await authService.registerCoach(
      { token, firstName, lastName, password },
      ipAddress,
      userAgent
    );

    if (!result.success) {
      const status = result.errorCode === 'EMAIL_EXISTS' ? 409 : 400;
      res.status(status).json({ error: 'Registration failed', message: result.message });
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Coach register route error:', error);
    res.status(500).json({ error: 'Registration failed', message: 'Internal server error' });
  }
});

// ─── Client register via coach invite ─────────────────────────────────────────

const validateClientRegister = [
  body('token')
    .notEmpty()
    .withMessage('Invite token is required'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .withMessage('Password must be at least 8 characters and include uppercase, lowercase, number, and special character'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your password'),
];

/**
 * @route POST /api/auth/client/register
 * @desc Register a client account via a coach-issued invite token
 * @access Public
 */
router.post('/client/register', validateClientRegister, async (req: Request, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { token, firstName, lastName, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Validation failed', message: 'Passwords do not match' });
      return;
    }

    const { ipAddress, userAgent } = getClientInfo(req);
    const result = await authService.registerClient(
      { token, firstName, lastName, password },
      ipAddress,
      userAgent,
    );

    if (!result.success) {
      const status = result.errorCode === 'EMAIL_EXISTS' ? 409 : 400;
      res.status(status).json({ error: 'Registration failed', message: result.message });
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Client register route error:', error);
    res.status(500).json({ error: 'Registration failed', message: 'Internal server error' });
  }
});

// ─── Coach onboarding ─────────────────────────────────────────────────────────

const validateOnboarding = [
  // Step 1 – Story
  body('bio').optional().isString().trim().isLength({ max: 2000 }).withMessage('Bio must be under 2000 characters'),
  body('profileHeadline').optional().isString().trim().isLength({ max: 160 }).withMessage('Headline must be under 160 characters'),
  body('videoIntroUrl').optional({ nullable: true }).isURL().withMessage('videoIntroUrl must be a valid URL'),

  // Step 2 – Expertise
  body('specialties').optional().isArray(),
  body('specialties.*').optional().isString().trim(),
  body('trainingModalities').optional().isArray(),
  body('trainingModalities.*').optional().isString().trim(),
  body('targetClientTypes').optional().isArray(),
  body('targetClientTypes.*').optional().isString().trim(),
  body('yearsOfExperience').optional().isInt({ min: 0, max: 60 }).withMessage('Years of experience must be 0–60'),
  body('certifications').optional().isArray(),
  body('certifications.*').optional().isString().trim(),

  // Step 3 – Coaching style
  body('coachingType').optional().isIn(Object.values(CoachingType)).withMessage(`Must be one of: ${Object.values(CoachingType).join(', ')}`),
  body('languagesSpoken').optional().isArray(),
  body('languagesSpoken.*').optional().isString().trim(),
  body('instagramHandle').optional().isString().trim().isLength({ max: 100 }),
  body('websiteUrl').optional({ nullable: true }).isURL().withMessage('websiteUrl must be a valid URL'),

  // Step 4 – Availability
  body('timezone').optional().isString().trim().isLength({ max: 64 }),
  body('sessionDurationMinutes').optional().isInt({ min: 15, max: 480 }),
  body('maxClientCapacity').optional().isInt({ min: 1 }),
  body('acceptingClients').optional().isBoolean(),
  body('totalClientsTrained').optional().isInt({ min: 0 }),

  // Step 5 – Pricing
  body('sessionRateUSD').optional().isFloat({ min: 0 }),
  body('trialSessionAvailable').optional().isBoolean(),
  body('trialSessionRateUSD').optional().isFloat({ min: 0 }),
];

/**
 * @route POST /api/auth/coach/onboarding
 * @desc  Upsert the CoachProfile for the authenticated coach and flip
 *        `hasCompletedOnboarding = true` on their User record (single transaction).
 *        The frontend wizard submits all steps here on the final step.
 * @access Private — coach or admin
 */
router.post(
  '/coach/onboarding',
  authenticate,
  requireCoach,
  validateOnboarding,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (handleValidationErrors(req, res)) return;

      const result = await coachesService.completeOnboarding(req.user!.id, req.body);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Coach onboarding route error:', error);
      res.status(500).json({ error: 'Onboarding failed', message: 'Internal server error' });
    }
  },
);

/**
 * @route GET /api/auth/status
 * @desc Check authentication status
 * @access Public (but checks if authenticated)
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(200).json({
        isAuthenticated: false,
        user: null
      });
      return;
    }

    // This is a simplified status check - in a real app you might want more validation
    res.status(200).json({
      isAuthenticated: true,
      message: 'Use /me endpoint for detailed user information'
    });
  } catch (error) {
    res.status(200).json({
      isAuthenticated: false,
      user: null
    });
  }
});

export default router;