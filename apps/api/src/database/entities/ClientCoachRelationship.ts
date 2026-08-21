import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { IsEnum, IsOptional } from 'class-validator';
import { User } from './User';

export enum RelationshipStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('client_coach_relationships')
@Index(['clientId'])
@Index(['coachId'])
@Index(['status'])
export class ClientCoachRelationship {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  clientId: string;

  @Column({ type: 'uuid' })
  coachId: string;

  @Column({
    type: 'enum',
    enum: RelationshipStatus,
    default: RelationshipStatus.PENDING,
  })
  @IsEnum(RelationshipStatus)
  status: RelationshipStatus;

  @Column({ type: 'timestamptz', nullable: true })
  @IsOptional()
  startedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  @IsOptional()
  endedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.clientRelationships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clientId' })
  client: User;

  @ManyToOne(() => User, (user) => user.coachRelationships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'coachId' })
  coach: User;
}
