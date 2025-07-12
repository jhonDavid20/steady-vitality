import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm'
import { IsString, IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator'
import { WorkoutSession } from './WorkoutSession'

@Entity('workout_exercises')
@Index(['sessionId'])
@Index(['order'])
export class WorkoutExercise {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  @Index()
  sessionId: string

  @Column()
  @IsString()
  name: string

  @Column({ nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Sets must be a number' })
  @Min(0, { message: 'Sets must be positive' })
  sets?: number

  @Column({ nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Reps must be a number' })
  @Min(0, { message: 'Reps must be positive' })
  reps?: number

  @Column({ type: 'float', nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Weight must be a number' })
  @Min(0, { message: 'Weight must be positive' })
  weight?: number // in kg

  @Column({ nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Duration must be a number' })
  @Min(0, { message: 'Duration must be positive' })
  duration?: number // in seconds

  @Column({ type: 'float', nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Distance must be a number' })
  @Min(0, { message: 'Distance must be positive' })
  distance?: number // in meters

  @Column({ nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Rest time must be a number' })
  @Min(0, { message: 'Rest time must be positive' })
  restTime?: number // in seconds

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string

  @Column()
  @IsNumber({}, { message: 'Order must be a number' })
  @Min(1, { message: 'Order must be at least 1' })
  @Index()
  order: number

  // Performance tracking
  @Column({ nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'RPE must be a number' })
  @Min(1, { message: 'RPE must be at least 1' })
  @Max(10, { message: 'RPE must be at most 10' })
  rpe?: number // Rate of Perceived Exertion (1-10)

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  tempo?: string // e.g., "3-1-2-1"

  @CreateDateColumn()
  createdAt: Date

  // Relations
  @ManyToOne(() => WorkoutSession, session => session.exercises, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: WorkoutSession

  // Methods
  calculateVolume(): number {
    if (this.sets && this.reps && this.weight) {
      return this.sets * this.reps * this.weight
    }
    return 0
  }

  getExerciseType(): string {
    if (this.weight && this.sets && this.reps) {
      return 'strength'
    }
    if (this.duration || this.distance) {
      return 'cardio'
    }
    return 'other'
  }

  isStrengthExercise(): boolean {
    return this.getExerciseType() === 'strength'
  }

  isCardioExercise(): boolean {
    return this.getExerciseType() === 'cardio'
  }

  getDisplayText(): string {
    const parts: string[] = []
    
    if (this.sets && this.reps) {
      parts.push(`${this.sets} x ${this.reps}`)
    }
    
    if (this.weight) {
      parts.push(`${this.weight}kg`)
    }
    
    if (this.duration) {
      const minutes = Math.floor(this.duration / 60)
      const seconds = this.duration % 60
      parts.push(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }
    
    if (this.distance) {
      parts.push(`${this.distance}m`)
    }
    
    return parts.join(' • ')
  }
}