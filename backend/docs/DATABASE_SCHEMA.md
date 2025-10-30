CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('user', 'admin', 'moderator') DEFAULT 'user',
  is_verified BOOLEAN DEFAULT FALSE,
  is_photo_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_premium BOOLEAN DEFAULT FALSE,
  premium_expires_at TIMESTAMP,
  last_login TIMESTAMP,
  login_streak INTEGER DEFAULT 0,
  account_locked BOOLEAN DEFAULT FALSE,
  locked_until TIMESTAMP,
  failed_login_attempts INTEGER DEFAULT 0,
  graduation_year INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  display_name VARCHAR(100),
  code_name VARCHAR(100),
  bio TEXT,
  date_of_birth DATE NOT NULL,
  gender ENUM('male', 'female', 'non_binary', 'other', 'prefer_not_to_say'),
  looking_for ENUM('friendship', 'dating', 'relationship', 'networking', 'study_buddy', 'anything'),
  department VARCHAR(100),
  year_of_study INTEGER,
  interests TEXT[],
  hobbies TEXT[],
  languages TEXT[],
  height INTEGER,
  relationship_status ENUM('single', 'in_relationship', 'complicated', 'prefer_not_to_say'),
  show_age BOOLEAN DEFAULT TRUE,
  show_distance BOOLEAN DEFAULT TRUE,
  is_anonymous BOOLEAN DEFAULT FALSE,
  anonymous_until TIMESTAMP,
  profile_completion INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  blur_level INTEGER DEFAULT 0,
  caption VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  match_type ENUM('mutual_like', 'super_like', 'spark_match', 'mystery_match', 'vibe_match') DEFAULT 'mutual_like',
  status ENUM('pending', 'matched', 'unmatched', 'expired') DEFAULT 'pending',
  is_mystery BOOLEAN DEFAULT FALSE,
  reveal_at TIMESTAMP,
  matched_at TIMESTAMP,
  conversation_started BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  like_type ENUM('like', 'super_like', 'pass') DEFAULT 'like',
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  message_type ENUM('text', 'image', 'voice', 'question_game', 'time_capsule') DEFAULT 'text',
  media_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bomb_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  bomb_type ENUM('quick_fuse', 'time_bomb', 'slow_burn') DEFAULT 'time_bomb',
  duration INTEGER NOT NULL,
  explodes_at TIMESTAMP NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_exploded BOOLEAN DEFAULT FALSE,
  screenshot_taken BOOLEAN DEFAULT FALSE,
  screenshot_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE voice_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  duration INTEGER NOT NULL,
  filter_type ENUM('normal', 'deep', 'chipmunk', 'robot', 'echo', 'reverb') DEFAULT 'normal',
  transcription TEXT,
  is_played BOOLEAN DEFAULT FALSE,
  played_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  is_ghost_mode BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE hot_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  location_type ENUM('library', 'cafeteria', 'hostel', 'sports', 'academic', 'other') NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius INTEGER DEFAULT 50,
  current_user_count INTEGER DEFAULT 0,
  peak_time_start TIME,
  peak_time_end TIME,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE spot_drops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius INTEGER DEFAULT 10,
  message TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP NOT NULL,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vibe_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vibe_type VARCHAR(50) NOT NULL,
  custom_message VARCHAR(200),
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_type ENUM('quick_meet', 'study_session', 'party', 'sports', 'food', 'other') NOT NULL,
  location_name VARCHAR(200),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  max_attendees INTEGER,
  is_public BOOLEAN DEFAULT TRUE,
  is_anonymous BOOLEAN DEFAULT FALSE,
  rsvp_deadline TIMESTAMP,
  status ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'upcoming',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status ENUM('pending', 'accepted', 'declined', 'attended', 'no_show') DEFAULT 'pending',
  is_anonymous BOOLEAN DEFAULT FALSE,
  rsvp_at TIMESTAMP DEFAULT NOW(),
  attended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE TABLE confessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  location_tag VARCHAR(100),
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_trending BOOLEAN DEFAULT FALSE,
  is_reported BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE confession_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  confession_id UUID REFERENCES confessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  is_reported BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE confession_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  confession_id UUID REFERENCES confessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vote_type ENUM('upvote', 'downvote') NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(confession_id, user_id)
);

CREATE TABLE rizz_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  total_score INTEGER DEFAULT 0,
  response_rate DECIMAL(5, 2) DEFAULT 0,
  average_conversation_length INTEGER DEFAULT 0,
  match_rate DECIMAL(5, 2) DEFAULT 0,
  event_attendance INTEGER DEFAULT 0,
  login_streak_bonus INTEGER DEFAULT 0,
  weekly_rank INTEGER,
  all_time_rank INTEGER,
  last_calculated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  badge_type ENUM('bronze', 'silver', 'gold', 'platinum', 'special') DEFAULT 'bronze',
  requirement_type VARCHAR(50),
  requirement_value INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE TABLE spark_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  room_id VARCHAR(100) UNIQUE NOT NULL,
  status ENUM('waiting', 'active', 'completed', 'skipped', 'matched') DEFAULT 'waiting',
  both_sparked BOOLEAN DEFAULT FALSE,
  user1_sparked BOOLEAN DEFAULT FALSE,
  user2_sparked BOOLEAN DEFAULT FALSE,
  duration INTEGER,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE photo_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  challenge_date DATE NOT NULL UNIQUE,
  submission_deadline TIMESTAMP NOT NULL,
  voting_deadline TIMESTAMP NOT NULL,
  status ENUM('upcoming', 'active', 'voting', 'completed') DEFAULT 'upcoming',
  total_submissions INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE challenge_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES photo_challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption VARCHAR(255),
  vote_count INTEGER DEFAULT 0,
  is_winner BOOLEAN DEFAULT FALSE,
  winner_rank INTEGER,
  submitted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

CREATE TABLE challenge_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES challenge_submissions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  voted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(submission_id, user_id)
);

CREATE TABLE time_capsules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  send_at TIMESTAMP NOT NULL,
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES users(id),
  reported_content_type ENUM('user', 'message', 'confession', 'event', 'photo') NOT NULL,
  reported_content_id UUID,
  reason ENUM('harassment', 'inappropriate_content', 'spam', 'fake_profile', 'underage', 'other') NOT NULL,
  description TEXT,
  status ENUM('pending', 'reviewing', 'resolved', 'dismissed') DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  action_taken VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE login_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_login_date DATE,
  total_logins INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Privacy Settings
  show_online_status BOOLEAN DEFAULT TRUE,
  show_location BOOLEAN DEFAULT TRUE,
  allow_anonymous_messages BOOLEAN DEFAULT TRUE,
  visible_to ENUM('everyone', 'matches_only', 'none') DEFAULT 'everyone',
  
  -- Notification Settings
  push_notifications BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  match_notifications BOOLEAN DEFAULT TRUE,
  message_notifications BOOLEAN DEFAULT TRUE,
  event_notifications BOOLEAN DEFAULT TRUE,
  
  -- Discovery Settings
  age_min INTEGER DEFAULT 18,
  age_max INTEGER DEFAULT 30,
  max_distance INTEGER DEFAULT 1000,
  show_me ENUM('everyone', 'men', 'women', 'non_binary') DEFAULT 'everyone',
  
  -- Safety Settings
  buddy_system_enabled BOOLEAN DEFAULT FALSE,
  emergency_contact_1 VARCHAR(20),
  emergency_contact_2 VARCHAR(20),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_matches_users ON matches(user1_id, user2_id);
CREATE INDEX idx_messages_match ON messages(match_id);
CREATE INDEX idx_locations_user ON locations(user_id);
CREATE INDEX idx_locations_coords ON locations(latitude, longitude);
CREATE INDEX idx_events_date ON events(start_time);
CREATE INDEX idx_confessions_created ON confessions(created_at DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_bomb_messages_expiry ON bomb_messages(explodes_at);