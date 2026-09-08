import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum PaymentStatus { PENDING = 'pending', PAID = 'paid', FAILED = 'failed', REFUNDED = 'refunded' }

@Entity('payment_attempts')
@Index(['clientPackageId'])
@Index(['providerCheckoutId'], { unique: true })
export class PaymentAttempt {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) clientPackageId: string;
  @Column({ type: 'varchar', length: 30 }) provider: string;
  @Column({ type: 'varchar', length: 255, nullable: true }) providerCheckoutId: string | null;
  @Column({ type: 'varchar', length: 255, nullable: true }) providerPaymentId: string | null;
  @Column({ type: 'int' }) amountCents: number;
  @Column({ type: 'char', length: 3 }) currency: string;
  @Column({ type: 'int' }) platformFeeCents: number;
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING }) status: PaymentStatus;
  @Column({ type: 'text', nullable: true }) failureReason: string | null;
  @Column({ type: 'timestamptz', nullable: true }) paidAt: Date | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
