// src/utils/jwt.ts
import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken'
import { JWTPayload, AuthError } from '../types/auth'
import { config } from '../config/env'

const JWT_SECRET = config.jwt.secret
const JWT_EXPIRES_IN = config.jwt.expiresIn
const JWT_REFRESH_EXPIRES_IN = config.jwt.refreshExpiresIn

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

export class JWTService {
  /**
   * Generate access token
   */
  static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    const options: SignOptions = {
      expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'],
      algorithm: 'HS256'
    }
    
    return jwt.sign(payload, JWT_SECRET, options)
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(userId: string, sessionId: string): string {
    const options: SignOptions = {
      expiresIn: JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
      algorithm: 'HS256'
    }
    
    return jwt.sign(
      { userId, sessionId, type: 'refresh' },
      JWT_SECRET,
      options
    )
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
      
      // Type guard to ensure we have the expected payload structure
      if (typeof decoded === 'object' && decoded !== null && 
          'userId' in decoded && 'email' in decoded && 'role' in decoded && 'sessionId' in decoded) {
        return decoded as JWTPayload
      }
      
      throw new Error('Invalid token payload structure')
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        const authError: AuthError = Object.assign(new Error('Token expired'), {
          statusCode: 401,
          code: 'TOKEN_EXPIRED'
        })
        throw authError
      }
      
      if (error instanceof jwt.JsonWebTokenError) {
        const authError: AuthError = Object.assign(new Error('Invalid token'), {
          statusCode: 401,
          code: 'INVALID_TOKEN'
        })
        throw authError
      }
      
      throw error
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): { userId: string; sessionId: string } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
      
      if (typeof decoded === 'object' && decoded !== null) {
        const payload = decoded as any
        
        if (payload.type !== 'refresh') {
          const authError: AuthError = Object.assign(new Error('Invalid refresh token'), {
            statusCode: 401,
            code: 'INVALID_REFRESH_TOKEN'
          })
          throw authError
        }
        
        if (!payload.userId || !payload.sessionId) {
          const authError: AuthError = Object.assign(new Error('Invalid refresh token payload'), {
            statusCode: 401,
            code: 'INVALID_REFRESH_TOKEN'
          })
          throw authError
        }
        
        return {
          userId: payload.userId,
          sessionId: payload.sessionId
        }
      }
      
      throw new Error('Invalid token payload')
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        const authError = Object.assign(new Error('Refresh token expired'), {
          statusCode: 401,
          code: 'REFRESH_TOKEN_EXPIRED'
        }) as AuthError
        throw authError
      }
      
      if (error instanceof jwt.JsonWebTokenError) {
        const authError: AuthError = Object.assign(new Error('Invalid refresh token'), {
          statusCode: 401,
          code: 'INVALID_REFRESH_TOKEN'
        })
        throw authError
      }
      
      throw error
    }
  }

  /**
   * Get token expiration time in seconds
   */
  static getAccessTokenExpirationTime(): number {
    // Convert JWT_EXPIRES_IN to seconds
    const expiresIn = JWT_EXPIRES_IN
    if (typeof expiresIn === 'string') {
      if (expiresIn.endsWith('h')) {
        return parseInt(expiresIn.slice(0, -1)) * 3600
      }
      if (expiresIn.endsWith('m')) {
        return parseInt(expiresIn.slice(0, -1)) * 60
      }
      if (expiresIn.endsWith('d')) {
        return parseInt(expiresIn.slice(0, -1)) * 86400
      }
      if (expiresIn.endsWith('s')) {
        return parseInt(expiresIn.slice(0, -1))
      }
      // Default to seconds if no unit specified
      return parseInt(expiresIn)
    }
    return 3600 // Default 1 hour
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null
    }

    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null
    }

    return parts[1]
  }

  /**
   * Decode token without verification (for debugging)
   */
  static decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload
    } catch (error) {
      return null
    }
  }
}