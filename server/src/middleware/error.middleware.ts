import { Request, Response, NextFunction } from 'express';
import { logger } from '@/config/logger';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ code: err.statusCode, message: err.message });
    return;
  }

  logger.error(`[${req.method}] ${req.path} - ${err.message}`);
  res.status(500).json({ code: 500, message: '服务器内部错误' });
};
