import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './User';

export enum ConnectionRequestStatus {
  PENDING  = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

@Entity('connection_requests')
@Unique(['clientId', 'coachId'])
@Index(['coachId'])
@Index(['clientId'])
@Index(['status'])
export class ConnectionRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  clientId: string;

  @Column({ type: 'uuid' })
  coachId: string;

  @Column({ type: 'varchar', length: 20, default: ConnectionRequestStatus.PENDING })
  status: ConnectionRequestStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'clientId' })
  client: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'coachId' })
  coach: User;
}
