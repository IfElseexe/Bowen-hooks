import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User, { UserRole } from '../models/User.model';
import logger from '../utils/logger';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
}

class AuthMiddleware {
  // Protect routes - verify JWT token
  protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Also check in cookies as fallback
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401);
      throw new Error('Not authorized, no token provided');
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

      // Check if user still exists and is active
      const user = await User.findByPk(decoded.id, {
        attributes: ['id', 'email', 'role', 'is_active', 'is_verified']
      });

      if (!user) {
        res.status(401);
        throw new Error('User no longer exists');
      }

      if (!user.is_active) {
        res.status(401);
        throw new Error('Account has been deactivated');
      }

      // Attach user info to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role
      };

      next();
    } catch (error: any) {
      logger.error('Auth middleware error:', error);
      res.status(401);
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired, please login again');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw new Error('Not authorized');
    }
  });

  // Restrict to specific roles
  restrictTo = (...roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized');
      }

      if (!roles.includes(req.user.role)) {
        res.status(403);
        throw new Error('You do not have permission to perform this action');
      }

      next();
    };
  };

  // Check if user is verified
  requireVerified = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized');
    }

    const user = await User.findByPk(req.user.id, {
      attributes: ['is_verified']
    });

    if (!user || !user.is_verified) {
      res.status(403);
      throw new Error('Please verify your email to access this feature');
    }

    next();
  });

  // Check if user is premium
  requirePremium = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized');
    }

    const user = await User.findByPk(req.user.id, {
      attributes: ['is_premium', 'premium_expires_at']
    });

    if (!user) {
      res.status(401);
      throw new Error('User not found');
    }

    // Check if premium
    if (!user.is_premium) {
      res.status(403);
      throw new Error('This feature requires premium membership');
    }

    // Check if premium expired
    if (user.premium_expires_at && user.premium_expires_at < new Date()) {
      user.is_premium = false;
      await user.save();
      
      res.status(403);
      throw new Error('Your premium membership has expired');
    }

    next();
  });

  // Optional auth - doesn't fail if no token
  optionalAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Also check in cookies as fallback
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

        // Check if user still exists and is active
        const user = await User.findByPk(decoded.id, {
          attributes: ['id', 'email', 'role', 'is_active']
        });

        if (user && user.is_active) {
          // Attach user info to request
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role
          };
        }
      } catch (error) {
        // Just continue without user
        logger.debug('Optional auth - invalid token, continuing without auth');
      }
    }

    next();
  });
}

export default new AuthMiddleware();