import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm'
import { IsString, IsBoolean, IsEnum, IsOptional, IsDate } from 'class-validator'
import { User } from './User'

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM'
}

@Entity('messages')
@Index(['userId'])
@Index(['isFromAdmin'])
@Index(['isRead'])
@Index(['sentAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  @Index()
  userId: string

  // Message details
  @Column()
  @IsString()
  content: string

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT
  })
  @IsEnum(MessageType)
  type: MessageType

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  fileUrl?: string // For file attachments

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  fileName?: string

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  fileSize?: string

  // Metadata
  @Column({ default: false })
  @IsBoolean()
  @Index()
  isFromAdmin: boolean

  @Column({ default: false })
  @IsBoolean()
  @Index()
  isRead: boolean

  @Column({ nullable: true })
  @IsOptional()
  @IsDate()
  readAt?: Date

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  @IsDate()
  @Index()
  sentAt: Date

  @CreateDateColumn()
  createdAt: Date

  // Relations
  @ManyToOne(() => User, user => user.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User

  // Methods
  markAsRead(): void {
    if (!this.isRead) {
      this.isRead = true
      this.readAt = new Date()
    }
  }

  markAsUnread(): void {
    this.isRead = false
    this.readAt = undefined
  }

  isFromUser(): boolean {
    return !this.isFromAdmin
  }

  hasAttachment(): boolean {
    return this.type !== MessageType.TEXT && !!this.fileUrl
  }

  getMessagePreview(maxLength: number = 50): string {
    if (this.type === MessageType.IMAGE) return '[Image]'
    if (this.type === MessageType.FILE) return `[File: ${this.fileName}]`
    if (this.type === MessageType.SYSTEM) return '[System Message]'
    
    return this.content.length > maxLength 
      ? this.content.substring(0, maxLength) + '...'
      : this.content
  }

  getTimeSince(): string {
    const now = new Date()
    const diffMs = now.getTime() - this.sentAt.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return this.sentAt.toLocaleDateString()
  }
}