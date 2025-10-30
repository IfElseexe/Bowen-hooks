import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  Default,
  AllowNull,
  Unique
} from 'sequelize-typescript';
import ChallengeSubmission from './ChallengeSubmission.model';

export enum ChallengeStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  VOTING = 'voting',
  COMPLETED = 'completed'
}

@Table({
  tableName: 'photo_challenges',
  timestamps: true,
  underscored: true
})
class PhotoChallenge extends Model {
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    primaryKey: true
  })
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING(200))
  title!: string;

  @Column(DataType.TEXT)
  description?: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.DATEONLY)
  challenge_date!: Date;

  @AllowNull(false)
  @Column(DataType.DATE)
  submission_deadline!: Date;

  @AllowNull(false)
  @Column(DataType.DATE)
  voting_deadline!: Date;

  @Default(ChallengeStatus.UPCOMING)
  @Column({
    type: DataType.ENUM(...Object.values(ChallengeStatus))
  })
  status!: ChallengeStatus;

  @Default(0)
  @Column(DataType.INTEGER)
  total_submissions!: number;

  // Relationships
  @HasMany(() => ChallengeSubmission)
  submissions!: ChallengeSubmission[];

  // Instance methods
  updateStatus(): void {
    const now = new Date();
    
    if (now < this.submission_deadline) {
      this.status = ChallengeStatus.ACTIVE;
    } else if (now < this.voting_deadline) {
      this.status = ChallengeStatus.VOTING;
    } else {
      this.status = ChallengeStatus.COMPLETED;
    }
  }

  canSubmit(): boolean {
    return new Date() <= this.submission_deadline && this.status === ChallengeStatus.ACTIVE;
  }

  canVote(): boolean {
    const now = new Date();
    return now > this.submission_deadline && now <= this.voting_deadline && this.status === ChallengeStatus.VOTING;
  }

  async updateSubmissionCount(): Promise<void> {
    const count = await ChallengeSubmission.count({
      where: { challenge_id: this.id }
    });
    this.total_submissions = count;
    await this.save();
  }

  getTimeUntilSubmissionDeadline(): number {
    return Math.max(0, this.submission_deadline.getTime() - new Date().getTime());
  }

  getTimeUntilVotingDeadline(): number {
    return Math.max(0, this.voting_deadline.getTime() - new Date().getTime());
  }
}

export default PhotoChallenge;