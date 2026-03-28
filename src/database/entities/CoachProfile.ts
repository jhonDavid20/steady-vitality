import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { User } from './User';
import { Package } from './Package';

@Entity('coach_profiles')
@Index(['userId'], { unique: true })
@Index(['acceptingClients'])
export class CoachProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  bio?: string;

  @Column({ type: 'text', array: true, default: '{}' })
  specialties: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sessionRateUSD?: number;

  @Column({ type: 'text', array: true, default: '{}' })
  certifications: string[];

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  acceptingClients: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.coachProfile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Package, (pkg) => pkg.coachProfile)
  packages: Package[];
}
