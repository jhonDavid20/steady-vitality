import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('retention_notices')
@Unique('UQ_retention_notice', ['clientPackageId', 'kind'])
export class RetentionNotice {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) clientPackageId: string;
  @Column({ type: 'uuid' }) clientId: string;
  @Column({ type: 'varchar', length: 40 }) kind: string;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
