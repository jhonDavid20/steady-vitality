import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  Index,
} from 'typeorm';
import { randomBytes } from 'crypto';
import { User } from './User';

export enum InviteType {
  COACH  = 'coach',
  CLIENT = 'client',
}

@Entity('invites')
@Index(['token'], { unique: true })
@Index(['email', 'type'], { unique: true })   // one active invite per email+type combo
@Index(['coachId'])
export class Invite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 128, unique: true })
  token: string;

  @Column({ type: 'boolean', default: false })
  used: boolean;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  /** 'coach' = admin invites a coach | 'client' = coach invites a client */
  @Column({ type: 'varchar', length: 20, default: InviteType.COACH })
  type: InviteType;

  @Column({ type: 'uuid', nullable: true })
  invitedById: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true, eager: false })
  @JoinColumn({ name: 'invitedById' })
  invitedBy: User | null;

  /** Populated only for client invites — the coach who sent the invite. */
  @Column({ type: 'uuid', nullable: true })
  coachId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true, eager: false })
  @JoinColumn({ name: 'coachId' })
  coach: User | null;

  // ── Lifecycle hooks ───────────────────────────────────────────────────────

  @BeforeInsert()
  generateToken(): void {
    this.token = randomBytes(48).toString('hex'); // 96-char hex string
  }

  @BeforeInsert()
  setExpiry(): void {
    this.expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  get isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  get isValid(): boolean {
    return !this.used && !this.isExpired;
  }
}
