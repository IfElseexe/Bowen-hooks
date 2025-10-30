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

export enum Visibility {
  EVERYONE = 'everyone',
  MATCHES_ONLY = 'matches_only',
  NONE = 'none'
}

export enum ShowMe {
  EVERYONE = 'everyone',
  MEN = 'men',
  WOMEN = 'women',
  NON_BINARY = 'non_binary'
}

@Table({
  tableName: 'settings',
  timestamps: true,
  underscored: true
})
class Settings extends Model {
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    primaryKey: true
  })
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Unique
  @Column(DataType.UUID)
  user_id!: string;

  // Privacy Settings
  @Default(true)
  @Column(DataType.BOOLEAN)
  show_online_status!: boolean;

  @Default(true)
  @Column(DataType.BOOLEAN)
  show_location!: boolean;

  @Default(true)
  @Column(DataType.BOOLEAN)
  allow_anonymous_messages!: boolean;

  @Default(Visibility.EVERYONE)
  @Column({
    type: DataType.ENUM(...Object.values(Visibility))
  })
  visible_to!: Visibility;

  // Notification Settings
  @Default(true)
  @Column(DataType.BOOLEAN)
  push_notifications!: boolean;

  @Default(true)
  @Column(DataType.BOOLEAN)
  email_notifications!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  sms_notifications!: boolean;

  @Default(true)
  @Column(DataType.BOOLEAN)
  match_notifications!: boolean;

  @Default(true)
  @Column(DataType.BOOLEAN)
  message_notifications!: boolean;

  @Default(true)
  @Column(DataType.BOOLEAN)
  event_notifications!: boolean;

  // Discovery Settings
  @Default(18)
  @Column(DataType.INTEGER)
  age_min!: number;

  @Default(30)
  @Column(DataType.INTEGER)
  age_max!: number;

  @Default(1000)
  @Column(DataType.INTEGER)
  max_distance!: number; // in meters

  @Default(ShowMe.EVERYONE)
  @Column({
    type: DataType.ENUM(...Object.values(ShowMe))
  })
  show_me!: ShowMe;

  // Safety Settings
  @Default(false)
  @Column(DataType.BOOLEAN)
  buddy_system_enabled!: boolean;

  @Column(DataType.STRING(20))
  emergency_contact_1?: string;

  @Column(DataType.STRING(20))
  emergency_contact_2?: string;

  // Relationships
  @BelongsTo(() => User)
  user!: User;

  // Instance methods
  validateAgeRange(): boolean {
    return this.age_min >= 18 && this.age_max <= 100 && this.age_min <= this.age_max;
  }

  validateDistance(): boolean {
    return this.max_distance >= 100 && this.max_distance <= 50000; // 100m to 50km
  }

  getDiscoverySettings() {
    return {
      age_min: this.age_min,
      age_max: this.age_max,
      max_distance: this.max_distance,
      show_me: this.show_me
    };
  }

  getPrivacySettings() {
    return {
      show_online_status: this.show_online_status,
      show_location: this.show_location,
      allow_anonymous_messages: this.allow_anonymous_messages,
      visible_to: this.visible_to
    };
  }

  getNotificationSettings() {
    return {
      push_notifications: this.push_notifications,
      email_notifications: this.email_notifications,
      sms_notifications: this.sms_notifications,
      match_notifications: this.match_notifications,
      message_notifications: this.message_notifications,
      event_notifications: this.event_notifications
    };
  }

  getSafetySettings() {
    return {
      buddy_system_enabled: this.buddy_system_enabled,
      emergency_contact_1: this.emergency_contact_1,
      emergency_contact_2: this.emergency_contact_2
    };
  }
}

export default Settings;