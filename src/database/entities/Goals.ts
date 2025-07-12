import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm'
import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, IsDate, Min } from 'class-validator'
import { User } from './User'
import { GoalCategory } from './UserProfile'

@Entity('goals')
@Index(['userId'])
@Index(['category'])
@Index(['isCompleted'])
@Index(['targetDate'])
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  @Index()
  userId: string

  // Goal details
  @Column()
  @IsString()
  title: string

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string

  @Column({
    type: 'enum',
    enum: GoalCategory
  })
  @IsEnum(GoalCategory)
  @Index()
  category: GoalCategory

  // Targets
  @Column({ type: 'float', nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Target value must be a number' })
  targetValue?: number

  @Column({ type: 'float', nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Current value must be a number' })
  currentValue?: number

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  unit?: string

  // Timeline
  @Column({ nullable: true })
  @IsOptional()
  @IsDate()
  @Index()
  targetDate?: Date

  @Column({ default: false })
  @IsBoolean()
  @Index()
  isCompleted: boolean

  @Column({ nullable: true })
  @IsOptional()
  @IsDate()
  completedAt?: Date

  // Progress tracking
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  milestones?: Array<{
    value: number
    date: Date
    note?: string
  }>

  @Column({ default: 'medium' })
  @IsString()
  priority: string // low, medium, high

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Relations
  @ManyToOne(() => User, user => user.goals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User

  // Virtual properties
  get progressPercentage(): number {
    if (!this.targetValue || !this.currentValue) return 0
    return Math.min(Math.round((this.currentValue / this.targetValue) * 100), 100)
  }

  get daysRemaining(): number | null {
    if (!this.targetDate) return null
    const today = new Date()
    const target = new Date(this.targetDate)
    const diffTime = target.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  get isOverdue(): boolean {
    if (!this.targetDate || this.isCompleted) return false
    return new Date() > new Date(this.targetDate)
  }

  // Methods
  updateProgress(newValue: number, note?: string): void {
    this.currentValue = newValue
    
    // Add milestone
    if (!this.milestones) {
      this.milestones = []
    }
    
    this.milestones.push({
      value: newValue,
      date: new Date(),
      note
    })

    // Check if goal is completed
    if (this.targetValue && newValue >= this.targetValue && !this.isCompleted) {
      this.complete()
    }
  }

  complete(): void {
    this.isCompleted = true
    this.completedAt = new Date()
  }

  reopen(): void {
    this.isCompleted = false
    this.completedAt = undefined
  }

  getStatus(): string {
    if (this.isCompleted) return 'completed'
    if (this.isOverdue) return 'overdue'
    if (this.daysRemaining !== null && this.daysRemaining <= 7) return 'due_soon'
    return 'in_progress'
  }

  getPriorityLevel(): number {
    switch (this.priority.toLowerCase()) {
      case 'high': return 3
      case 'medium': return 2
      case 'low': return 1
      default: return 2
    }
  }

  getTimeFrame(): string {
    if (!this.targetDate) return 'No deadline'
    
    const days = this.daysRemaining
    if (days === null) return 'No deadline'
    if (days < 0) return `${Math.abs(days)} days overdue`
    if (days === 0) return 'Due today'
    if (days === 1) return 'Due tomorrow'
    if (days <= 7) return `${days} days remaining`
    if (days <= 30) return `${Math.ceil(days / 7)} weeks remaining`
    return `${Math.ceil(days / 30)} months remaining`
  }

  getSummary() {
    return {
      id: this.id,
      title: this.title,
      category: this.category,
      progress: this.progressPercentage,
      status: this.getStatus(),
      timeFrame: this.getTimeFrame(),
      priority: this.priority,
      isCompleted: this.isCompleted,
      currentValue: this.currentValue,
      targetValue: this.targetValue,
      unit: this.unit
    }
  }
}