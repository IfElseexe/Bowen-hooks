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
import UserBadge from './UserBadge.model';

export enum BadgeType {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  SPECIAL = 'special'
}

@Table({
  tableName: 'badges',
  timestamps: true,
  underscored: true
})
class Badge extends Model {
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    primaryKey: true
  })
  id!: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING(100))
  name!: string;

  @Column(DataType.TEXT)
  description?: string;

  @Column(DataType.TEXT)
  icon_url?: string;

  @Default(BadgeType.BRONZE)
  @Column({
    type: DataType.ENUM(...Object.values(BadgeType))
  })
  badge_type!: BadgeType;

  @Column(DataType.STRING(50))
  requirement_type?: string; // e.g., 'matches_count', 'login_streak', 'event_attendance'

  @Column(DataType.INTEGER)
  requirement_value?: number;

  // Relationships
  @HasMany(() => UserBadge)
  userBadges!: UserBadge[];

  // Instance methods
  getRarityColor(): string {
    const colors = {
      [BadgeType.BRONZE]: '#CD7F32',
      [BadgeType.SILVER]: '#C0C0C0',
      [BadgeType.GOLD]: '#FFD700',
      [BadgeType.PLATINUM]: '#E5E4E2',
      [BadgeType.SPECIAL]: '#FF69B4'
    };
    return colors[this.badge_type];
  }

  isEarnedByUser(userStats: any): boolean {
    switch (this.requirement_type) {
      case 'matches_count':
        return userStats.matchesCount >= (this.requirement_value || 0);
      case 'login_streak':
        return userStats.loginStreak >= (this.requirement_value || 0);
      case 'event_attendance':
        return userStats.eventsAttended >= (this.requirement_value || 0);
      case 'messages_sent':
        return userStats.messagesSent >= (this.requirement_value || 0);
      case 'rizz_score':
        return userStats.rizzScore >= (this.requirement_value || 0);
      default:
        return false;
    }
  }
}

export default Badge;