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
import EventAttendee from './EventAttendee.model';

export enum EventType {
  QUICK_MEET = 'quick_meet',
  STUDY_SESSION = 'study_session',
  PARTY = 'party',
  SPORTS = 'sports',
  FOOD = 'food',
  OTHER = 'other'
}

export enum EventStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

@Table({
  tableName: 'events',
  timestamps: true,
  underscored: true
})
class Event extends Model {
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    primaryKey: true
  })
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  creator_id!: string;

  @AllowNull(false)
  @Column(DataType.STRING(200))
  title!: string;

  @Column(DataType.TEXT)
  description?: string;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...Object.values(EventType))
  })
  event_type!: EventType;

  @Column(DataType.STRING(200))
  location_name?: string;

  @Column(DataType.DECIMAL(10, 8))
  latitude?: number;

  @Column(DataType.DECIMAL(11, 8))
  longitude?: number;

  @AllowNull(false)
  @Column(DataType.DATE)
  start_time!: Date;

  @Column(DataType.DATE)
  end_time?: Date;

  @Column(DataType.INTEGER)
  max_attendees?: number;

  @Default(true)
  @Column(DataType.BOOLEAN)
  is_public!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_anonymous!: boolean;

  @Column(DataType.DATE)
  rsvp_deadline?: Date;

  @Default(EventStatus.UPCOMING)
  @Column({
    type: DataType.ENUM(...Object.values(EventStatus))
  })
  status!: EventStatus;

  // Relationships
  @BelongsTo(() => User)
  creator!: User;

  @HasMany(() => EventAttendee)
  attendees!: EventAttendee[];

  // Instance methods
  getAttendeeCount(): Promise<number> {
    return EventAttendee.count({
      where: { 
        event_id: this.id,
        status: 'accepted'
      }
    });
  }

  isFull(): Promise<boolean> {
    if (!this.max_attendees) return Promise.resolve(false);
    
    return this.getAttendeeCount().then(count => count >= this.max_attendees!);
  }

  canRSVP(): boolean {
    if (this.rsvp_deadline && new Date() > this.rsvp_deadline) {
      return false;
    }
    return this.status === EventStatus.UPCOMING;
  }

  updateStatus(): void {
    const now = new Date();
    
    if (this.start_time > now) {
      this.status = EventStatus.UPCOMING;
    } else if (this.end_time && this.end_time < now) {
      this.status = EventStatus.COMPLETED;
    } else {
      this.status = EventStatus.ONGOING;
    }
  }

  getTimeUntilStart(): number {
    return Math.max(0, this.start_time.getTime() - new Date().getTime());
  }
}

export default Event;