import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  AllowNull,
  Unique
} from 'sequelize-typescript';
import User from './User.model';

@Table({
  tableName: 'blocks',
  timestamps: true,
  underscored: true
})
class Block extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4
  })
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  blocker_id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  blocked_id!: string;

  @Column(DataType.STRING(255))
  reason?: string;

  // Relationships
  @BelongsTo(() => User, 'blocker_id')
  blocker!: User;

  @BelongsTo(() => User, 'blocked_id')
  blocked!: User;

  // Instance methods
  isMutualBlock(): Promise<boolean> {
    return Block.findOne({
      where: {
        blocker_id: this.blocked_id,
        blocked_id: this.blocker_id
      }
    }).then(block => !!block);
  }
}

export default Block;