import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

@Entity('reviews')
@Unique('UQ_review_purchase', ['clientPackageId'])
@Index(['coachId', 'visible'])
export class Review {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) clientPackageId: string;
  @Column({ type: 'uuid' }) clientId: string;
  @Column({ type: 'uuid' }) coachId: string;
  @Column({ type: 'smallint' }) rating: number;
  @Column({ type: 'text', nullable: true }) text: string | null;
  @Column({ type: 'boolean', default: false }) anonymous: boolean;
  @Column({ type: 'boolean', default: true }) visible: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
