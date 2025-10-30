import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
  AllowNull,
  Index
} from 'sequelize-typescript';
import User from './User.model';

@Table({
  tableName: 'locations',
  timestamps: true,
  underscored: true
})
class Location extends Model {
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

  @Column(DataType.DECIMAL(10, 2))
  accuracy?: number;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_ghost_mode!: boolean;

  @Column(DataType.DATE)
  last_updated?: Date;

  // Relationships
  @BelongsTo(() => User)
  user!: User;

  // Instance methods
  async updateLocation(lat: number, lng: number, accuracy?: number): Promise<void> {
    this.latitude = lat;
    this.longitude = lng;
    this.accuracy = accuracy;
    this.last_updated = new Date();
    await this.save();
  }

  enableGhostMode(): void {
    this.is_ghost_mode = true;
  }

  disableGhostMode(): void {
    this.is_ghost_mode = false;
  }

  isLocationRecent(maxAgeMinutes: number = 10): boolean {
    if (!this.last_updated) return false;
    const now = new Date();
    const diffMs = now.getTime() - this.last_updated.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    return diffMinutes <= maxAgeMinutes;
  }
}

export default Location;