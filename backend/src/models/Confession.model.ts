import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  Default,
  AllowNull
} from 'sequelize-typescript';
import User from './User.model';
import ConfessionComment from './ConfessionComment.model';
import ConfessionVote from './ConfessionVote.model';

@Table({
  tableName: 'confessions',
  timestamps: true,
  underscored: true
})
class Confession extends Model {
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
  content!: string;

  @Column(DataType.STRING(100))
  location_tag?: string;

  @Default(0)
  @Column(DataType.INTEGER)
  upvotes!: number;

  @Default(0)
  @Column(DataType.INTEGER)
  downvotes!: number;

  @Default(0)
  @Column(DataType.INTEGER)
  comment_count!: number;

  @Default(0)
  @Column(DataType.INTEGER)
  view_count!: number;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_trending!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_reported!: boolean;

  @Default(true)
  @Column(DataType.BOOLEAN)
  is_approved!: boolean;

  // Relationships
  @BelongsTo(() => User)
  user!: User;

  @HasMany(() => ConfessionComment)
  comments!: ConfessionComment[];

  @HasMany(() => ConfessionVote)
  votes!: ConfessionVote[];

  // Instance methods
  getNetVotes(): number {
    return this.upvotes - this.downvotes;
  }

  async incrementViewCount(): Promise<void> {
    this.view_count += 1;
    
    // Check if should be trending (more than 50 views and positive votes)
    if (this.view_count > 50 && this.getNetVotes() > 10) {
      this.is_trending = true;
    }
    
    await this.save();
  }

  async updateCommentCount(): Promise<void> {
    const count = await ConfessionComment.count({
      where: { confession_id: this.id }
    });
    this.comment_count = count;
    await this.save();
  }

  async updateVoteCounts(): Promise<void> {
    const upvotes = await ConfessionVote.count({
      where: { 
        confession_id: this.id,
        vote_type: 'upvote'
      }
    });
    
    const downvotes = await ConfessionVote.count({
      where: { 
        confession_id: this.id,
        vote_type: 'downvote'
      }
    });
    
    this.upvotes = upvotes;
    this.downvotes = downvotes;
    await this.save();
  }

  getPopularityScore(): number {
    const timeFactor = 1 / (1 + Math.log(1 + (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60)));
    return (this.getNetVotes() * 2 + this.comment_count) * timeFactor;
  }
}

export default Confession;