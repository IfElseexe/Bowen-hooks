import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  Default,
  AllowNull,
  BeforeCreate,
  BeforeUpdate
} from 'sequelize-typescript';
import User from './User.model';
import Photo from './Photo.model';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non_binary',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say'
}

export enum LookingFor {
  FRIENDSHIP = 'friendship',
  DATING = 'dating',
  RELATIONSHIP = 'relationship',
  NETWORKING = 'networking',
  STUDY_BUDDY = 'study_buddy',
  ANYTHING = 'anything'
}

export enum RelationshipStatus {
  SINGLE = 'single',
  IN_RELATIONSHIP = 'in_relationship',
  COMPLICATED = 'complicated',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say'
}

@Table({
  tableName: 'profiles',
  timestamps: true,
  underscored: true
})
class Profile extends Model {
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
  @Column(DataType.STRING(100))
  first_name!: string;

  @Column(DataType.STRING(100))
  last_name?: string;

  @Column(DataType.STRING(100))
  display_name?: string;

  @Column(DataType.STRING(100))
  code_name?: string; // For anonymous mode

  @Column(DataType.TEXT)
  bio?: string;

  @AllowNull(false)
  @Column(DataType.DATEONLY)
  date_of_birth!: Date;

  @Column({
    type: DataType.ENUM(...Object.values(Gender))
  })
  gender?: Gender;

  @Column({
    type: DataType.ENUM(...Object.values(LookingFor))
  })
  looking_for?: LookingFor;

  @Column(DataType.STRING(100))
  department?: string;

  @Column(DataType.INTEGER)
  year_of_study?: number;

  @Column(DataType.ARRAY(DataType.TEXT))
  interests?: string[];

  @Column(DataType.ARRAY(DataType.TEXT))
  hobbies?: string[];

  @Column(DataType.ARRAY(DataType.TEXT))
  languages?: string[];

  @Column(DataType.INTEGER)
  height?: number; // in cm

  @Column({
    type: DataType.ENUM(...Object.values(RelationshipStatus))
  })
  relationship_status?: RelationshipStatus;

  @Default(true)
  @Column(DataType.BOOLEAN)
  show_age!: boolean;

  @Default(true)
  @Column(DataType.BOOLEAN)
  show_distance!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_anonymous!: boolean;

  @Column(DataType.DATE)
  anonymous_until?: Date;

  @Default(0)
  @Column(DataType.INTEGER)
  profile_completion!: number; // 0-100%

  @Column(DataType.VIRTUAL)
  get age(): number | null {
    if (!this.date_of_birth) return null;
    const today = new Date();
    const birthDate = new Date(this.date_of_birth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  @Column(DataType.VIRTUAL)
  get full_name(): string {
    if (this.first_name && this.last_name) {
      return `${this.first_name} ${this.last_name}`;
    }
    return this.first_name || '';
  }

  // Relationships
  @BelongsTo(() => User)
  user!: User;

  @HasMany(() => Photo)
  photos!: Photo[];

  // Instance methods
  calculateProfileCompletion(): number {
    const fields = [
      this.first_name,
      this.bio,
      this.date_of_birth,
      this.gender,
      this.looking_for,
      this.department,
      this.year_of_study,
      this.interests?.length,
      this.hobbies?.length
    ];

    const filledFields = fields.filter(field => field !== null && field !== undefined && field !== '').length;
    return Math.round((filledFields / fields.length) * 100);
  }

  async updateProfileCompletion(): Promise<void> {
    this.profile_completion = this.calculateProfileCompletion();
    await this.save();
  }

  isAnonymous(): boolean {
    if (!this.is_anonymous) return false;
    if (this.anonymous_until && this.anonymous_until > new Date()) {
      return true;
    }
    return false;
  }

  getDisplayInfo() {
    if (this.isAnonymous()) {
      return {
        display_name: this.code_name || 'Anonymous User',
        bio: 'This user prefers to stay anonymous',
        photos_blurred: true
      };
    }
    
    return {
      display_name: this.display_name || this.first_name,
      first_name: this.first_name,
      last_name: this.show_age ? this.last_name : undefined,
      age: this.show_age ? this.age : undefined,
      bio: this.bio,
      photos_blurred: false
    };
  }

  toJSON() {
    const values = { ...this.get() };
    
    // Add computed fields
    values.age = this.age;
    values.full_name = this.full_name;
    
    // Handle anonymous mode
    if (this.isAnonymous()) {
      const displayInfo = this.getDisplayInfo();
      return {
        ...values,
        ...displayInfo
      };
    }
    
    return values;
  }

  // Hooks
  @BeforeCreate
  @BeforeUpdate
  static async updateCompletion(profile: Profile) {
    profile.profile_completion = profile.calculateProfileCompletion();
  }

  @BeforeCreate
  static generateCodeName(profile: Profile) {
    if (!profile.code_name) {
      const adjectives = ['Mysterious', 'Silent', 'Hidden', 'Secret', 'Shadow', 'Night', 'Wandering'];
      const nouns = ['Scholar', 'Dreamer', 'Explorer', 'Thinker', 'Wanderer', 'Ghost', 'Owl'];
      const locations = ['Library', 'Cafeteria', 'Campus', 'Garden', 'Hall', 'Lab'];
      
      const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];
      const loc = locations[Math.floor(Math.random() * locations.length)];
      
      profile.code_name = `${adj} ${loc} ${noun}`;
    }
  }
}

export default Profile;