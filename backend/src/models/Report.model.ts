import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
  AllowNull
} from 'sequelize-typescript';
import User from './User.model';

export enum ReportReason {
  HARASSMENT = 'harassment',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  SPAM = 'spam',
  FAKE_PROFILE = 'fake_profile',
  UNDERAGE = 'underage',
  OTHER = 'other'
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

export enum ContentType {
  USER = 'user',
  MESSAGE = 'message',
  CONFESSION = 'confession',
  EVENT = 'event',
  PHOTO = 'photo'
}

@Table({
  tableName: 'reports',
  timestamps: true,
  underscored: true
})
class Report extends Model {
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    primaryKey: true
  })
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  reporter_id!: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  reported_user_id?: string;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...Object.values(ContentType))
  })
  reported_content_type!: ContentType;

  @Column(DataType.UUID)
  reported_content_id?: string;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...Object.values(ReportReason))
  })
  reason!: ReportReason;

  @Column(DataType.TEXT)
  description?: string;

  @Default(ReportStatus.PENDING)
  @Column({
    type: DataType.ENUM(...Object.values(ReportStatus))
  })
  status!: ReportStatus;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  reviewed_by?: string;

  @Column(DataType.DATE)
  reviewed_at?: Date;

  @Column(DataType.STRING(255))
  action_taken?: string;

  // Relationships
  @BelongsTo(() => User, 'reporter_id')
  reporter!: User;

  @BelongsTo(() => User, 'reported_user_id')
  reported_user?: User;

  @BelongsTo(() => User, 'reviewed_by')
  reviewer?: User;

  // Instance methods
  async assignForReview(adminId: string): Promise<void> {
    this.status = ReportStatus.REVIEWING;
    this.reviewed_by = adminId;
    this.reviewed_at = new Date();
    await this.save();
  }

  async resolve(action: string): Promise<void> {
    this.status = ReportStatus.RESOLVED;
    this.action_taken = action;
    await this.save();
  }

  async dismiss(): Promise<void> {
    this.status = ReportStatus.DISMISSED;
    await this.save();
  }

  isPending(): boolean {
    return this.status === ReportStatus.PENDING;
  }

  getDaysSinceReport(): number {
    const now = new Date();
    const diffMs = now.getTime() - this.createdAt.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }
}

export default Report;