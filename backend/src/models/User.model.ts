import {
  Table,
  Column,
  Model,
  DataType,
  BeforeCreate,
  BeforeUpdate,
  HasOne,
  Default,
  Unique,
  AllowNull,
  Index
} from 'sequelize-typescript';
import * as bcrypt from 'bcryptjs';
import Profile from './Profile.model';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator'
}

@Table({
  tableName: 'users',
  timestamps: true,
  paranoid: true,
  underscored: true
})
class User extends Model {
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    primaryKey: true
  })
  id!: string;

  @Unique
  @AllowNull(false)
  @Index
  @Column({
    type: DataType.STRING(255),
    validate: {
      isEmail: true
    }
  })
  email!: string;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  password_hash!: string;

  @Column(DataType.STRING(20))
  phone?: string;

  @Default(UserRole.USER)
  @Column({
    type: DataType.ENUM(...Object.values(UserRole))
  })
  role!: UserRole;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_verified!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_photo_verified!: boolean;

  @Default(true)
  @Column(DataType.BOOLEAN)
  is_active!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_premium!: boolean;

  @Column(DataType.DATE)
  premium_expires_at?: Date;

  @Column(DataType.DATE)
  last_login?: Date;

  @Default(0)
  @Column(DataType.INTEGER)
  login_streak!: number;

  @Default(false)
  @Column(DataType.BOOLEAN)
  account_locked!: boolean;

  @Column(DataType.DATE)
  locked_until?: Date;

  @Default(0)
  @Column(DataType.INTEGER)
  failed_login_attempts!: number;

  @Column(DataType.INTEGER)
  graduation_year?: number;

  @Column(DataType.STRING(255))
  verification_token?: string;

  @Column(DataType.DATE)
  verification_token_expires?: Date;

  @Column(DataType.STRING(255))
  password_reset_token?: string;

  @Column(DataType.DATE)
  password_reset_expires?: Date;

  // Virtual field for plain password (not stored in DB)
  password?: string;

  // Relationships
  @HasOne(() => Profile)
  profile!: Profile;

  // Instance methods
  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password_hash);
  }

  async isAccountLocked(): Promise<boolean> {
    if (!this.account_locked) return false;
    
    if (this.locked_until && this.locked_until > new Date()) {
      return true;
    }
    
    if (this.locked_until && this.locked_until <= new Date()) {
      this.account_locked = false;
      this.locked_until = undefined;
      this.failed_login_attempts = 0;
      await this.save();
      return false;
    }
    
    return false;
  }

  async incrementFailedLogins(): Promise<void> {
    this.failed_login_attempts += 1;
    
    const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
    const lockDuration = parseInt(process.env.ACCOUNT_LOCKOUT_DURATION || '1800000');
    
    if (this.failed_login_attempts >= maxAttempts) {
      this.account_locked = true;
      this.locked_until = new Date(Date.now() + lockDuration);
    }
    
    await this.save();
  }

  async resetFailedLogins(): Promise<void> {
    this.failed_login_attempts = 0;
    this.account_locked = false;
    this.locked_until = undefined;
    await this.save();
  }

  toJSON() {
    const values = { ...this.get() };
    delete values.password_hash;
    delete values.password;
    delete values.verification_token;
    delete values.password_reset_token;
    return values;
  }

  // FIXED: Hooks must be static methods
  @BeforeCreate
  static async hashPassword(instance: User) {
    if ((instance as any).password) {
      const salt = await bcrypt.genSalt(10);
      instance.password_hash = await bcrypt.hash((instance as any).password, salt);
      // Clear the plain password
      (instance as any).password = undefined;
    }
  }

  @BeforeUpdate
  static async hashPasswordOnUpdate(instance: User) {
    if (instance.changed('password') && (instance as any).password) {
      const salt = await bcrypt.genSalt(10);
      instance.password_hash = await bcrypt.hash((instance as any).password, salt);
      // Clear the plain password
      (instance as any).password = undefined;
    }
  }
}

export default User;