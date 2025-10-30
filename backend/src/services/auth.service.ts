import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import User, { UserRole } from '../models/User.model';
import Profile from '../models/Profile.model';
import { redisHelpers } from '../config/redis.config';
import logger from '../utils/logger';

interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  // Generate JWT access token
  generateAccessToken(user: User): string {
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(
      payload,
      process.env.JWT_SECRET!,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      } as jwt.SignOptions
    );
  }

  // Generate JWT refresh token
  generateRefreshToken(user: User): string {
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET!,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
      } as jwt.SignOptions
    );
  }

  // Generate both tokens
  generateTokens(user: User): AuthTokens {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user)
    };
  }

  // Verify access token
  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Verify refresh token
  verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  // Register new user
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
    dateOfBirth: Date;
    gender?: string;
    department?: string;
    yearOfStudy?: number;
  }): Promise<{ user: User; profile: Profile; tokens: AuthTokens }> {
    try {
      // Validate university email
      const emailDomain = userData.email.split('@')[1];
      const allowedDomains = process.env.UNIVERSITY_EMAIL_DOMAINS?.split(',') || ['bowenuniversity.edu.ng'];
      
      const isValidDomain = allowedDomains.some(domain => 
        emailDomain === domain.replace('@', '')
      );

      if (!isValidDomain && process.env.REQUIRE_EDU_EMAIL === 'true') {
        throw new Error('Please use your university email address');
      }

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email: userData.email } });
      if (existingUser) {
        throw new Error('Email already registered');
      }

      // Calculate age
      const age = this.calculateAge(userData.dateOfBirth);
      if (age < 18) {
        throw new Error('You must be at least 18 years old to register');
      }

      // Create verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Hash password manually to ensure it works with the beforeCreate hook
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(userData.password, saltRounds);

      // Create user with manually hashed password
      const user = await User.create({
        email: userData.email,
        password_hash: password_hash, // Set hashed password directly
        verification_token: verificationToken,
        verification_token_expires: verificationExpires
      });

      // Create profile
      const profile = await Profile.create({
        user_id: user.id,
        first_name: userData.firstName,
        last_name: userData.lastName,
        date_of_birth: userData.dateOfBirth,
        gender: userData.gender as any,
        department: userData.department,
        year_of_study: userData.yearOfStudy
      });

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Store refresh token in Redis
      await redisHelpers.setEx(
        `refresh_token:${user.id}`,
        tokens.refreshToken,
        30 * 24 * 60 * 60 // 30 days
      );

      logger.info(`New user registered: ${user.email}`);

      return { user, profile, tokens };
    } catch (error: any) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  // Login user
  async login(email: string, password: string): Promise<{ user: User; profile: Profile; tokens: AuthTokens }> {
    try {
      // Find user with profile
      const user = await User.findOne({
        where: { email },
        include: [{ model: Profile, as: 'profile' }]
      });

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if account is locked
      const isLocked = await user.isAccountLocked();
      if (isLocked) {
        throw new Error('Account is temporarily locked due to multiple failed login attempts');
      }

      // Verify password using the user model's method
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        await user.incrementFailedLogins();
        throw new Error('Invalid email or password');
      }

      // Reset failed login attempts
      await user.resetFailedLogins();

      // Update last login and login streak
      await this.updateLoginStreak(user);

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Store refresh token in Redis
      await redisHelpers.setEx(
        `refresh_token:${user.id}`,
        tokens.refreshToken,
        30 * 24 * 60 * 60 // 30 days
      );

      // Store user online status in Redis
      await redisHelpers.setEx(
        `user:online:${user.id}`,
        JSON.stringify({ status: 'online', lastSeen: new Date().toISOString() }),
        60 * 60 // 1 hour
      );

      logger.info(`User logged in: ${user.email}`);

      return { user, profile: user.profile!, tokens };
    } catch (error: any) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const payload = this.verifyRefreshToken(refreshToken);

      // Check if refresh token exists in Redis
      const storedToken = await redisHelpers.get(`refresh_token:${payload.id}`);
      if (!storedToken || storedToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      // Find user
      const user = await User.findByPk(payload.id);
      if (!user || !user.is_active) {
        throw new Error('User not found or inactive');
      }

      // Generate new tokens
      const tokens = this.generateTokens(user);

      // Update refresh token in Redis
      await redisHelpers.setEx(
        `refresh_token:${user.id}`,
        tokens.refreshToken,
        30 * 24 * 60 * 60 // 30 days
      );

      return tokens;
    } catch (error: any) {
      logger.error('Refresh token error:', error);
      throw error;
    }
  }

  // Logout user
  async logout(userId: string): Promise<void> {
    try {
      // Remove refresh token from Redis
      await redisHelpers.del(`refresh_token:${userId}`);

      // Update online status
      await redisHelpers.setEx(
        `user:online:${userId}`,
        JSON.stringify({ status: 'offline', lastSeen: new Date().toISOString() }),
        60 * 60 // 1 hour
      );

      logger.info(`User logged out: ${userId}`);
    } catch (error: any) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  // Verify email
  async verifyEmail(token: string): Promise<User> {
    try {
      const user = await User.findOne({
        where: { verification_token: token }
      });

      if (!user) {
        throw new Error('Invalid verification token');
      }

      if (user.verification_token_expires && user.verification_token_expires < new Date()) {
        throw new Error('Verification token has expired');
      }

      user.is_verified = true;
      user.verification_token = undefined;
      user.verification_token_expires = undefined;
      await user.save();

      logger.info(`Email verified: ${user.email}`);

      return user;
    } catch (error: any) {
      logger.error('Email verification error:', error);
      throw error;
    }
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<string> {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        // Don't reveal if user exists
        return 'If an account exists, a password reset link has been sent';
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      user.password_reset_token = resetToken;
      user.password_reset_expires = resetExpires;
      await user.save();

      // TODO: Send email with reset link
      logger.info(`Password reset requested: ${user.email}`);

      return resetToken;
    } catch (error: any) {
      logger.error('Password reset request error:', error);
      throw error;
    }
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const user = await User.findOne({
        where: { password_reset_token: token }
      });

      if (!user) {
        throw new Error('Invalid or expired password reset token');
      }

      if (user.password_reset_expires && user.password_reset_expires < new Date()) {
        throw new Error('Password reset token has expired');
      }

      // Hash the new password manually
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(newPassword, saltRounds);

      user.password_hash = password_hash;
      user.password_reset_token = undefined;
      user.password_reset_expires = undefined;
      user.failed_login_attempts = 0;
      user.account_locked = false;
      user.locked_until = undefined;
      await user.save();

      // Invalidate all refresh tokens
      await redisHelpers.del(`refresh_token:${user.id}`);

      logger.info(`Password reset: ${user.email}`);
    } catch (error: any) {
      logger.error('Password reset error:', error);
      throw error;
    }
  }

  // Helper: Calculate age
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  // Helper: Update login streak
  private async updateLoginStreak(user: User): Promise<void> {
    const lastLogin = user.last_login;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (lastLogin) {
      const lastLoginDate = new Date(lastLogin);
      lastLoginDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        // Consecutive day
        user.login_streak += 1;
      } else if (daysDiff > 1) {
        // Streak broken
        user.login_streak = 1;
      }
      // If daysDiff === 0, same day login, don't change streak
    } else {
      // First login
      user.login_streak = 1;
    }

    user.last_login = new Date();
    await user.save();
  }
}

export default new AuthService();