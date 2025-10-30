import { Sequelize } from 'sequelize-typescript';
import User from '../models/User.model';
import Profile from '../models/Profile.model';
import Photo from '../models/Photo.model';
import Match from '../models/Match.model';
import Message from '../models/Message.model';
import BombMessage from '../models/BombMessage.model';
import VoiceNote from '../models/VoiceNote.model';
import Location from '../models/Location.model';
import HotZone from '../models/HotZone.model';
import SpotDrop from '../models/SpotDrop.model';
import VibeStatus from '../models/VibeStatus.model';
import Event from '../models/Event.model';
import EventAttendee from '../models/EventAttendee.model';
import Confession from '../models/Confession.model';
import ConfessionComment from '../models/ConfessionComment.model';
import ConfessionVote from '../models/ConfessionVote.model';
import RizzScore from '../models/RizzScore.model';
import Badge from '../models/Badge.model';
import UserBadge from '../models/UserBadge.model';
import SparkSession from '../models/SparkSession.model';
import PhotoChallenge from '../models/PhotoChallenge.model';
import ChallengeSubmission from '../models/ChallengeSubmission.model';
import ChallengeVote from '../models/ChallengeVote.model';
import TimeCapsule from '../models/TimeCapsule.model';
import Block from '../models/Block.model';
import Report from '../models/Report.model';
import Notification from '../models/Notification.model';
import LoginStreak from '../models/LoginStreak.model';
import Settings from '../models/Settings.model';
import Like from '../models/Like.model';

const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'bowen_hooks_db',
  username: process.env.DB_USER || 'bowen_user',
  password: process.env.DB_PASS || 'bowen123',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  dialect: 'postgres',
  models: [
    User, Profile, Photo, Match, Message, BombMessage, VoiceNote,
    Location, HotZone, SpotDrop, VibeStatus, Event, EventAttendee,
    Confession, ConfessionComment, ConfessionVote, RizzScore, Badge,
    UserBadge, SparkSession, PhotoChallenge, ChallengeSubmission,
    ChallengeVote, TimeCapsule, Block, Report, Notification,
    LoginStreak, Settings, Like
  ],
  logging: console.log,
  pool: {
    max: 20,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

export default sequelize;