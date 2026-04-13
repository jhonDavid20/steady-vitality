import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { CoachProfile } from './CoachProfile';
import { ClientPackage } from './ClientPackage';

@Entity('packages')
@Index(['coachId'])
@Index(['isActive'])
export class Package {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  coachId: string;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @MinLength(1)
  name: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column({ type: 'int' })
  @IsInt()
  @Min(1)
  durationWeeks: number;

  @Column({ type: 'int' })
  @IsInt()
  @Min(1)
  sessionsIncluded: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @IsNumber()
  @Min(0)
  priceUSD: number;

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  isActive: boolean;

  /** Bullet-point list of what's included in this package (e.g. "Nutrition plan", "Weekly calls"). */
  @Column({ type: 'text', array: true, nullable: true })
  @IsOptional()
  features?: string[] | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => CoachProfile, (coachProfile) => coachProfile.packages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'coachId' })
  coachProfile: CoachProfile;

  @OneToMany(() => ClientPackage, (cp) => cp.package)
  clientPackages: ClientPackage[];
}
