import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { IsOptional, IsNumber, IsString, IsEnum, Min, Max } from 'class-validator';
import { User } from './User';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export enum ActivityLevel {
  SEDENTARY = 'sedentary',
  LIGHTLY_ACTIVE = 'lightly_active',
  MODERATELY_ACTIVE = 'moderately_active',
  VERY_ACTIVE = 'very_active',
  EXTREMELY_ACTIVE = 'extremely_active',
}

export enum FitnessGoal {
  WEIGHT_LOSS = 'weight_loss',
  MUSCLE_GAIN = 'muscle_gain',
  MAINTENANCE = 'maintenance',
  STRENGTH = 'strength',
  ENDURANCE = 'endurance',
  FLEXIBILITY = 'flexibility',
  GENERAL_FITNESS = 'general_fitness',
}

@Entity('user_profiles')
@Index(['userId'], { unique: true })
@Index(['gender'])
@Index(['activityLevel'])
@Index(['fitnessGoal'])
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(13)
  @Max(120)
  age?: number;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(300)
  height?: number; // in cm

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(500)
  weight?: number; // in kg

  @Column({ type: 'varchar', length: 20, nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @Column({
    type: 'enum',
    enum: ActivityLevel,
    default: ActivityLevel.SEDENTARY,
  })
  @IsEnum(ActivityLevel)
  activityLevel: ActivityLevel;

  @Column({
    type: 'enum',
    enum: FitnessGoal,
    default: FitnessGoal.GENERAL_FITNESS,
  })
  @IsEnum(FitnessGoal)
  fitnessGoal: FitnessGoal;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(500)
  targetWeight?: number; // in kg

  @Column({ type: 'text', array: true, default: '{}' })
  @IsOptional()
  medicalConditions: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  @IsOptional()
  medications: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  @IsOptional()
  injuries: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  @IsOptional()
  dietaryRestrictions: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  @IsOptional()
  allergies: string[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  preferredWorkoutTime?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  gymLocation?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  dateOfBirth?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  address?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  city?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  state?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  country?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  timezone?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.profile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Virtual properties
  get bmi(): number | null {
    if (!this.height || !this.weight) return null;
    const heightInMeters = this.height / 100;
    return parseFloat((this.weight / (heightInMeters * heightInMeters)).toFixed(1));
  }

  get bmiCategory(): string | null {
    const bmi = this.bmi;
    if (!bmi) return null;
    
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  get weightGoalDifference(): number | null {
    if (!this.weight || !this.targetWeight) return null;
    return this.targetWeight - this.weight;
  }

  get isWeightLossGoal(): boolean {
    return this.fitnessGoal === FitnessGoal.WEIGHT_LOSS;
  }

  get isMuscleGainGoal(): boolean {
    return this.fitnessGoal === FitnessGoal.MUSCLE_GAIN;
  }

  // Calculate daily calorie needs (Mifflin-St Jeor Equation)
  calculateDailyCalories(): number | null {
    if (!this.age || !this.height || !this.weight || !this.gender) return null;

    let bmr: number;
    if (this.gender === Gender.MALE) {
      bmr = 10 * this.weight + 6.25 * this.height - 5 * this.age + 5;
    } else {
      bmr = 10 * this.weight + 6.25 * this.height - 5 * this.age - 161;
    }

    // Activity level multipliers
    const activityMultipliers = {
      [ActivityLevel.SEDENTARY]: 1.2,
      [ActivityLevel.LIGHTLY_ACTIVE]: 1.375,
      [ActivityLevel.MODERATELY_ACTIVE]: 1.55,
      [ActivityLevel.VERY_ACTIVE]: 1.725,
      [ActivityLevel.EXTREMELY_ACTIVE]: 1.9,
    };

    return Math.round(bmr * activityMultipliers[this.activityLevel]);
  }
}