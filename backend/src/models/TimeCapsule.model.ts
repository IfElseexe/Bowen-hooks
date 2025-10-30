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
  tableName: 'time_capsules',
  timestamps: true,
  underscored: true
})
class TimeCapsule extends Model {
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    primaryKey: true
  })
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  sender_id!: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  receiver_id?: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  content!: string;

  @Column(DataType.TEXT)
  media_url?: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  send_at!: Date;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_sent!: boolean;

  @Column(DataType.DATE)
  sent_at?: Date;

  // Relationships
  @BelongsTo(() => User, 'sender_id')
  sender!: User;

  @BelongsTo(() => User, 'receiver_id')
  receiver?: User;

  // Instance methods
  isReadyToSend(): boolean {
    return !this.is_sent && new Date() >= this.send_at;
  }

  async markAsSent(): Promise<void> {
    this.is_sent = true;
    this.sent_at = new Date();
    await this.save();
  }

  getTimeUntilSend(): number {
    return Math.max(0, this.send_at.getTime() - new Date().getTime());
  }

  isFutureMessage(): boolean {
    return this.send_at > new Date();
  }
}

export default TimeCapsule;