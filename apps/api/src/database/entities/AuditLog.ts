import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_logs')
@Index(['actorId', 'createdAt'])
@Index(['targetType', 'targetId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid', nullable: true }) actorId: string | null;
  @Column({ type: 'varchar', length: 100 }) action: string;
  @Column({ type: 'varchar', length: 80 }) targetType: string;
  @Column({ type: 'uuid', nullable: true }) targetId: string | null;
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" }) details: Record<string, unknown>;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
