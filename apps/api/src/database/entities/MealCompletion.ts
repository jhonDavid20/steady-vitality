import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

@Entity('meal_completions')
@Unique('UQ_meal_completion_day', ['assignmentId', 'mealId', 'localDate'])
@Index(['clientId', 'localDate'])
export class MealCompletion {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) assignmentId: string;
  @Column({ type: 'uuid' }) mealId: string;
  @Column({ type: 'uuid' }) clientId: string;
  @Column({ type: 'date' }) localDate: string;
  @Column({ type: 'boolean', default: true }) completed: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
