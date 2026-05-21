import jwt from 'jsonwebtoken';
import { env } from '@/config/env';

export interface JwtPayload {
  id: number;
  username: string;
  role: string;
}

export const signToken = (payload: JwtPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: '2h' });

export const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, env.JWT_SECRET) as JwtPayload;
