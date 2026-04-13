import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { User } from './User';
import { Package } from './Package';

export enum CoachingType {
  ONLINE    = 'online',
  IN_PERSON = 'in_person',
  HYBRID    = 'hybrid',
}

@Entity('coach_profiles')
@Index(['userId'], { unique: true })
@Index(['acceptingClients'])
@Index(['coachingType'])
export class CoachProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  // ── Core profile ─────────────────────────────────────────────────────────

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  bio?: string;

  @Column({ type: 'text', array: true, default: '{}' })
  specialties: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sessionRateUSD?: number;

  @Column({ type: 'text', array: true, default: '{}' })
  certifications: string[];

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  acceptingClients: boolean;

  // ── Professional identity ─────────────────────────────────────────────────

  /** One-liner shown under the coach's name on their public profile. */
  @Column({ type: 'varchar', length: 160, nullable: true })
  @IsOptional()
  @IsString()
  profileHeadline?: string;

  /** Self-reported years actively coaching clients. */
  @Column({ type: 'smallint', nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  yearsOfExperience?: number;

  /** How the coach delivers sessions: online / in-person / hybrid. */
  @Column({ type: 'enum', enum: CoachingType, nullable: true })
  @IsOptional()
  @IsEnum(CoachingType)
  coachingType?: CoachingType;

  /**
   * How they train (method/modality): Strength Training, HIIT, Yoga, etc.
   * Distinct from `specialties` which describes client outcomes/goals.
   */
  @Column({ type: 'text', array: true, default: '{}' })
  trainingModalities: string[];

  /**
   * Who they work best with: Beginners, Athletes, Seniors, Post-rehab,
   * Prenatal/Postnatal, Weight-loss focused, etc.
   */
  @Column({ type: 'text', array: true, default: '{}' })
  targetClientTypes: string[];

  /** IETF language tags (e.g. 'en', 'es', 'pt-BR') or plain names ('English'). */
  @Column({ type: 'text', array: true, default: '{}' })
  languagesSpoken: string[];

  // ── Scheduling & availability ─────────────────────────────────────────────

  /** IANA timezone string, e.g. 'America/New_York'. Used for scheduling. */
  @Column({ type: 'varchar', length: 64, nullable: true })
  @IsOptional()
  @IsString()
  timezone?: string;

  /** Default session length in minutes (15–480). */
  @Column({ type: 'smallint', nullable: true })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(480)
  sessionDurationMinutes?: number;

  /** Max concurrent active clients this coach will accept. */
  @Column({ type: 'smallint', nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxClientCapacity?: number;

  /** Whether the coach offers a discounted/free first session. */
  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  trialSessionAvailable: boolean;

  /** Price of the trial session (null = free when trialSessionAvailable is true). */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  trialSessionRateUSD?: number;

  // ── Media & social proof ──────────────────────────────────────────────────

  /** YouTube / Vimeo URL for a 1–3 min intro video. */
  @Column({ type: 'varchar', length: 500, nullable: true })
  @IsOptional()
  @IsString()
  videoIntroUrl?: string;

  /** Coach's personal website or Linktree. */
  @Column({ type: 'varchar', length: 500, nullable: true })
  @IsOptional()
  @IsString()
  websiteUrl?: string;

  /** Instagram handle without the '@'. */
  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  instagramHandle?: string;

  // ── Business ─────────────────────────────────────────────────────────────

  /** Self-reported total clients trained (incremented automatically over time). */
  @Column({ type: 'integer', default: 0 })
  @IsInt()
  @Min(0)
  totalClientsTrained: number;

  // ── Timestamps ────────────────────────────────────────────────────────────

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // ── Relations ─────────────────────────────────────────────────────────────

  @OneToOne(() => User, (user) => user.coachProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Package, (pkg) => pkg.coachProfile)
  packages: Package[];
}
