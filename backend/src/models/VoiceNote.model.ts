import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
  AllowNull
} from 'sequelize-typescript';
import User from './User.model';
import Match from './Match.model';

export enum FilterType {
  NORMAL = 'normal',
  DEEP = 'deep',
  CHIPMUNK = 'chipmunk',
  ROBOT = 'robot',
  ECHO = 'echo',
  REVERB = 'reverb'
}

@Table({
  tableName: 'voice_notes',
  timestamps: true,
  underscored: true
})
class VoiceNote extends Model {
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    primaryKey: true
  })
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  sender_id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  receiver_id!: string;

  @ForeignKey(() => Match)
  @Column(DataType.UUID)
  match_id?: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  audio_url!: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  duration!: number; // in seconds

  @Default(FilterType.NORMAL)
  @Column({
    type: DataType.ENUM(...Object.values(FilterType))
  })
  filter_type!: FilterType;

  @Column(DataType.TEXT)
  transcription?: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_played!: boolean;

  @Column(DataType.DATE)
  played_at?: Date;

  // Relationships
  @BelongsTo(() => User, 'sender_id')
  sender!: User;

  @BelongsTo(() => User, 'receiver_id')
  receiver!: User;

  @BelongsTo(() => Match)
  match!: Match;

  // Instance methods
  async markAsPlayed(): Promise<void> {
    this.is_played = true;
    this.played_at = new Date();
    await this.save();
  }

  getFilteredAudioUrl(): string {
    if (this.filter_type !== FilterType.NORMAL) {
      return `${this.audio_url}?filter=${this.filter_type}`;
    }
    return this.audio_url;
  }
}

export default VoiceNote;