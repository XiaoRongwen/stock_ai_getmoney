import express from 'express';
import cors from 'cors';
import userRouter from '@/modules/user/user.route';
import telegraphRouter from '@/modules/telegraph/telegraph.route';
import aiRouter from '@/modules/ai/ai.route';
import indicesRouter from '@/modules/indices/indices.route';
import newsRouter from '@/modules/news/news.route';
import { errorHandler } from '@/middleware/error.middleware';
import { logger } from '@/config/logger';

const app = express();

// 基础中间件
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, _res, next) => {
  logger.debug(`→ ${req.method} ${req.path}`);
  next();
});

// 路由
app.use('/api/users', userRouter);
app.use('/api/telegraph', telegraphRouter);
app.use('/api/ai', aiRouter);
app.use('/api/indices', indicesRouter);
app.use('/api/news', newsRouter);

// 健康检查
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// 404
app.use((_req, res) => res.status(404).json({ code: 404, message: '接口不存在' }));

// 全局错误处理（必须放最后）
app.use(errorHandler);

export default app;
