import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { AuthService } from '../services/auth.service';
import { AppDataSource } from '../database/data-source';
import { User } from '../database/entities/User';
import { Session } from '../database/entities/Session';

const router = Router();
const authService = new AuthService();

// Helper function to handle validation errors
const handleValidationErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
    return true;
  }
  return false;
};

/**
 * @route GET /api/authjs/user/:id
 * @desc Get user by ID for Auth.js
 * @access Public (Auth.js internal)
 */
router.get('/user/:id', [
  param('id').isUUID().withMessage('Invalid user ID')
], async (req: Request, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { id } = req.params;
    const userRepository = AppDataSource.getRepository(User);
    
    const user = await userRepository.findOne({
      where: { id, isActive: true },
      relations: ['profile']
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Return Auth.js compatible user object
    res.json({
      id: user.id,
      name: user.fullName,
      email: user.email,
      image: user.avatar || null,
      // Additional custom fields for your app
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route GET /api/authjs/user/email/:email
 * @desc Get user by email for Auth.js
 * @access Public (Auth.js internal)
 */
router.get('/user/email/:email', [
  param('email').isEmail().withMessage('Invalid email address')
], async (req: Request, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { email } = req.params;
    const userRepository = AppDataSource.getRepository(User);
    
    const user = await userRepository.findOne({
      where: { email: email.toLowerCase(), isActive: true },
      relations: ['profile']
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Return Auth.js compatible user object
    res.json({
      id: user.id,
      name: user.fullName,
      email: user.email,
      image: user.avatar || null,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Get user by email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/authjs/user
 * @desc Create user for Auth.js
 * @access Public (Auth.js internal)
 */
router.post('/user', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('name').optional().isString().withMessage('Name must be a string'),
  body('image').optional().isURL().withMessage('Image must be a valid URL'),
  body('username').optional().isString().withMessage('Username must be a string'),
  body('firstName').optional().isString().withMessage('First name must be a string'),
  body('lastName').optional().isString().withMessage('Last name must be a string')
], async (req: Request, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { email, name, image, username, firstName, lastName } = req.body;
    const userRepository = AppDataSource.getRepository(User);

    // Check if user already exists
    const existingUser = await userRepository.findOne({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    // Parse name if provided but firstName/lastName are not
    let userFirstName = firstName;
    let userLastName = lastName;
    
    if (name && !firstName && !lastName) {
      const nameParts = name.split(' ');
      userFirstName = nameParts[0] || '';
      userLastName = nameParts.slice(1).join(' ') || '';
    }

    // Generate a username if not provided
    const userUsername = username || email.split('@')[0] + Math.random().toString(36).substring(2, 6);

    // Create new user
    const newUser = userRepository.create({
      email: email.toLowerCase(),
      username: userUsername,
      firstName: userFirstName || 'User',
      lastName: userLastName || '',
      avatar: image,
      password: 'oauth_user', // Placeholder for OAuth users
      isEmailVerified: true, // OAuth users are typically pre-verified
      role: 'client'
    });

    const savedUser = await userRepository.save(newUser);

    res.status(201).json({
      id: savedUser.id,
      name: savedUser.fullName,
      email: savedUser.email,
      image: savedUser.avatar || null,
      username: savedUser.username,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      role: savedUser.role,
      isEmailVerified: savedUser.isEmailVerified,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route PUT /api/authjs/user/:id
 * @desc Update user for Auth.js
 * @access Public (Auth.js internal)
 */
router.put('/user/:id', [
  param('id').isUUID().withMessage('Invalid user ID'),
  body('name').optional().isString().withMessage('Name must be a string'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
  body('image').optional().isURL().withMessage('Image must be a valid URL')
], async (req: Request, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { id } = req.params;
    const { name, email, image } = req.body;
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({ where: { id } });
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Update fields if provided
    if (email) user.email = email.toLowerCase();
    if (image !== undefined) user.avatar = image;
    
    if (name) {
      const nameParts = name.split(' ');
      user.firstName = nameParts[0] || user.firstName;
      user.lastName = nameParts.slice(1).join(' ') || user.lastName;
    }

    const updatedUser = await userRepository.save(user);

    res.json({
      id: updatedUser.id,
      name: updatedUser.fullName,
      email: updatedUser.email,
      image: updatedUser.avatar || null,
      username: updatedUser.username,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: updatedUser.role,
      isEmailVerified: updatedUser.isEmailVerified,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route DELETE /api/authjs/user/:id
 * @desc Delete user for Auth.js
 * @access Public (Auth.js internal)
 */
router.delete('/user/:id', [
  param('id').isUUID().withMessage('Invalid user ID')
], async (req: Request, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { id } = req.params;
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({ where: { id } });
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Soft delete by setting isActive to false
    user.isActive = false;
    await userRepository.save(user);

    res.status(204).send();
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/authjs/session
 * @desc Create session for Auth.js
 * @access Public (Auth.js internal)
 */
router.post('/session', [
  body('sessionToken').isString().withMessage('Session token required'),
  body('userId').isUUID().withMessage('Valid user ID required'),
  body('expires').isISO8601().withMessage('Valid expiration date required')
], async (req: Request, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { sessionToken, userId, expires } = req.body;

    // Get client info
    const ipAddress = (req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim();
    const userAgent = req.headers['user-agent'];

    const savedSession = await authService.createNextAuthSession(
      userId,
      sessionToken,
      new Date(expires),
      ipAddress,
      userAgent
    );

    res.status(201).json({
      id: savedSession.id,
      sessionToken: savedSession.token,
      userId: savedSession.userId,
      expires: savedSession.expiresAt.toISOString()
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route GET /api/authjs/session/:sessionToken
 * @desc Get session by token for Auth.js
 * @access Public (Auth.js internal)
 */
router.get('/session/:sessionToken(*)', [
  param('sessionToken').isString().withMessage('Session token required')
], async (req: Request, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    let { sessionToken } = req.params;
    
    // Handle URL encoding - JWT tokens may be URL encoded
    try {
      sessionToken = decodeURIComponent(sessionToken);
    } catch (e) {
      // If decoding fails, use original token
    }

    console.log('Session token lookup:', sessionToken.substring(0, 50) + '...');
    
    const session = await authService.getSessionByToken(sessionToken);

    if (!session || session.isExpired()) {
      res.status(404).json({ error: 'Session not found or expired' });
      return;
    }

    // Update last accessed
    session.updateLastAccessed();
    await authService.updateSessionExpiry(sessionToken, session.expiresAt);

    res.json({
      id: session.id,
      sessionToken: session.token,
      userId: session.userId,
      expires: session.expiresAt.toISOString(),
      user: {
        id: session.user.id,
        name: session.user.fullName,
        email: session.user.email,
        image: session.user.avatar || null,
        username: session.user.username,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        role: session.user.role,
        isEmailVerified: session.user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/authjs/session/lookup
 * @desc Get session by token via POST body (alternative to avoid URL encoding issues)
 * @access Public (Auth.js internal)
 */
router.post('/session/lookup', [
  body('sessionToken').isString().withMessage('Session token required')
], async (req: Request, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { sessionToken } = req.body;
    console.log('Session token lookup (POST):', sessionToken.substring(0, 50) + '...');
    
    const session = await authService.getSessionByToken(sessionToken);

    if (!session || session.isExpired()) {
      res.status(404).json({ error: 'Session not found or expired' });
      return;
    }

    // Update last accessed
    session.updateLastAccessed();
    await authService.updateSessionExpiry(sessionToken, session.expiresAt);

    res.json({
      id: session.id,
      sessionToken: session.token,
      userId: session.userId,
      expires: session.expiresAt.toISOString(),
      user: {
        id: session.user.id,
        name: session.user.fullName,
        email: session.user.email,
        image: session.user.avatar || null,
        username: session.user.username,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        role: session.user.role,
        isEmailVerified: session.user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Get session error (POST):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route PUT /api/authjs/session/:sessionToken
 * @desc Update session for Auth.js
 * @access Public (Auth.js internal)
 */
router.put('/session/:sessionToken(*)', [
  param('sessionToken').isString().withMessage('Session token required'),
  body('expires').optional().isISO8601().withMessage('Valid expiration date required')
], async (req: Request, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { sessionToken } = req.params;
    const decodedToken = decodeURIComponent(sessionToken);
    const { expires } = req.body;

    const session = await authService.getSessionByToken(decodedToken);

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const updatedSession = await authService.updateSessionExpiry(
      decodedToken, 
      expires ? new Date(expires) : session.expiresAt
    );

    res.json({
      id: updatedSession.id,
      sessionToken: updatedSession.token,
      userId: updatedSession.userId,
      expires: updatedSession.expiresAt.toISOString()
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route DELETE /api/authjs/session/:sessionToken
 * @desc Delete session for Auth.js
 * @access Public (Auth.js internal)
 */
router.delete('/session/:sessionToken(*)', [
  param('sessionToken').isString().withMessage('Session token required')
], async (req: Request, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { sessionToken } = req.params;
    const decodedToken = decodeURIComponent(sessionToken);

    const deleted = await authService.deleteSessionByToken(decodedToken);

    if (!deleted) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/authjs/verify-request
 * @desc Verify authentication request for Auth.js magic links
 * @access Public (Auth.js internal)
 */
router.post('/verify-request', [
  body('identifier').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('url').isURL().withMessage('Valid URL required'),
  body('expires').isISO8601().withMessage('Valid expiration date required'),
  body('token').isString().withMessage('Token required')
], async (req: Request, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    // For now, just acknowledge the verification request
    // You can implement email sending logic here if needed
    res.status(200).json({ 
      success: true,
      message: 'Verification request processed'
    });
  } catch (error) {
    console.error('Verify request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;