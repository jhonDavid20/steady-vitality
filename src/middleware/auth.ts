import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../database/data-source';
import { User, UserRole } from '../database/entities/User';
import { Session } from '../database/entities/Session';
import { JWTService } from '../utils/jwt';
import { JWTPayload } from '../types/auth';

export interface AuthenticatedRequest extends Request {
  user?: User;
  session?: Session;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTService.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided'
      });
      return;
    }

    let payload: JWTPayload;
    try {
      payload = JWTService.verifyAccessToken(token);
    } catch (error: any) {
      res.status(401).json({
        error: 'Invalid token',
        message: error.message
      });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const sessionRepository = AppDataSource.getRepository(Session);

    const [user, session] = await Promise.all([
      userRepository.findOne({
        where: { id: payload.userId, isActive: true },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      sessionRepository.findOne({
        where: { 
          id: payload.sessionId,
          userId: payload.userId,
          isActive: true
        }
      })
    ]);

    if (!user) {
      res.status(401).json({
        error: 'User not found',
        message: 'User account may have been disabled or deleted'
      });
      return;
    }

    if (!session || !session.isValid()) {
      res.status(401).json({
        error: 'Invalid session',
        message: 'Session has expired or been revoked'
      });
      return;
    }

    session.updateLastAccessed();
    await sessionRepository.save(session);

    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: 'Internal server error during authentication'
    });
  }
};

export const requireRole = (roles: UserRole | UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated'
      });
      return;
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        message: `Required role: ${allowedRoles.join(' or ')}`
      });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole(UserRole.ADMIN);
export const requireCoach = requireRole([UserRole.ADMIN, UserRole.COACH]);

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTService.extractTokenFromHeader(authHeader);

    if (!token) {
      next();
      return;
    }

    try {
      const payload = JWTService.verifyAccessToken(token);
      const userRepository = AppDataSource.getRepository(User);
      
      const user = await userRepository.findOne({
        where: { id: payload.userId, isActive: true }
      });

      if (user) {
        req.user = user;
      }
    } catch (error) {
      // Ignore token errors for optional auth
    }

    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
};

export const requireEmailVerified = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentication required',
      message: 'User not authenticated'
    });
    return;
  }

  if (!req.user.isEmailVerified) {
    res.status(403).json({
      error: 'Email verification required',
      message: 'Please verify your email address to access this resource'
    });
    return;
  }

  next();
};