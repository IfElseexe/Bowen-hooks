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
import Event from './Event.model';

export enum AttendeeStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  ATTENDED = 'attended',
  NO_SHOW = 'no_show'
}

@Table({
  tableName: 'event_attendees',
  timestamps: true,
  underscored: true
})
class EventAttendee extends Model {
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    primaryKey: true
  })
  id!: string;

  @ForeignKey(() => Event)
  @AllowNull(false)
  @Column(DataType.UUID)
  event_id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  user_id!: string;

  @Default(AttendeeStatus.PENDING)
  @Column({
    type: DataType.ENUM(...Object.values(AttendeeStatus))
  })
  status!: AttendeeStatus;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_anonymous!: boolean;

  @Column(DataType.DATE)
  rsvp_at?: Date;

  @Column(DataType.DATE)
  attended_at?: Date;

  // Relationships
  @BelongsTo(() => Event)
  event!: Event;

  @BelongsTo(() => User)
  user!: User;

  // Instance methods
  async acceptRSVP(): Promise<void> {
    this.status = AttendeeStatus.ACCEPTED;
    this.rsvp_at = new Date();
    await this.save();
  }

  async declineRSVP(): Promise<void> {
    this.status = AttendeeStatus.DECLINED;
    this.rsvp_at = new Date();
    await this.save();
  }

  async markAttended(): Promise<void> {
    this.status = AttendeeStatus.ATTENDED;
    this.attended_at = new Date();
    await this.save();
  }

  async markNoShow(): Promise<void> {
    this.status = AttendeeStatus.NO_SHOW;
    await this.save();
  }

  isConfirmed(): boolean {
    return this.status === AttendeeStatus.ACCEPTED || 
           this.status === AttendeeStatus.ATTENDED;
  }
}

export default EventAttendee;