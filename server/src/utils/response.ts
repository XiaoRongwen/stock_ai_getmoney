import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data?: T;
}

export const success = <T>(data: T, message = 'ok'): ApiResponse<T> => ({
  code: 200,
  message,
  data,
});

export const fail = (message = 'error', code = 400): ApiResponse => ({
  code,
  message,
});

// 便捷方法，直接发送响应
export const sendSuccess = <T>(res: Response, data: T, message = 'ok', status = 200) =>
  res.status(status).json(success(data, message));

export const sendFail = (res: Response, message = 'error', code = 400) =>
  res.status(code).json(fail(message, code));
