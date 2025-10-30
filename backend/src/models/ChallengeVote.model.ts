import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  AllowNull,
  Unique,
  Default
} from 'sequelize-typescript';
import User from './User.model';
import ChallengeSubmission from './ChallengeSubmission.model';

@Table({
  tableName: 'challenge_votes',
  timestamps: true,
  underscored: true
})
class ChallengeVote extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4
  })
  id!: string;

  @ForeignKey(() => ChallengeSubmission)
  @AllowNull(false)
  @Column(DataType.UUID)
  submission_id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  user_id!: string;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  voted_at!: Date;

  // Relationships
  @BelongsTo(() => ChallengeSubmission)
  submission!: ChallengeSubmission;

  @BelongsTo(() => User)
  user!: User;
}

export default ChallengeVote;