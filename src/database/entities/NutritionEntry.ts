import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm'
import { IsString, IsNumber, IsEnum, IsOptional, IsDate, Min } from 'class-validator'
import { User } from './User'

export enum MealType {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
  SNACK = 'SNACK',
  PRE_WORKOUT = 'PRE_WORKOUT',
  POST_WORKOUT = 'POST_WORKOUT'
}

@Entity('nutrition_entries')
@Index(['userId'])
@Index(['mealType'])
@Index(['consumedAt'])
@Index(['userId', 'consumedAt'])
export class NutritionEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  @Index()
  userId: string

  // Food details
  @Column()
  @IsString()
  foodName: string

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  brand?: string

  @Column('float')
  @IsNumber({}, { message: 'Serving size must be a number' })
  @Min(0, { message: 'Serving size must be positive' })
  servingSize: number

  @Column()
  @IsString()
  servingUnit: string

  // Nutritional info (per serving)
  @Column('float')
  @IsNumber({}, { message: 'Calories must be a number' })
  @Min(0, { message: 'Calories must be positive' })
  calories: number

  @Column({ type: 'float', nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Protein must be a number' })
  @Min(0, { message: 'Protein must be positive' })
  protein?: number // in grams

  @Column({ type: 'float', nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Carbohydrates must be a number' })
  @Min(0, { message: 'Carbohydrates must be positive' })
  carbohydrates?: number // in grams

  @Column({ type: 'float', nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Fat must be a number' })
  @Min(0, { message: 'Fat must be positive' })
  fat?: number // in grams

  @Column({ type: 'float', nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Fiber must be a number' })
  @Min(0, { message: 'Fiber must be positive' })
  fiber?: number // in grams

  @Column({ type: 'float', nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Sugar must be a number' })
  @Min(0, { message: 'Sugar must be positive' })
  sugar?: number // in grams

  @Column({ type: 'float', nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Sodium must be a number' })
  @Min(0, { message: 'Sodium must be positive' })
  sodium?: number // in mg

  // Micronutrients (stored as JSON)
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  vitamins?: Record<string, number>

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  minerals?: Record<string, number>

  // Timing and context
  @Column({
    type: 'enum',
    enum: MealType
  })
  @IsEnum(MealType)
  @Index()
  mealType: MealType

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  @IsDate()
  @Index()
  consumedAt: Date

  @CreateDateColumn()
  createdAt: Date

  // Relations
  @ManyToOne(() => User, user => user.nutritionEntries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User

  // Methods
  getTotalMacros() {
    return {
      calories: this.calories,
      protein: this.protein || 0,
      carbohydrates: this.carbohydrates || 0,
      fat: this.fat || 0,
      fiber: this.fiber || 0
    }
  }

  getMacroPercentages() {
    const proteinCals = (this.protein || 0) * 4
    const carbCals = (this.carbohydrates || 0) * 4
    const fatCals = (this.fat || 0) * 9
    const totalCals = this.calories

    if (totalCals === 0) return { protein: 0, carbs: 0, fat: 0 }

    return {
      protein: Math.round((proteinCals / totalCals) * 100),
      carbs: Math.round((carbCals / totalCals) * 100),
      fat: Math.round((fatCals / totalCals) * 100)
    }
  }

  isHighProtein(): boolean {
    const percentages = this.getMacroPercentages()
    return percentages.protein >= 30
  }

  isLowCarb(): boolean {
    const percentages = this.getMacroPercentages()
    return percentages.carbs <= 20
  }

  getDisplayName(): string {
    return this.brand ? `${this.brand} ${this.foodName}` : this.foodName
  }
}