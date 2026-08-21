import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { User } from './User';
import { Package } from './Package';

export enum ClientPackageStatus {
  PENDING   = 'pending',
  ACTIVE    = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('client_packages')
@Index(['clientId'])
@Index(['packageId'])
@Index(['coachId'])
@Index(['status'])
export class ClientPackage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  clientId: string;

  @Column({ type: 'uuid' })
  packageId: string;

  @Column({ type: 'uuid' })
  coachId: string;

  @Column({
    type: 'enum',
    enum: ClientPackageStatus,
    default: ClientPackageStatus.ACTIVE,
  })
  @IsEnum(ClientPackageStatus)
  status: ClientPackageStatus;

  @Column({ type: 'timestamptz', nullable: true })
  @IsOptional()
  startDate?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  @IsOptional()
  endDate?: Date;

  /** How many sessions the client has completed under this package. */
  @Column({ type: 'int', default: 0 })
  @IsInt()
  @Min(0)
  sessionsCompleted: number;

  /** Coach-written note specific to this client's assignment. */
  @Column({ type: 'text', nullable: true })
  @IsOptional()
  notes?: string | null;

  /** Goals set by the coach for this client under this package. */
  @Column({ type: 'text', array: true, nullable: true })
  @IsOptional()
  goals?: string[] | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.clientPackages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clientId' })
  client: User;

  @ManyToOne(() => Package, (pkg) => pkg.clientPackages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'packageId' })
  package: Package;

  @ManyToOne(() => User, (user) => user.coachClientPackages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'coachId' })
  coach: User;
}
