import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import { UserProfile } from './UserProfile';
import { Session } from './Session';
import { CoachProfile } from './CoachProfile';
import { ClientCoachRelationship } from './ClientCoachRelationship';
import { ClientPackage } from './ClientPackage';

export enum UserRole {
  ADMIN = 'admin',
  COACH = 'coach',
  CLIENT = 'client',
}

@Entity('users')
@Index(['email'], { unique: true })
@Index(['username'], { unique: true })
@Index(['role'])
@Index(['isActive'])
@Index(['createdAt'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @IsEmail()
  email: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @IsString()
  @MinLength(3)
  username: string;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @MinLength(6)
  password: string;

  @Column({ type: 'varchar', length: 100 })
  @IsString()
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  @IsString()
  lastName: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @IsOptional()
  avatar?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ type: 'boolean', default: false })
  hasCompletedOnboarding: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  emailVerificationToken?: string;

  @Column({ type: 'timestamptz', nullable: true })
  @IsOptional()
  emailVerificationExpires?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  passwordResetToken?: string;

  @Column({ type: 'timestamptz', nullable: true })
  @IsOptional()
  passwordResetExpires?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  @IsOptional()
  lastLoginAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => UserProfile, (profile) => profile.user, {
    cascade: true,
    eager: false,
  })
  profile: UserProfile;

  @OneToMany(() => Session, (session) => session.user, {
    cascade: true,
  })
  sessions: Session[];

  @OneToOne(() => CoachProfile, (cp) => cp.user)
  coachProfile: CoachProfile;

  @OneToMany(() => ClientCoachRelationship, (r) => r.client)
  clientRelationships: ClientCoachRelationship[];

  @OneToMany(() => ClientCoachRelationship, (r) => r.coach)
  coachRelationships: ClientCoachRelationship[];

  @OneToMany(() => ClientPackage, (cp) => cp.client)
  clientPackages: ClientPackage[];

  @OneToMany(() => ClientPackage, (cp) => cp.coach)
  coachClientPackages: ClientPackage[];

  // Virtual properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get isCoach(): boolean {
    return this.role === UserRole.COACH || this.role === UserRole.ADMIN;
  }

  get isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  get isClient(): boolean {
    return this.role === UserRole.CLIENT;
  }

  // Private flag to prevent double hashing
  private _shouldHashPassword = false;

  // Lifecycle hooks
  @BeforeInsert()
  async hashPasswordOnInsert(): Promise<void> {
    if (this.password && !this.password.startsWith('$2')) {
      const saltRounds = 12;
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
  }

  @BeforeUpdate()
  async hashPasswordOnUpdate(): Promise<void> {
    if (this._shouldHashPassword && this.password && !this.password.startsWith('$2')) {
      const saltRounds = 12;
      this.password = await bcrypt.hash(this.password, saltRounds);
      this._shouldHashPassword = false;
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail(): void {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
  }

  // Instance methods
  async validatePassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }

  // Method to set password that will be hashed on next save
  setPassword(newPassword: string): void {
    this.password = newPassword;
    this._shouldHashPassword = true;
  }

  async generatePasswordResetToken(): Promise<string> {
    const token = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    this.passwordResetToken = await bcrypt.hash(token, 10);
    this.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
    return token;
  }

  async generateEmailVerificationToken(): Promise<string> {
    const token = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    this.emailVerificationToken = await bcrypt.hash(token, 10);
    this.emailVerificationExpires = new Date(Date.now() + 86400000); // 24 hours
    return token;
  }

  toJSON(): Partial<User> {
    const { password, passwordResetToken, emailVerificationToken, ...user } = this;
    return user;
  }
}