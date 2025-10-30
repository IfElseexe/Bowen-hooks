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

@Table({
  tableName: 'notifications',
  timestamps: true,
  underscored: true
})
class Notification extends Model {
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    primaryKey: true
  })
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  user_id!: string;

  @AllowNull(false)
  @Column(DataType.STRING(50))
  type!: string; // e.g., 'match', 'message', 'like', 'event'

  @AllowNull(false)
  @Column(DataType.STRING(200))
  title!: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  message!: string;

  @Column(DataType.JSONB)
  data?: any; // Additional data like match_id, message_id, etc.

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_read!: boolean;

  @Column(DataType.DATE)
  read_at?: Date;

  // Relationships
  @BelongsTo(() => User)
  user!: User;

  // Instance methods
  async markAsRead(): Promise<void> {
    this.is_read = true;
    this.read_at = new Date();
    await this.save();
  }

  getTimeSinceCreated(): string {
    const now = new Date();
    const diffMs = now.getTime() - this.createdAt.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  }

  getNotificationIcon(): string {
    const icons: { [key: string]: string } = {
      'match': '💕',
      'message': '💬',
      'like': '👍',
      'super_like': '⭐',
      'event': '🎉',
      'confession': '🗣️',
      'bomb_message': '💣',
      'spark_match': '⚡',
      'vibe_match': '🎯',
      'challenge_winner': '🏆'
    };
    return icons[this.type] || '🔔';
  }
}

export default Notification;