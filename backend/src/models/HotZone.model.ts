import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  AllowNull
} from 'sequelize-typescript';

export enum LocationType {
  LIBRARY = 'library',
  CAFETERIA = 'cafeteria',
  HOSTEL = 'hostel',
  SPORTS = 'sports',
  ACADEMIC = 'academic',
  OTHER = 'other'
}

@Table({
  tableName: 'hot_zones',
  timestamps: true,
  underscored: true
})
class HotZone extends Model {
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    primaryKey: true
  })
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING(100))
  name!: string;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...Object.values(LocationType))
  })
  location_type!: LocationType;

  @AllowNull(false)
  @Column(DataType.DECIMAL(10, 8))
  latitude!: number;

  @AllowNull(false)
  @Column(DataType.DECIMAL(11, 8))
  longitude!: number;

  @Default(50)
  @Column(DataType.INTEGER)
  radius!: number; // in meters

  @Default(0)
  @Column(DataType.INTEGER)
  current_user_count!: number;

  @Column(DataType.TIME)
  peak_time_start?: string;

  @Column(DataType.TIME)
  peak_time_end?: string;

  @Default(true)
  @Column(DataType.BOOLEAN)
  is_active!: boolean;

  // Instance methods
  isPeakTime(): boolean {
    if (!this.peak_time_start || !this.peak_time_end) return false;
    
    const now = new Date();
    const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS
    
    return currentTime >= this.peak_time_start && currentTime <= this.peak_time_end;
  }

  async updateUserCount(count: number): Promise<void> {
    this.current_user_count = count;
    await this.save();
  }

  getPopularityLevel(): 'low' | 'medium' | 'high' {
    if (this.current_user_count === 0) return 'low';
    if (this.current_user_count <= 5) return 'medium';
    return 'high';
  }
}

export default HotZone;