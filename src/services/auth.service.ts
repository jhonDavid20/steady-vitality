import { AppDataSource } from '../database/data-source';
import { User, UserRole } from '../database/entities/User';
import { Session } from '../database/entities/Session';
import { PasswordService } from '../utils/password';
import { JWTService } from '../utils/jwt';
import { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  RefreshTokenRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest
} from '../types/auth';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);
  private sessionRepository = AppDataSource.getRepository(Session);

  async register(data: RegisterRequest, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    try {
      const existingUser = await this.userRepository.findOne({
        where: [
          { email: data.email.toLowerCase().trim() },
          { username: data.username }
        ]
      });

      if (existingUser) {
        return {
          success: false,
          message: existingUser.email === data.email.toLowerCase().trim() 
            ? 'Email already registered' 
            : 'Username already taken'
        };
      }

      const passwordValidation = PasswordService.validatePassword(data.password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: passwordValidation.errors.join(', ')
        };
      }

      const user = this.userRepository.create({
        email: data.email.toLowerCase().trim(),
        username: data.username,
        password: data.password, // Will be hashed by the entity hook
        firstName: data.firstName,
        lastName: data.lastName,
        role: UserRole.CLIENT,
        isActive: true,
        isEmailVerified: false
      });

      const emailVerificationToken = await user.generateEmailVerificationToken();
      const savedUser = await this.userRepository.save(user);

      // TODO: Send email verification email with emailVerificationToken

      const session = await this.createSession(savedUser, ipAddress, userAgent);
      const tokens = this.generateTokens(savedUser, session);

      return {
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        user: {
          id: savedUser.id,
          email: savedUser.email,
          username: savedUser.username,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          role: savedUser.role,
          isEmailVerified: savedUser.isEmailVerified
        },
        tokens
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed. Please try again.'
      };
    }
  }

  async login(data: LoginRequest, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    try {
      const user = await this.userRepository.findOne({
        where: { email: data.email.toLowerCase().trim() }
      });

      if (!user || !user.isActive) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      const isPasswordValid = await user.validatePassword(data.password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      user.lastLoginAt = new Date();
      await this.userRepository.save(user);

      const session = await this.createSession(
        user, 
        ipAddress, 
        userAgent, 
        data.rememberMe ? 7 * 24 : 24 // 7 days if remember me, otherwise 24 hours
      );
      
      const tokens = this.generateTokens(user, session);

      return {
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        },
        tokens
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed. Please try again.'
      };
    }
  }

  async logout(sessionId: string): Promise<{ success: boolean; message: string }> {
    try {
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId }
      });

      if (session) {
        session.revoke('User logout');
        await this.sessionRepository.save(session);
      }

      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: 'Logout failed'
      };
    }
  }

  async logoutAll(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.sessionRepository.update(
        { userId, isActive: true },
        { 
          isActive: false, 
          revokedAt: new Date(), 
          revokedReason: 'User logout all sessions',
          revokedBy: 'user'
        }
      );

      return {
        success: true,
        message: 'All sessions logged out successfully'
      };
    } catch (error) {
      console.error('Logout all error:', error);
      return {
        success: false,
        message: 'Logout all sessions failed'
      };
    }
  }

  async refreshToken(data: RefreshTokenRequest): Promise<AuthResponse> {
    try {
      const { userId, sessionId } = JWTService.verifyRefreshToken(data.refreshToken);

      const [user, session] = await Promise.all([
        this.userRepository.findOne({
          where: { id: userId, isActive: true }
        }),
        this.sessionRepository.findOne({
          where: { id: sessionId, userId, isActive: true }
        })
      ]);

      if (!user || !session || !session.canRefresh()) {
        return {
          success: false,
          message: 'Invalid or expired refresh token'
        };
      }

      const tokens = this.generateTokens(user, session);

      return {
        success: true,
        message: 'Token refreshed successfully',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        },
        tokens
      };
    } catch (error) {
      console.error('Refresh token error:', error);
      return {
        success: false,
        message: 'Token refresh failed'
      };
    }
  }

  async changePassword(userId: string, data: ChangePasswordRequest): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId }
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      const isCurrentPasswordValid = await user.validatePassword(data.currentPassword);
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          message: 'Current password is incorrect'
        };
      }

      const passwordValidation = PasswordService.validatePassword(data.newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: passwordValidation.errors.join(', ')
        };
      }

      user.password = data.newPassword; // Will be hashed by the entity hook
      await this.userRepository.save(user);

      // Revoke all other sessions except current one
      await this.sessionRepository.update(
        { userId, isActive: true },
        { 
          isActive: false, 
          revokedAt: new Date(), 
          revokedReason: 'Password changed',
          revokedBy: 'user'
        }
      );

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: 'Password change failed'
      };
    }
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.userRepository.findOne({
        where: { email: data.email.toLowerCase().trim() }
      });

      if (!user) {
        // Don't reveal if email exists
        return {
          success: true,
          message: 'If the email exists, a password reset link has been sent'
        };
      }

      const resetToken = await user.generatePasswordResetToken();
      await this.userRepository.save(user);

      // TODO: Send password reset email with resetToken

      return {
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        message: 'Password reset request failed'
      };
    }
  }

  async resetPassword(data: ResetPasswordRequest): Promise<{ success: boolean; message: string }> {
    try {
      const passwordValidation = PasswordService.validatePassword(data.newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: passwordValidation.errors.join(', ')
        };
      }

      const user = await this.userRepository
        .createQueryBuilder('user')
        .where('user.passwordResetExpires > :now', { now: new Date() })
        .getOne();

      if (!user || !user.passwordResetToken) {
        return {
          success: false,
          message: 'Invalid or expired reset token'
        };
      }

      const isTokenValid = await PasswordService.comparePassword(data.token, user.passwordResetToken);
      if (!isTokenValid) {
        return {
          success: false,
          message: 'Invalid or expired reset token'
        };
      }

      user.password = data.newPassword; // Will be hashed by the entity hook
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await this.userRepository.save(user);

      // Revoke all active sessions
      await this.sessionRepository.update(
        { userId: user.id, isActive: true },
        { 
          isActive: false, 
          revokedAt: new Date(), 
          revokedReason: 'Password reset',
          revokedBy: 'user'
        }
      );

      return {
        success: true,
        message: 'Password reset successfully'
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message: 'Password reset failed'
      };
    }
  }

  async verifyEmail(data: VerifyEmailRequest): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.userRepository
        .createQueryBuilder('user')
        .where('user.emailVerificationExpires > :now', { now: new Date() })
        .getOne();

      if (!user || !user.emailVerificationToken) {
        return {
          success: false,
          message: 'Invalid or expired verification token'
        };
      }

      const isTokenValid = await PasswordService.comparePassword(data.token, user.emailVerificationToken);
      if (!isTokenValid) {
        return {
          success: false,
          message: 'Invalid or expired verification token'
        };
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await this.userRepository.save(user);

      return {
        success: true,
        message: 'Email verified successfully'
      };
    } catch (error) {
      console.error('Verify email error:', error);
      return {
        success: false,
        message: 'Email verification failed'
      };
    }
  }

  private async createSession(
    user: User, 
    ipAddress?: string, 
    userAgent?: string, 
    expirationHours: number = 24
  ): Promise<Session> {
    const session = this.sessionRepository.create({
      userId: user.id,
      expiresAt: new Date(Date.now() + expirationHours * 60 * 60 * 1000),
      ipAddress,
      isActive: true
    });

    if (userAgent) {
      session.parseUserAgent(userAgent);
    }

    return await this.sessionRepository.save(session);
  }

  private generateTokens(user: User, session: Session) {
    const accessToken = JWTService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id
    });

    const refreshToken = JWTService.generateRefreshToken(user.id, session.id);

    return {
      accessToken,
      refreshToken,
      expiresIn: JWTService.getAccessTokenExpirationTime()
    };
  }

  async getCurrentUser(userId: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id: userId, isActive: true },
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
    });
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    return await this.sessionRepository.find({
      where: { userId, isActive: true },
      order: { lastAccessedAt: 'DESC' }
    });
  }
}