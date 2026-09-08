import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

@Entity('workout_completions')
@Unique('UQ_workout_completion_action_day', ['assignmentId', 'actionId', 'localDate'])
@Index(['clientId', 'localDate'])
export class WorkoutCompletion {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) assignmentId: string;
  @Column({ type: 'uuid' }) actionId: string;
  @Column({ type: 'uuid' }) clientId: string;
  @Column({ type: 'date' }) localDate: string;
  @Column({ type: 'boolean', default: true }) completed: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
