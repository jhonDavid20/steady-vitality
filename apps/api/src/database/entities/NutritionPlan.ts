import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export interface NutritionPlanItem {
  mealId: string;
  dayOfWeek: number;
  order: number;
  mealType: string;
  name: string;
  description: string | null;
  calories: number | null;
}

@Entity('nutrition_plans')
@Index(['coachId'])
export class NutritionPlan {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) coachId: string;
  @Column({ type: 'varchar', length: 160 }) name: string;
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" }) items: NutritionPlanItem[];
  @Column({ type: 'int', default: 2000 }) waterTargetMl: number;
  @Column({ type: 'boolean', default: true }) isActive: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
