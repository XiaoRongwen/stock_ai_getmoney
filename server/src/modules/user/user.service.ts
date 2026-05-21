import bcrypt from 'bcryptjs';
import * as repo from './user.repository';
import { signToken } from '@/utils/jwt';
import { AppError } from '@/middleware/error.middleware';
import type { LoginDto, RegisterDto } from './user.schema';

export const login = async ({ username, password }: LoginDto) => {
  const user = await repo.findByUsername(username);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError('账号或密码错误', 401);
  }

  const token = signToken({ id: user.id, username: user.username, role: user.role });
  return { token };
};

export const register = async ({ username, password, role }: RegisterDto) => {
  const exists = await repo.findByUsername(username);
  if (exists) throw new AppError('用户名已存在', 409);

  const hashed = await bcrypt.hash(password, 10);
  const user = await repo.createUser({ username, password: hashed, role });

  return { id: user.id, username: user.username, role: user.role };
};

export const getProfile = async (id: number) => {
  const user = await repo.findById(id);
  if (!user) throw new AppError('用户不存在', 404);
  const { password: _, ...profile } = user;
  return profile;
};

export const listUsers = () => repo.findAllUsers();
