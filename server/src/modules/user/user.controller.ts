import { Request, Response } from 'express';
import * as service from './user.service';
import { sendSuccess } from '@/utils/response';

export const login = async (req: Request, res: Response) => {
  const result = await service.login(req.body);
  sendSuccess(res, result, '登录成功');
};

export const register = async (req: Request, res: Response) => {
  const result = await service.register(req.body);
  sendSuccess(res, result, '注册成功', 201);
};

export const getProfile = async (req: Request, res: Response) => {
  const result = await service.getProfile(req.user!.id);
  sendSuccess(res, result);
};

export const listUsers = async (req: Request, res: Response) => {
  const result = await service.listUsers();
  sendSuccess(res, result);
};
