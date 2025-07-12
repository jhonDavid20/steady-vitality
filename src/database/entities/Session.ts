import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import { IsUUID, IsString, IsOptional, IsIP } from 'class-validator';
import { User } from './User';
import * as crypto from 'crypto';

@Entity('sessions')
@Index(['token'], { unique: true })
@Index(['userId'])
@Index(['expiresAt'])
@Index(['isActive'])
@Index(['createdAt'])
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  userId: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @IsString()
  token: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  @IsOptional()
  refreshTokenExpiresAt?: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  deviceType?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  browser?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  os?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  country?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  city?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  @IsOptional()
  lastAccessedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  @IsOptional()
  revokedAt?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  revokedBy?: string; // user, admin, system

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  revokedReason?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.sessions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Lifecycle hooks
  @BeforeInsert()
  generateTokens(): void {
    if (!this.token) {
      this.token = this.generateSecureToken();
    }
    if (!this.refreshToken) {
      this.refreshToken = this.generateSecureToken();
    }
    if (!this.expiresAt) {
      // Default session expires in 24 hours
      this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
    if (!this.refreshTokenExpiresAt) {
      // Refresh token expires in 7 days
      this.refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
  }

  // Instance methods
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isRefreshTokenExpired(): boolean {
    return this.refreshTokenExpiresAt ? new Date() > this.refreshTokenExpiresAt : true;
  }

  isValid(): boolean {
    return this.isActive && !this.isExpired() && !this.revokedAt;
  }

  canRefresh(): boolean {
    return this.isActive && !this.isRefreshTokenExpired() && !this.revokedAt;
  }

  revoke(reason?: string, revokedBy?: string): void {
    this.isActive = false;
    this.revokedAt = new Date();
    this.revokedBy = revokedBy || 'system';
    this.revokedReason = reason || 'Session revoked';
  }

  extend(hours: number = 24): void {
    if (this.isValid()) {
      this.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    }
  }

  updateLastAccessed(): void {
    this.lastAccessedAt = new Date();
  }

  // Static methods
  static generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static createExpirationDate(hours: number = 24): Date {
    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  // Parse user agent information
  parseUserAgent(userAgent: string): void {
    this.userAgent = userAgent;
    
    // Basic user agent parsing (you might want to use a library like 'ua-parser-js')
    if (userAgent.includes('Mobile')) {
      this.deviceType = 'mobile';
    } else if (userAgent.includes('Tablet')) {
      this.deviceType = 'tablet';
    } else {
      this.deviceType = 'desktop';
    }

    // Browser detection
    if (userAgent.includes('Chrome')) {
      this.browser = 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      this.browser = 'Firefox';
    } else if (userAgent.includes('Safari')) {
      this.browser = 'Safari';
    } else if (userAgent.includes('Edge')) {
      this.browser = 'Edge';
    } else {
      this.browser = 'Other';
    }

    // OS detection
    if (userAgent.includes('Windows')) {
      this.os = 'Windows';
    } else if (userAgent.includes('Mac')) {
      this.os = 'macOS';
    } else if (userAgent.includes('Linux')) {
      this.os = 'Linux';
    } else if (userAgent.includes('Android')) {
      this.os = 'Android';
    } else if (userAgent.includes('iOS')) {
      this.os = 'iOS';
    } else {
      this.os = 'Other';
    }
  }

  toJSON(): Partial<Session> {
    const { token, refreshToken, ...session } = this;
    return session;
  }
}