import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/utils/jwt';

export const auth =
  (roles: string[] = []) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ code: 401, message: '未登录' });
      return;
    }

    try {
      const user = verifyToken(token);
      req.user = user;

      if (roles.length && !roles.includes(user.role)) {
        res.status(403).json({ code: 403, message: '无权限' });
        return;
      }

      next();
    } catch {
      res.status(401).json({ code: 401, message: 'token 无效或已过期' });
    }
  };
