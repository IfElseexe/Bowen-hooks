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
import Match from './Match.model';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VOICE = 'voice',
  QUESTION_GAME = 'question_game',
  TIME_CAPSULE = 'time_capsule'
}

@Table({
  tableName: 'messages',
  timestamps: true,
  underscored: true
})
class Message extends Model {
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    primaryKey: true
  })
  id!: string;

  @ForeignKey(() => Match)
  @AllowNull(false)
  @Column(DataType.UUID)
  match_id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  sender_id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  receiver_id!: string;

  @Column(DataType.TEXT)
  content?: string;

  @Default(MessageType.TEXT)
  @Column({
    type: DataType.ENUM(...Object.values(MessageType))
  })
  message_type!: MessageType;

  @Column(DataType.TEXT)
  media_url?: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_read!: boolean;

  @Column(DataType.DATE)
  read_at?: Date;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_anonymous!: boolean;

  // Relationships
  @BelongsTo(() => Match)
  match!: Match;

  @BelongsTo(() => User, 'sender_id')
  sender!: User;

  @BelongsTo(() => User, 'receiver_id')
  receiver!: User;

  // Instance methods
  async markAsRead(): Promise<void> {
    this.is_read = true;
    this.read_at = new Date();
    await this.save();
  }

  isExpired(): boolean {
    // For time-sensitive messages
    return false;
  }
}

export default Message;