import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { IsUUID, IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { User } from './User';

export enum AssignmentStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  TERMINATED = 'terminated',
}

export enum AssignmentType {
  PERSONAL_TRAINING = 'personal_training',
  NUTRITION_COACHING = 'nutrition_coaching',
  FULL_PROGRAM = 'full_program',
  CONSULTATION = 'consultation',
}

@Entity('coach_trainee_assignments')
@Index(['coachId'])
@Index(['traineeId'])
@Index(['status'])
@Index(['isActive'])
@Index(['assignedAt'])
@Index(['endedAt'])
@Check(`"coachId" != "traineeId"`) // Ensure coach and trainee are different users
export class CoachTraineeAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  coachId: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  traineeId: string;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.ACTIVE,
  })
  @IsEnum(AssignmentStatus)
  status: AssignmentStatus;

  @Column({
    type: 'enum',
    enum: AssignmentType,
    default: AssignmentType.FULL_PROGRAM,
  })
  @IsEnum(AssignmentType)
  assignmentType: AssignmentType;

  @Column({ type: 'timestamptz' })
  assignedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  @IsOptional()
  endedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  @IsOptional()
  pausedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  @IsOptional()
  resumedAt?: Date;

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  assignmentReason?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  terminationReason?: string;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  assignedBy?: string; // Admin who made the assignment

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  terminatedBy?: string; // Who ended the assignment

  @Column({ type: 'int', default: 0 })
  totalSessions: number;

  @Column({ type: 'int', default: 0 })
  completedSessions: number;

  @Column({ type: 'timestamptz', nullable: true })
  @IsOptional()
  lastInteractionAt?: Date;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  @IsOptional()
  satisfactionRating?: number; // 1.00 to 5.00

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  clientFeedback?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  coachFeedback?: string;

  @Column({ type: 'json', nullable: true })
  @IsOptional()
  preferences?: Record<string, any>; // Session preferences, communication preferences, etc.

  @Column({ type: 'json', nullable: true })
  @IsOptional()
  goals?: Record<string, any>; // Specific goals for this assignment

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.coachAssignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'coachId' })
  coach: User;

  @ManyToOne(() => User, (user) => user.traineeAssignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'traineeId' })
  trainee: User;

  // Virtual properties
  get duration(): number | null {
    if (!this.endedAt) return null;
    return Math.floor((this.endedAt.getTime() - this.assignedAt.getTime()) / (1000 * 60 * 60 * 24));
  }

  get daysActive(): number {
    const endDate = this.endedAt || new Date();
    return Math.floor((endDate.getTime() - this.assignedAt.getTime()) / (1000 * 60 * 60 * 24));
  }

  get sessionCompletionRate(): number {
    if (this.totalSessions === 0) return 0;
    return (this.completedSessions / this.totalSessions) * 100;
  }

  get isCompleted(): boolean {
    return this.status === AssignmentStatus.COMPLETED;
  }

  get isPaused(): boolean {
    return this.status === AssignmentStatus.PAUSED;
  }

  get isTerminated(): boolean {
    return this.status === AssignmentStatus.TERMINATED;
  }

  get daysSinceLastInteraction(): number | null {
    if (!this.lastInteractionAt) return null;
    return Math.floor((new Date().getTime() - this.lastInteractionAt.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Instance methods
  pause(reason?: string, pausedBy?: string): void {
    if (this.status !== AssignmentStatus.ACTIVE) {
      throw new Error('Can only pause active assignments');
    }
    
    this.status = AssignmentStatus.PAUSED;
    this.pausedAt = new Date();
    this.isActive = false;
    
    if (reason) {
      this.notes = this.notes ? `${this.notes}\n[PAUSED] ${reason}` : `[PAUSED] ${reason}`;
    }
  }

  resume(reason?: string): void {
    if (this.status !== AssignmentStatus.PAUSED) {
      throw new Error('Can only resume paused assignments');
    }
    
    this.status = AssignmentStatus.ACTIVE;
    this.resumedAt = new Date();
    this.isActive = true;
    
    if (reason) {
      this.notes = this.notes ? `${this.notes}\n[RESUMED] ${reason}` : `[RESUMED] ${reason}`;
    }
  }

  complete(reason?: string, completedBy?: string): void {
    if (![AssignmentStatus.ACTIVE, AssignmentStatus.PAUSED].includes(this.status)) {
      throw new Error('Can only complete active or paused assignments');
    }
    
    this.status = AssignmentStatus.COMPLETED;
    this.endedAt = new Date();
    this.isActive = false;
    this.terminatedBy = completedBy;
    
    if (reason) {
      this.terminationReason = reason;
      this.notes = this.notes ? `${this.notes}\n[COMPLETED] ${reason}` : `[COMPLETED] ${reason}`;
    }
  }

  terminate(reason: string, terminatedBy?: string): void {
    if (this.status === AssignmentStatus.TERMINATED) {
      throw new Error('Assignment is already terminated');
    }
    
    this.status = AssignmentStatus.TERMINATED;
    this.endedAt = new Date();
    this.isActive = false;
    this.terminationReason = reason;
    this.terminatedBy = terminatedBy;
    
    this.notes = this.notes ? `${this.notes}\n[TERMINATED] ${reason}` : `[TERMINATED] ${reason}`;
  }

  updateLastInteraction(): void {
    this.lastInteractionAt = new Date();
  }

  incrementSessionCount(): void {
    this.totalSessions += 1;
  }

  completeSession(): void {
    this.completedSessions += 1;
    this.updateLastInteraction();
  }

  addNote(note: string, author?: string): void {
    const timestamp = new Date().toISOString();
    const noteWithMeta = author 
      ? `[${timestamp}] ${author}: ${note}`
      : `[${timestamp}] ${note}`;
    
    this.notes = this.notes 
      ? `${this.notes}\n${noteWithMeta}`
      : noteWithMeta;
  }

  setPreference(key: string, value: any): void {
    if (!this.preferences) {
      this.preferences = {};
    }
    this.preferences[key] = value;
  }

  getPreference(key: string, defaultValue?: any): any {
    return this.preferences?.[key] ?? defaultValue;
  }

  setGoal(key: string, value: any): void {
    if (!this.goals) {
      this.goals = {};
    }
    this.goals[key] = value;
  }

  getGoal(key: string, defaultValue?: any): any {
    return this.goals?.[key] ?? defaultValue;
  }

  setSatisfactionRating(rating: number, feedback?: string): void {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    
    this.satisfactionRating = Number(rating.toFixed(2));
    if (feedback) {
      this.clientFeedback = feedback;
    }
  }

  // Static methods
  static async findActiveAssignments(coachId?: string, traineeId?: string): Promise<CoachTraineeAssignment[]> {
    const where: any = { status: AssignmentStatus.ACTIVE, isActive: true };
    
    if (coachId) where.coachId = coachId;
    if (traineeId) where.traineeId = traineeId;
    
    return CoachTraineeAssignment.find({
      where,
      relations: ['coach', 'trainee'],
      order: { assignedAt: 'DESC' },
    });
  }

  static async findByCoach(coachId: string): Promise<CoachTraineeAssignment[]> {
    return CoachTraineeAssignment.find({
      where: { coachId },
      relations: ['trainee'],
      order: { assignedAt: 'DESC' },
    });
  }

  static async findByTrainee(traineeId: string): Promise<CoachTraineeAssignment[]> {
    return CoachTraineeAssignment.find({
      where: { traineeId },
      relations: ['coach'],
      order: { assignedAt: 'DESC' },
    });
  }

  static async getCoachWorkload(coachId: string): Promise<{
    activeClients: number;
    totalClients: number;
    averageRating: number;
    completionRate: number;
  }> {
    const assignments = await CoachTraineeAssignment.findByCoach(coachId);
    
    const activeClients = assignments.filter(a => a.status === AssignmentStatus.ACTIVE).length;
    const completedAssignments = assignments.filter(a => a.status === AssignmentStatus.COMPLETED);
    
    const ratingsSum = assignments
      .filter(a => a.satisfactionRating)
      .reduce((sum, a) => sum + (a.satisfactionRating || 0), 0);
    const ratingsCount = assignments.filter(a => a.satisfactionRating).length;
    
    const totalSessions = assignments.reduce((sum, a) => sum + a.totalSessions, 0);
    const completedSessions = assignments.reduce((sum, a) => sum + a.completedSessions, 0);
    
    return {
      activeClients,
      totalClients: assignments.length,
      averageRating: ratingsCount > 0 ? ratingsSum / ratingsCount : 0,
      completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
    };
  }

  toJSON(): Partial<CoachTraineeAssignment> {
    return {
      id: this.id,
      coachId: this.coachId,
      traineeId: this.traineeId,
      status: this.status,
      assignmentType: this.assignmentType,
      assignedAt: this.assignedAt,
      endedAt: this.endedAt,
      isActive: this.isActive,
      duration: this.duration,
      daysActive: this.daysActive,
      sessionCompletionRate: this.sessionCompletionRate,
      totalSessions: this.totalSessions,
      completedSessions: this.completedSessions,
      satisfactionRating: this.satisfactionRating,
      lastInteractionAt: this.lastInteractionAt,
      daysSinceLastInteraction: this.daysSinceLastInteraction,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}