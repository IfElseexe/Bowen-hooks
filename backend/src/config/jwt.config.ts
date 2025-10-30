import jwt, { Secret, SignOptions } from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

const JWT_SECRET = process.env.JWT_SECRET as Secret;

export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
  expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
};

  return jwt.sign(payload, JWT_SECRET, options);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = { expiresIn: '30d' };
  return jwt.sign(payload, (JWT_SECRET + 'refresh') as Secret, options);
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, (JWT_SECRET + 'refresh') as Secret) as TokenPayload;
};
