import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  Default,
  AllowNull,
  Unique,
  BeforeCreate
} from 'sequelize-typescript';
import User from './User.model';
import Message from './Message.model';

export enum MatchType {
  MUTUAL_LIKE = 'mutual_like',
  SUPER_LIKE = 'super_like',
  SPARK_MATCH = 'spark_match',
  MYSTERY_MATCH = 'mystery_match',
  VIBE_MATCH = 'vibe_match'
}

export enum MatchStatus {
  PENDING = 'pending',
  MATCHED = 'matched',
  UNMATCHED = 'unmatched',
  EXPIRED = 'expired'
}

@Table({
  tableName: 'matches',
  timestamps: true,
  underscored: true
})
class Match extends Model {
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

  @Default(MatchType.MUTUAL_LIKE)
  @Column({
    type: DataType.ENUM(...Object.values(MatchType))
  })
  match_type!: MatchType;

  @Default(MatchStatus.PENDING)
  @Column({
    type: DataType.ENUM(...Object.values(MatchStatus))
  })
  status!: MatchStatus;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_mystery!: boolean;

  @Column(DataType.DATE)
  reveal_at?: Date;

  @Column(DataType.DATE)
  matched_at?: Date;

  @Default(false)
  @Column(DataType.BOOLEAN)
  conversation_started!: boolean;

  // Relationships
  @BelongsTo(() => User, 'user1_id')
  user1!: User;

  @BelongsTo(() => User, 'user2_id')
  user2!: User;

  @HasMany(() => Message)
  messages!: Message[];

  // Instance methods
  async markAsMatched(): Promise<void> {
    this.status = MatchStatus.MATCHED;
    this.matched_at = new Date();
    await this.save();
  }

  async startConversation(): Promise<void> {
    this.conversation_started = true;
    await this.save();
  }

  getOtherUserId(currentUserId: string): string {
    return this.user1_id === currentUserId ? this.user2_id : this.user1_id;
  }

  isRevealed(): boolean {
    if (!this.is_mystery) return true;
    if (this.reveal_at && this.reveal_at <= new Date()) return true;
    return false;
  }

  // Hooks
  @BeforeCreate
  static setMatchedAt(match: Match) {
    if (match.status === MatchStatus.MATCHED && !match.matched_at) {
      match.matched_at = new Date();
    }
  }
}

export default Match;