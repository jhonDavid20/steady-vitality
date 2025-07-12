// src/entities/HealthMetric.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm'
import { IsString, IsNumber, IsEnum, IsOptional, IsDate } from 'class-validator'
import { User } from './User'

export enum MeasurementType {
  WEIGHT = 'WEIGHT',
  BODY_FAT = 'BODY_FAT',
  MUSCLE_MASS = 'MUSCLE_MASS',
  WAIST = 'WAIST',
  CHEST = 'CHEST',
  ARMS = 'ARMS',
  THIGHS = 'THIGHS',
  BLOOD_PRESSURE = 'BLOOD_PRESSURE',
  HEART_RATE = 'HEART_RATE'
}

@Entity('health_metrics')
@Index(['userId'])
@Index(['type'])
@Index(['recordedAt'])
@Index(['userId', 'type'])
export class HealthMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  @Index()
  userId: string

  @Column({
    type: 'enum',
    enum: MeasurementType
  })
  @IsEnum(MeasurementType)
  @Index()
  type: MeasurementType

  @Column('float')
  @IsNumber({}, { message: 'Value must be a number' })
  value: number

  @Column()
  @IsString()
  unit: string

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string

  // Context
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  timeOfDay?: string // morning, afternoon, evening

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  conditions?: string // fasted, post_meal, post_workout

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  @IsDate()
  @Index()
  recordedAt: Date

  @CreateDateColumn()
  createdAt: Date

  // Relations
  @ManyToOne(() => User, user => user.healthMetrics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User

  // Methods
  getDisplayValue(): string {
    if (this.type === MeasurementType.BLOOD_PRESSURE) {
      // Assuming value is systolic and we might store diastolic separately
      return `${this.value} ${this.unit}`
    }
    return `${this.value} ${this.unit}`
  }

  isRecentMeasurement(daysThreshold: number = 7): boolean {
    const threshold = new Date()
    threshold.setDate(threshold.getDate() - daysThreshold)
    return this.recordedAt >= threshold
  }

  getMetricCategory(): string {
    switch (this.type) {
      case MeasurementType.WEIGHT:
      case MeasurementType.BODY_FAT:
      case MeasurementType.MUSCLE_MASS:
        return 'body_composition'
      case MeasurementType.WAIST:
      case MeasurementType.CHEST:
      case MeasurementType.ARMS:
      case MeasurementType.THIGHS:
        return 'body_measurements'
      case MeasurementType.BLOOD_PRESSURE:
      case MeasurementType.HEART_RATE:
        return 'vital_signs'
      default:
        return 'general'
    }
  }
}