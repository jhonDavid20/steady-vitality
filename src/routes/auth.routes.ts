import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/auth.service';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { 
  LoginRequest, 
  RegisterRequest, 
  RefreshTokenRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest
} from '../types/auth';

const router = Router();
const authService = new AuthService();

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
    .withMessage('Password must be at least 8 characters long'),
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
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
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
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
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
 * @route GET /api/auth/me
 * @desc Get current user info
 * @access Private
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