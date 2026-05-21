import './config/env'; // 最先加载，确保环境变量就绪
import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { startTelegraphScheduler } from './modules/telegraph/telegraph.scheduler';

const server = app.listen(env.PORT, () => {
  logger.info(`Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  // 启动财联社电报定时任务（15s 一次，兼顾实时性和安全性）
  startTelegraphScheduler(15);
});

// 优雅退出
const shutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down...`);
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// 未捕获异常兜底
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
});
