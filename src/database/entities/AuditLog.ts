import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { IsUUID, IsString, IsOptional, IsJSON, IsIP, IsEnum } from 'class-validator';
import { User } from './User';

export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFICATION = 'email_verification',
  ROLE_CHANGED = 'role_changed',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
  EXPORT = 'export',
  IMPORT = 'import',
}

export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('audit_logs')
@Index(['userId'])
@Index(['action'])
@Index(['entity'])
@Index(['severity'])
@Index(['createdAt'])
@Index(['ipAddress'])
@Index(['success'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  @IsEnum(AuditAction)
  action: AuditAction;

  @Column({ type: 'varchar', length: 100 })
  @IsString()
  entity: string;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsJSON()
  details?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsJSON()
  oldValues?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsJSON()
  newValues?: Record<string, any>;

  @Column({ type: 'varchar', length: 45, nullable: true })
  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  resource?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @IsOptional()
  @IsString()
  method?: string; // HTTP method

  @Column({ type: 'varchar', length: 500, nullable: true })
  @IsOptional()
  @IsString()
  endpoint?: string;

  @Column({ type: 'boolean', default: true })
  success: boolean;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @Column({
    type: 'enum',
    enum: AuditSeverity,
    default: AuditSeverity.LOW,
  })
  @IsEnum(AuditSeverity)
  severity: AuditSeverity;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  source?: string; // web, mobile, api, system

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  tags?: string; // comma-separated tags

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.auditLogs, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'userId' })
  user?: User;

  // Virtual properties
  get isSecurityEvent(): boolean {
    return [
      AuditAction.LOGIN_FAILED,
      AuditAction.ACCOUNT_LOCKED,
      AuditAction.PASSWORD_RESET,
      AuditAction.ROLE_CHANGED,
    ].includes(this.action);
  }

  get isDataChange(): boolean {
    return [
      AuditAction.CREATE,
      AuditAction.UPDATE,
      AuditAction.DELETE,
    ].includes(this.action);
  }

  get hasChanges(): boolean {
    return !!(this.oldValues || this.newValues);
  }

  // Static factory methods
  static createLoginAudit(
    userId: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    errorMessage?: string
  ): Partial<AuditLog> {
    return {
      userId,
      action: success ? AuditAction.LOGIN : AuditAction.LOGIN_FAILED,
      entity: 'User',
      entityId: userId,
      success,
      ipAddress,
      userAgent,
      errorMessage,
      severity: success ? AuditSeverity.LOW : AuditSeverity.MEDIUM,
      source: 'web',
      description: success ? 'User logged in successfully' : 'Failed login attempt',
    };
  }

  static createLogoutAudit(
    userId: string,
    sessionId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Partial<AuditLog> {
    return {
      userId,
      action: AuditAction.LOGOUT,
      entity: 'User',
      entityId: userId,
      sessionId,
      success: true,
      ipAddress,
      userAgent,
      severity: AuditSeverity.LOW,
      source: 'web',
      description: 'User logged out',
    };
  }

  static createDataChangeAudit(
    action: AuditAction.CREATE | AuditAction.UPDATE | AuditAction.DELETE,
    entity: string,
    entityId: string,
    userId?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Partial<AuditLog> {
    return {
      userId,
      action,
      entity,
      entityId,
      oldValues,
      newValues,
      success: true,
      ipAddress,
      userAgent,
      severity: AuditSeverity.LOW,
      source: 'web',
      description: `${action} operation on ${entity}`,
    };
  }

  static createSecurityAudit(
    action: AuditAction,
    userId: string,
    severity: AuditSeverity,
    description: string,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Partial<AuditLog> {
    return {
      userId,
      action,
      entity: 'Security',
      entityId: userId,
      details,
      success: true,
      ipAddress,
      userAgent,
      severity,
      source: 'system',
      description,
    };
  }

  static createApiAudit(
    method: string,
    endpoint: string,
    userId?: string,
    success: boolean = true,
    errorMessage?: string,
    ipAddress?: string,
    userAgent?: string
  ): Partial<AuditLog> {
    return {
      userId,
      action: AuditAction.READ, // Default to READ for API calls
      entity: 'API',
      method,
      endpoint,
      success,
      errorMessage,
      ipAddress,
      userAgent,
      severity: success ? AuditSeverity.LOW : AuditSeverity.MEDIUM,
      source: 'api',
      description: `API ${method} ${endpoint}`,
    };
  }

  // Instance methods
  addTag(tag: string): void {
    if (this.tags) {
      const existingTags = this.tags.split(',').map(t => t.trim());
      if (!existingTags.includes(tag)) {
        this.tags = [...existingTags, tag].join(',');
      }
    } else {
      this.tags = tag;
    }
  }

  getTags(): string[] {
    return this.tags ? this.tags.split(',').map(t => t.trim()) : [];
  }

  // Format for display
  toJSON(): Partial<AuditLog> {
    return {
      id: this.id,
      userId: this.userId,
      action: this.action,
      entity: this.entity,
      entityId: this.entityId,
      success: this.success,
      severity: this.severity,
      description: this.description,
      createdAt: this.createdAt,
      ipAddress: this.ipAddress,
      source: this.source,
      tags: this.getTags(),
      hasChanges: this.hasChanges,
      isSecurityEvent: this.isSecurityEvent,
    };
  }
}