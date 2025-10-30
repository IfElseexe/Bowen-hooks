import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  AllowNull,
  Unique
} from 'sequelize-typescript';
import User from './User.model';
import Confession from './Confession.model';

export enum VoteType {
  UPVOTE = 'upvote',
  DOWNVOTE = 'downvote'
}

@Table({
  tableName: 'confession_votes',
  timestamps: true,
  underscored: true
})
class ConfessionVote extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4
  })
  id!: string;

  @ForeignKey(() => Confession)
  @AllowNull(false)
  @Column(DataType.UUID)
  confession_id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  user_id!: string;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...Object.values(VoteType))
  })
  vote_type!: VoteType;

  // Relationships
  @BelongsTo(() => Confession)
  confession!: Confession;

  @BelongsTo(() => User)
  user!: User;

  // Instance methods
  isUpvote(): boolean {
    return this.vote_type === VoteType.UPVOTE;
  }

  isDownvote(): boolean {
    return this.vote_type === VoteType.DOWNVOTE;
  }
}

export default ConfessionVote;