import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import authService from '../services/auth.service';
import logger from '../utils/logger';

class AuthController {
  // @desc    Register new user
  // @route   POST /api/v1/auth/register
  // @access  Public
  register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const {
      email,
      password,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      department,
      yearOfStudy
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !dateOfBirth) {
      res.status(400);
      throw new Error('Please provide all required fields');
    }

    // Validate password strength
    if (password.length < 8) {
      res.status(400);
      throw new Error('Password must be at least 8 characters long');
    }

    const { user, profile, tokens } = await authService.register({
      email,
      password,
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      department,
      yearOfStudy
    });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(201).json({
      status: 'success',
      message: 'Registration successful! Please verify your email.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isVerified: user.is_verified
        },
        profile: {
          id: profile.id,
          firstName: profile.first_name,
          lastName: profile.last_name,
          displayName: profile.display_name,
          age: profile.age,
          profileCompletion: profile.profile_completion
        },
        accessToken: tokens.accessToken
      }
    });
  });

  // @desc    Login user
  // @route   POST /api/v1/auth/login
  // @access  Public
  login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    const { user, profile, tokens } = await authService.login(email, password);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isVerified: user.is_verified,
          isPremium: user.is_premium,
          loginStreak: user.login_streak
        },
        profile: {
          id: profile.id,
          firstName: profile.first_name,
          lastName: profile.last_name,
          displayName: profile.display_name || profile.first_name,
          codeName: profile.code_name,
          age: profile.age,
          bio: profile.bio,
          department: profile.department,
          yearOfStudy: profile.year_of_study,
          profileCompletion: profile.profile_completion,
          isAnonymous: profile.is_anonymous
        },
        accessToken: tokens.accessToken
      }
    });
  });

  // @desc    Logout user
  // @route   POST /api/v1/auth/logout
  // @access  Private
  logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401);
      throw new Error('Not authorized');
    }

    await authService.logout(userId);

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  });

  // @desc    Refresh access token
  // @route   POST /api/v1/auth/refresh
  // @access  Public
  refreshToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      res.status(401);
      throw new Error('No refresh token provided');
    }

    const tokens = await authService.refreshAccessToken(refreshToken);

    // Update refresh token cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: {
        accessToken: tokens.accessToken
      }
    });
  });

  // @desc    Verify email
  // @route   GET /api/v1/auth/verify/:token
  // @access  Public
  verifyEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.params;

    if (!token) {
      res.status(400);
      throw new Error('Verification token is required');
    }

    const user = await authService.verifyEmail(token);

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully! You can now access all features.',
      data: {
        userId: user.id,
        email: user.email,
        isVerified: user.is_verified
      }
    });
  });

  // @desc    Request password reset
  // @route   POST /api/v1/auth/forgot-password
  // @access  Public
  forgotPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    if (!email) {
      res.status(400);
      throw new Error('Email is required');
    }

    await authService.requestPasswordReset(email);

    res.status(200).json({
      status: 'success',
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  });

  // @desc    Reset password
  // @route   POST /api/v1/auth/reset-password/:token
  // @access  Public
  resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!token) {
      res.status(400);
      throw new Error('Reset token is required');
    }

    if (!password || !confirmPassword) {
      res.status(400);
      throw new Error('Please provide password and confirm password');
    }

    if (password !== confirmPassword) {
      res.status(400);
      throw new Error('Passwords do not match');
    }

    if (password.length < 8) {
      res.status(400);
      throw new Error('Password must be at least 8 characters long');
    }

    await authService.resetPassword(token, password);

    res.status(200).json({
      status: 'success',
      message: 'Password reset successful! Please login with your new password.'
    });
  });

  // @desc    Get current user
  // @route   GET /api/v1/auth/me
  // @access  Private
  getMe = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401);
      throw new Error('Not authorized');
    }

    const user = await User.findByPk(userId, {
      include: [
        {
          model: Profile,
          as: 'profile',
          include: [{ model: Photo, as: 'photos' }]
        }
      ]
    });

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isVerified: user.is_verified,
          isPremium: user.is_premium,
          premiumExpiresAt: user.premium_expires_at,
          loginStreak: user.login_streak,
          lastLogin: user.last_login
        },
        profile: user.profile
      }
    });
  });
}

// Import models (add at top of file later)
import User from '../models/User.model';
import Profile from '../models/Profile.model';
import Photo from '../models/Photo.model';

export default new AuthController();