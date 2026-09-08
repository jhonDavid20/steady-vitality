import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

@Entity('water_logs')
@Unique('UQ_water_log_client_day', ['clientId', 'localDate'])
@Index(['clientId', 'localDate'])
export class WaterLog {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) clientId: string;
  @Column({ type: 'date' }) localDate: string;
  @Column({ type: 'int', default: 0 }) amountMl: number;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
