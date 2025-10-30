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

@Table({
  tableName: 'rizz_scores',
  timestamps: true,
  underscored: true
})
class RizzScore extends Model {
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    primaryKey: true
  })
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Unique
  @Column(DataType.UUID)
  user_id!: string;

  @Default(0)
  @Column(DataType.INTEGER)
  total_score!: number;

  @Default(0)
  @Column(DataType.DECIMAL(5, 2))
  response_rate!: number; // Percentage

  @Default(0)
  @Column(DataType.INTEGER)
  average_conversation_length!: number; // Average messages per conversation

  @Default(0)
  @Column(DataType.DECIMAL(5, 2))
  match_rate!: number; // Percentage of likes that become matches

  @Default(0)
  @Column(DataType.INTEGER)
  event_attendance!: number; // Number of events attended

  @Default(0)
  @Column(DataType.INTEGER)
  login_streak_bonus!: number;

  @Column(DataType.INTEGER)
  weekly_rank?: number;

  @Column(DataType.INTEGER)
  all_time_rank?: number;

  @Column(DataType.DATE)
  last_calculated?: Date;

  // Relationships
  @BelongsTo(() => User)
  user!: User;

  // Instance methods
  async calculateTotalScore(): Promise<number> {
    const baseScore = 
      (this.response_rate * 0.3) +
      (this.average_conversation_length * 0.2) +
      (this.match_rate * 0.3) +
      (this.event_attendance * 2) +
      (this.login_streak_bonus * 5);

    this.total_score = Math.round(Math.max(0, Math.min(100, baseScore)));
    this.last_calculated = new Date();
    await this.save();
    
    return this.total_score;
  }

  getRizzLevel(): string {
    if (this.total_score >= 90) return 'Campus Legend 🐐';
    if (this.total_score >= 80) return 'Smooth Operator 😎';
    if (this.total_score >= 70) return 'Social Butterfly 🦋';
    if (this.total_score >= 60) return 'Friendly Vibes 👍';
    if (this.total_score >= 50) return 'Getting There 💪';
    return 'Rizz in Progress 🌱';
  }

  async updateResponseRate(respondedCount: number, totalMessages: number): Promise<void> {
    if (totalMessages > 0) {
      this.response_rate = (respondedCount / totalMessages) * 100;
    }
    await this.calculateTotalScore();
  }

  async updateMatchRate(matchesCount: number, likesSent: number): Promise<void> {
    if (likesSent > 0) {
      this.match_rate = (matchesCount / likesSent) * 100;
    }
    await this.calculateTotalScore();
  }

  addEventAttendanceBonus(): void {
    this.event_attendance += 1;
  }

  addLoginStreakBonus(streak: number): void {
    this.login_streak_bonus = Math.min(10, Math.floor(streak / 7)); // Max 10 bonus points
  }
}

export default RizzScore;