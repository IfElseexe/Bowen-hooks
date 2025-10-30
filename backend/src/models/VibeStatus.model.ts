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

@Table({
  tableName: 'vibe_statuses',
  timestamps: true,
  underscored: true
})
class VibeStatus extends Model {
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    primaryKey: true
  })
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  user_id!: string;

  @AllowNull(false)
  @Column(DataType.STRING(50))
  vibe_type!: string; // e.g., "study_buddy", "food_run", "party_mode"

  @Column(DataType.STRING(200))
  custom_message?: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  expires_at!: Date;

  @Default(true)
  @Column(DataType.BOOLEAN)
  is_active!: boolean;

  // Relationships
  @BelongsTo(() => User)
  user!: User;

  // Instance methods
  isExpired(): boolean {
    return new Date() >= this.expires_at;
  }

  getTimeRemaining(): number {
    const now = new Date();
    return Math.max(0, this.expires_at.getTime() - now.getTime());
  }

  async deactivate(): Promise<void> {
    this.is_active = false;
    await this.save();
  }

  getDisplayMessage(): string {
    const vibeMessages: { [key: string]: string } = {
      'study_buddy': 'Looking for study partner 📚',
      'food_run': 'Want to grab food? 🍔',
      'party_mode': 'Ready to party! 🎉',
      'bored_af': 'Bored, anyone free? 😴',
      'deep_convos': 'Deep conversations only 💭',
      'workout_buddy': 'Need workout partner 💪',
      'coffee_chat': 'Coffee & chat time ☕',
      'gaming_session': 'Anyone gaming? 🎮'
    };

    return this.custom_message || vibeMessages[this.vibe_type] || this.vibe_type;
  }

  // Hooks
  @BeforeCreate
  static setDefaultExpiry(vibeStatus: VibeStatus) {
    if (!vibeStatus.expires_at) {
      // Default to 3 hours
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 3);
      vibeStatus.expires_at = expiry;
    }
  }
}

export default VibeStatus;