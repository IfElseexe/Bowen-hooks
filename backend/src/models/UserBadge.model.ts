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
import Badge from './Badge.model';

@Table({
  tableName: 'user_badges',
  timestamps: true,
  underscored: true
})
class UserBadge extends Model {
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

  @ForeignKey(() => Badge)
  @AllowNull(false)
  @Column(DataType.UUID)
  badge_id!: string;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  earned_at!: Date;

  // Relationships
  @BelongsTo(() => User)
  user!: User;

  @BelongsTo(() => Badge)
  badge!: Badge;

  // Instance methods
  getTimeSinceEarned(): string {
    const now = new Date();
    const diffMs = now.getTime() - this.earned_at.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }
}

export default UserBadge;