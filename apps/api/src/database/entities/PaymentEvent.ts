import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('payment_events')
export class PaymentEvent {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 255, unique: true }) providerEventId: string;
  @Column({ type: 'varchar', length: 120 }) type: string;
  @Column({ type: 'varchar', length: 64 }) payloadHash: string;
  @Column({ type: 'varchar', length: 30 }) outcome: string;
  @CreateDateColumn({ type: 'timestamptz' }) processedAt: Date;
}
