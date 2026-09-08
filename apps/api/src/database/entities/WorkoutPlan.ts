import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export interface WorkoutPlanItem {
  exerciseId: string;
  dayOfWeek: number;
  order: number;
}

@Entity('workout_plans')
@Index(['coachId'])
export class WorkoutPlan {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) coachId: string;
  @Column({ type: 'varchar', length: 160 }) name: string;
  @Column({ type: 'text', nullable: true }) description: string | null;
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" }) items: WorkoutPlanItem[];
  @Column({ type: 'boolean', default: true }) isActive: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
