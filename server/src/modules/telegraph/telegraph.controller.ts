import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess } from '@/utils/response';

const prisma = new PrismaClient();

/**
 * GET /api/telegraph
 * 查询电报列表，支持分页和等级筛选
 * query: limit(默认50) cursor(上一页最后一条ctime) level(A/B/C)
 */
export const list = async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;
  const level = req.query.level as string | undefined;

  const items = await prisma.telegraph.findMany({
    where: {
      ...(level && { level }),
      ...(cursor && { ctime: { lt: cursor } }),
    },
    orderBy: { ctime: 'desc' },
    take: limit,
  });

  sendSuccess(res, items);
};

/**
 * GET /api/telegraph/stream
 * SSE 实时推送：每 15s 推一次最新数据给前端
 * 前端用 EventSource 接收，无需轮询
 */
export const stream = async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // 记录上次推送的最新 ctime
  let lastCtime = Math.floor(Date.now() / 1000);

  const push = async () => {
    const items = await prisma.telegraph.findMany({
      where: { ctime: { gt: lastCtime } },
      orderBy: { ctime: 'asc' },
    });

    if (items.length) {
      lastCtime = Math.max(...items.map((i) => i.ctime));
      res.write(`data: ${JSON.stringify(items)}\n\n`);
    }
  };

  const timer = setInterval(push, 15000);

  // 客户端断开时清理
  req.on('close', () => clearInterval(timer));
};

/**
 * GET /api/telegraph/ai-context
 * 给 AI 分析用：返回最近 N 条，拼成结构化文本
 * query: limit(默认30) level(只看重要的，如 A,B)
 */
export const aiContext = async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const levels = req.query.level
    ? (req.query.level as string).split(',')
    : undefined;

  const items = await prisma.telegraph.findMany({
    where: { ...(levels && { level: { in: levels } }) },
    orderBy: { ctime: 'desc' },
    take: limit,
  });

  // 拼成 AI 可直接消费的文本格式
  const context = items
    .reverse()
    .map((item) => {
      const time = new Date(item.ctime * 1000).toLocaleString('zh-CN');
      const text = item.title
        ? `【${item.title}】${item.content}`
        : item.content;
      return `[${time}][${item.level}] ${text}`;
    })
    .join('\n');

  sendSuccess(res, { context, count: items.length });
};
