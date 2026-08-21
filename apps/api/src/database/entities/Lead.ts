import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum LeadStatus {
  NEW       = 'new',
  CONTACTED = 'contacted',
  CONVERTED = 'converted',
  ARCHIVED  = 'archived',
}

/**
 * A lead captured from the public landing page assessment form.
 * Leads are anonymous prospects (no account yet) and are managed by admins
 * until they are contacted / converted into a client account.
 */
@Entity('leads')
@Index(['email'])
@Index(['status'])
@Index(['createdAt'])
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  /** Age range as selected in the form (e.g. "26-35"). */
  @Column({ type: 'varchar', length: 20, nullable: true })
  age: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender: string | null;

  /** Height in centimetres. */
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  height: number | null;

  /** Weight in kilograms. */
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight: number | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  activityLevel: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  goal: string | null;

  @Column({ type: 'text', nullable: true })
  experience: string | null;

  /** Body Mass Index, computed from height & weight when available. */
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  bmi: number | null;

  /** Locale the visitor used on the landing page (e.g. "en", "es"). */
  @Column({ type: 'varchar', length: 10, nullable: true })
  locale: string | null;

  @Column({ type: 'varchar', length: 20, default: LeadStatus.NEW })
  status: LeadStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
