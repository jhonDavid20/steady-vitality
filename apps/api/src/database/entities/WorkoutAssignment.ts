import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export interface AssignedWorkoutAction {
  actionId: string;
  exerciseId: string;
  name: string;
  muscleGroup: string;
  description: string | null;
  videoUrl: string | null;
  dayOfWeek: number;
  order: number;
}

@Entity('workout_assignments')
@Index(['clientId'])
@Index(['coachId'])
export class WorkoutAssignment {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) planId: string;
  @Column({ type: 'uuid' }) clientId: string;
  @Column({ type: 'uuid' }) coachId: string;
  @Column({ type: 'varchar', length: 160 }) planName: string;
  @Column({ type: 'jsonb' }) actions: AssignedWorkoutAction[];
  @Column({ type: 'varchar', length: 100 }) timezone: string;
  @Column({ type: 'date' }) startsOn: string;
  @Column({ type: 'date', nullable: true }) endsOn: string | null;
  @Column({ type: 'boolean', default: true }) isActive: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
