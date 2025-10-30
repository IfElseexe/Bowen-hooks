import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
  AllowNull,
  Unique
} from 'sequelize-typescript';
import User from './User.model';

export enum SparkStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
  MATCHED = 'matched'
}

@Table({
  tableName: 'spark_sessions',
  timestamps: true,
  underscored: true
})
class SparkSession extends Model {
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    primaryKey: true
  })
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  user1_id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  user2_id!: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING(100))
  room_id!: string;

  @Default(SparkStatus.WAITING)
  @Column({
    type: DataType.ENUM(...Object.values(SparkStatus))
  })
  status!: SparkStatus;

  @Default(false)
  @Column(DataType.BOOLEAN)
  both_sparked!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  user1_sparked!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  user2_sparked!: boolean;

  @Column(DataType.INTEGER)
  duration?: number; // in seconds

  @Column(DataType.DATE)
  started_at?: Date;

  @Column(DataType.DATE)
  ended_at?: Date;

  // Relationships
  @BelongsTo(() => User, 'user1_id')
  user1!: User;

  @BelongsTo(() => User, 'user2_id')
  user2!: User;

  // Instance methods
  async startSession(): Promise<void> {
    this.status = SparkStatus.ACTIVE;
    this.started_at = new Date();
    await this.save();
  }

  async endSession(): Promise<void> {
    this.status = SparkStatus.COMPLETED;
    this.ended_at = new Date();
    
    if (this.started_at) {
      this.duration = Math.floor((this.ended_at.getTime() - this.started_at.getTime()) / 1000);
    }
    
    await this.save();
  }

  async userSpark(userId: string): Promise<void> {
    if (this.user1_id === userId) {
      this.user1_sparked = true;
    } else if (this.user2_id === userId) {
      this.user2_sparked = true;
    }
    
    if (this.user1_sparked && this.user2_sparked) {
      this.both_sparked = true;
      this.status = SparkStatus.MATCHED;
    }
    
    await this.save();
  }

  getOtherUserId(currentUserId: string): string {
    return this.user1_id === currentUserId ? this.user2_id : this.user1_id;
  }

  isUserInSession(userId: string): boolean {
    return this.user1_id === userId || this.user2_id === userId;
  }

  getTimeRemaining(): number {
    if (!this.started_at || this.status !== SparkStatus.ACTIVE) return 0;
    
    const maxDuration = 60; // 60 seconds
    const elapsed = (new Date().getTime() - this.started_at.getTime()) / 1000;
    return Math.max(0, maxDuration - elapsed);
  }
}

export default SparkSession;