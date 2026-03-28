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
import { IsEnum, IsOptional } from 'class-validator';
import { User } from './User';
import { Package } from './Package';

export enum ClientPackageStatus {
  ACTIVE = 'active',
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
