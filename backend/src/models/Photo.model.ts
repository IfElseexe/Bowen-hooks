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
  tableName: 'photos',
  timestamps: true,
  underscored: true
})
class Photo extends Model {
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
  @Column(DataType.TEXT)
  url!: string;

  @Column(DataType.TEXT)
  thumbnail_url?: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_primary!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_verified!: boolean;

  @Default(0)
  @Column(DataType.INTEGER)
  order_index!: number;

  @Default(0)
  @Column(DataType.INTEGER)
  blur_level!: number; // 0-100, for gradual reveal

  @Column(DataType.STRING(255))
  caption?: string;

  // Relationships
  @BelongsTo(() => User)
  user!: User;

  // Instance methods
  getBlurredUrl(): string {
    if (this.blur_level > 0) {
      // In production, you'd use image processing service
      return `${this.url}?blur=${this.blur_level}`;
    }
    return this.url;
  }

  async setPrimary(): Promise<void> {
    // Remove primary from other photos
    await Photo.update(
      { is_primary: false },
      { where: { user_id: this.user_id } }
    );
    
    this.is_primary = true;
    await this.save();
  }

  toJSON() {
    const values = { ...this.get() };
    
    // Return blurred URL if blur level is set
    if (this.blur_level > 0) {
      values.url = this.getBlurredUrl();
    }
    
    return values;
  }
}

export default Photo;