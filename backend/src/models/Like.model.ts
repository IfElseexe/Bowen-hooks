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

export enum LikeType {
  LIKE = 'like',
  SUPER_LIKE = 'super_like',
  PASS = 'pass'
}

@Table({
  tableName: 'likes',
  timestamps: true,
  underscored: true
})
class Like extends Model {
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    primaryKey: true
  })
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  from_user_id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  to_user_id!: string;

  @Default(LikeType.LIKE)
  @Column({
    type: DataType.ENUM(...Object.values(LikeType))
  })
  like_type!: LikeType;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_anonymous!: boolean;

  // Relationships
  @BelongsTo(() => User, 'from_user_id')
  from_user!: User;

  @BelongsTo(() => User, 'to_user_id')
  to_user!: User;

  // Instance methods
  isSuperLike(): boolean {
    return this.like_type === LikeType.SUPER_LIKE;
  }

  isPass(): boolean {
    return this.like_type === LikeType.PASS;
  }

  isLike(): boolean {
    return this.like_type === LikeType.LIKE;
  }

  async checkForMutualLike(): Promise<boolean> {
    const mutualLike = await Like.findOne({
      where: {
        from_user_id: this.to_user_id,
        to_user_id: this.from_user_id,
        like_type: LikeType.LIKE
      }
    });
    return !!mutualLike;
  }
}

export default Like;