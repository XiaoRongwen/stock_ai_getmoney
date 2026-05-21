import { Request, Response, NextFunction, RequestHandler } from 'express';

// 包装 async controller，统一捕获异常传给 errorHandler
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) =>
    fn(req, res, next).catch(next);
