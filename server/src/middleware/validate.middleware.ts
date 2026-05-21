import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = (result.error as ZodError).errors[0]?.message || '参数错误';
      res.status(400).json({ code: 400, message });
      return;
    }
    req.body = result.data; // 使用 zod 解析后的干净数据
    next();
  };
