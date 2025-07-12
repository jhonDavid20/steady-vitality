import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm'
import { IsString, IsNumber, IsOptional, IsBoolean, IsDate, Min } from 'class-validator'
import { User } from './User'

@Entity('habit_tracking')
@Index(['userId'])
@Index(['category'])
@Index(['trackedDate'])
@Index(['userId', 'trackedDate'])
export class HabitTracking {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  @Index()
  userId: string

  // Habit details
  @Column()
  @IsString()
  habitName: string

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string

  @Column()
  @IsString()
  @Index()
  category: string // hydration, sleep, exercise, nutrition, mindfulness

  // Tracking data
  @Column({ type: 'float', nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Target value must be a number' })
  @Min(0, { message: 'Target value must be positive' })
  targetValue?: number // e.g., 8 glasses of water

  @Column({ type: 'float', nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Actual value must be a number' })
  @Min(0, { message: 'Actual value must be positive' })
  actualValue?: number

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  unit?: string // glasses, hours, minutes

  // Status
  @Column({ default: false })
  @IsBoolean()
  isCompleted: boolean

  @Column({ default: 0 })
  @IsNumber({}, { message: 'Streak must be a number' })
  @Min(0, { message: 'Streak must be positive' })
  streak: number

  // Timing
  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  @IsDate()
  @Index()
  trackedDate: Date

  @CreateDateColumn()
  createdAt: Date

  // Relations
  @ManyToOne(() => User, user => user.habitTracking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User

  // Methods
  calculateCompletionPercentage(): number {
    if (!this.targetValue || !this.actualValue) return 0
    return Math.min(Math.round((this.actualValue / this.targetValue) * 100), 100)
  }

  markCompleted(): void {
    this.isCompleted = true
    if (this.targetValue && !this.actualValue) {
      this.actualValue = this.targetValue
    }
  }

  updateStreak(previousDayCompleted: boolean): void {
    if (this.isCompleted) {
      this.streak = previousDayCompleted ? this.streak + 1 : 1
    } else {
      this.streak = 0
    }
  }

  getStreakLevel(): string {
    if (this.streak >= 30) return 'legendary'
    if (this.streak >= 21) return 'excellent'
    if (this.streak >= 14) return 'great'
    if (this.streak >= 7) return 'good'
    if (this.streak >= 3) return 'building'
    return 'starting'
  }

  isOnTrack(): boolean {
    const completion = this.calculateCompletionPercentage()
    return completion >= 80 || this.isCompleted
  }
}