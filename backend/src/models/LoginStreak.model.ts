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
  tableName: 'login_streaks',
  timestamps: true,
  underscored: true
})
class LoginStreak extends Model {
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
  current_streak!: number;

  @Default(0)
  @Column(DataType.INTEGER)
  longest_streak!: number;

  @Column(DataType.DATEONLY)
  last_login_date?: Date;

  @Default(0)
  @Column(DataType.INTEGER)
  total_logins!: number;

  // Relationships
  @BelongsTo(() => User)
  user!: User;

  // Instance methods
  async recordLogin(): Promise<boolean> {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    // Check if already logged in today
    if (this.last_login_date && this.last_login_date.toDateString() === today) {
      return false; // Already logged in today
    }

    // Check if this continues a streak
    if (this.last_login_date && this.last_login_date.toDateString() === yesterday) {
      this.current_streak += 1;
    } else {
      this.current_streak = 1;
    }

    // Update longest streak if needed
    if (this.current_streak > this.longest_streak) {
      this.longest_streak = this.current_streak;
    }

    this.last_login_date = new Date();
    this.total_logins += 1;

    await this.save();
    return true;
  }

  getStreakBonus(): number {
    if (this.current_streak >= 30) return 50; // 1 month
    if (this.current_streak >= 7) return 20;  // 1 week
    if (this.current_streak >= 3) return 10;  // 3 days
    return 0;
  }

  isStreakActive(): boolean {
    if (!this.last_login_date) return false;
    
    const yesterday = new Date(Date.now() - 86400000);
    const lastLogin = new Date(this.last_login_date);
    
    return lastLogin >= yesterday;
  }

  getDaysUntilNextBonus(): number {
    const nextMilestone = this.getNextMilestone();
    return nextMilestone - this.current_streak;
  }

  getNextMilestone(): number {
    const milestones = [3, 7, 14, 30, 60, 90];
    for (const milestone of milestones) {
      if (this.current_streak < milestone) {
        return milestone;
      }
    }
    return 100;
  }
}

export default LoginStreak;