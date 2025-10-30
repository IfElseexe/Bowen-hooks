import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
  AllowNull,
  BeforeCreate
} from 'sequelize-typescript';
import User from './User.model';
import Match from './Match.model';

export enum BombType {
  QUICK_FUSE = 'quick_fuse', // 30 seconds
  TIME_BOMB = 'time_bomb',   // 24 hours
  SLOW_BURN = 'slow_burn'    // 3 days
}

@Table({
  tableName: 'bomb_messages',
  timestamps: true,
  underscored: true
})
class BombMessage extends Model {
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

  @AllowNull(false)
  @Column(DataType.TEXT)
  content!: string;

  @Default(BombType.TIME_BOMB)
  @Column({
    type: DataType.ENUM(...Object.values(BombType))
  })
  bomb_type!: BombType;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  duration!: number; // in seconds

  @AllowNull(false)
  @Column(DataType.DATE)
  explodes_at!: Date;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_read!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_exploded!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  screenshot_taken!: boolean;

  @Column(DataType.DATE)
  screenshot_at?: Date;

  // Relationships
  @BelongsTo(() => Match)
  match!: Match;

  @BelongsTo(() => User, 'sender_id')
  sender!: User;

  @BelongsTo(() => User, 'receiver_id')
  receiver!: User;

  // Instance methods
  getTimeRemaining(): number {
    const now = new Date();
    return Math.max(0, this.explodes_at.getTime() - now.getTime());
  }

  isActive(): boolean {
    return !this.is_exploded && this.getTimeRemaining() > 0;
  }

  async markAsRead(): Promise<void> {
    this.is_read = true;
    await this.save();
  }

  async markScreenshotTaken(): Promise<void> {
    this.screenshot_taken = true;
    this.screenshot_at = new Date();
    await this.save();
  }

  async explode(): Promise<void> {
    this.is_exploded = true;
    await this.save();
  }

  // Hooks
  @BeforeCreate
  static setExplosionTime(bombMessage: BombMessage) {
    const now = new Date();
    let durationMs = bombMessage.duration * 1000;

    // Set default durations based on bomb type
    if (!bombMessage.duration) {
      switch (bombMessage.bomb_type) {
        case BombType.QUICK_FUSE:
          durationMs = 30 * 1000; // 30 seconds
          break;
        case BombType.TIME_BOMB:
          durationMs = 24 * 60 * 60 * 1000; // 24 hours
          break;
        case BombType.SLOW_BURN:
          durationMs = 3 * 24 * 60 * 60 * 1000; // 3 days
          break;
      }
      bombMessage.duration = durationMs / 1000;
    }

    bombMessage.explodes_at = new Date(now.getTime() + durationMs);
  }
}

export default BombMessage;