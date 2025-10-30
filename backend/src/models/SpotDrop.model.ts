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
  tableName: 'spot_drops',
  timestamps: true,
  underscored: true
})
class SpotDrop extends Model {
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
  @Column(DataType.DECIMAL(10, 8))
  latitude!: number;

  @AllowNull(false)
  @Column(DataType.DECIMAL(11, 8))
  longitude!: number;

  @Default(10)
  @Column(DataType.INTEGER)
  radius!: number; // in meters

  @AllowNull(false)
  @Column(DataType.TEXT)
  message!: string;

  @Default(true)
  @Column(DataType.BOOLEAN)
  is_anonymous!: boolean;

  @AllowNull(false)
  @Column(DataType.DATE)
  expires_at!: Date;

  @Default(0)
  @Column(DataType.INTEGER)
  view_count!: number;

  // Relationships
  @BelongsTo(() => User)
  user!: User;

  // Instance methods
  isExpired(): boolean {
    return new Date() >= this.expires_at;
  }

  async incrementViewCount(): Promise<void> {
    this.view_count += 1;
    await this.save();
  }

  getTimeRemaining(): number {
    const now = new Date();
    return Math.max(0, this.expires_at.getTime() - now.getTime());
  }

  // Hooks
  @BeforeCreate
  static setDefaultExpiry(spotDrop: SpotDrop) {
    if (!spotDrop.expires_at) {
      // Default to 24 hours
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 24);
      spotDrop.expires_at = expiry;
    }
  }
}

export default SpotDrop;