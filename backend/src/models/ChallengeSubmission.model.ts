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
  Unique
} from 'sequelize-typescript';
import User from './User.model';
import PhotoChallenge from './PhotoChallenge.model';
import ChallengeVote from './ChallengeVote.model';

@Table({
  tableName: 'challenge_submissions',
  timestamps: true,
  underscored: true
})
class ChallengeSubmission extends Model {
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    primaryKey: true
  })
  id!: string;

  @ForeignKey(() => PhotoChallenge)
  @AllowNull(false)
  @Column(DataType.UUID)
  challenge_id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  user_id!: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  photo_url!: string;

  @Column(DataType.STRING(255))
  caption?: string;

  @Default(0)
  @Column(DataType.INTEGER)
  vote_count!: number;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_winner!: boolean;

  @Column(DataType.INTEGER)
  winner_rank?: number;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  submitted_at!: Date;

  // Relationships
  @BelongsTo(() => PhotoChallenge)
  challenge!: PhotoChallenge;

  @BelongsTo(() => User)
  user!: User;

  @HasMany(() => ChallengeVote)
  votes!: ChallengeVote[];

  // Instance methods
  async incrementVoteCount(): Promise<void> {
    this.vote_count += 1;
    await this.save();
  }

  async decrementVoteCount(): Promise<void> {
    this.vote_count = Math.max(0, this.vote_count - 1);
    await this.save();
  }

  async markAsWinner(rank: number): Promise<void> {
    this.is_winner = true;
    this.winner_rank = rank;
    await this.save();
  }

  getVoteCount(): Promise<number> {
    return ChallengeVote.count({
      where: { submission_id: this.id }
    });
  }
}

export default ChallengeSubmission;