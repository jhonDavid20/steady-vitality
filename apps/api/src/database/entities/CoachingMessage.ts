import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

export enum CoachingMessageKind { MESSAGE = 'message', CHECK_IN = 'check_in' }

@Entity('coaching_messages')
@Unique('UQ_coaching_message_retry', ['senderId', 'clientRequestId'])
@Index(['relationshipId', 'createdAt'])
export class CoachingMessage {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) relationshipId: string;
  @Column({ type: 'uuid' }) senderId: string;
  @Column({ type: 'uuid' }) recipientId: string;
  @Column({ type: 'enum', enum: CoachingMessageKind, default: CoachingMessageKind.MESSAGE }) kind: CoachingMessageKind;
  @Column({ type: 'text' }) body: string;
  @Column({ type: 'uuid' }) clientRequestId: string;
  @Column({ type: 'timestamptz', nullable: true }) readAt: Date | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
