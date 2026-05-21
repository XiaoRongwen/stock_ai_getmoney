import { PrismaClient } from '@prisma/client';
import { fetchTelegraph, fetchTelegraphUpdate, TelegraphItem } from './telegraph.fetcher';
import { logger } from '@/config/logger';

const prisma = new PrismaClient();

// ── 状态 ─────────────────────────────────────────────────────────────────────
let latestCtime: number | undefined;
let initialized = false;

// ── 写库 ─────────────────────────────────────────────────────────────────────
/**
 * 批量 upsert 到数据库
 * 用 id 做唯一键，重复写入自动忽略
 */
async function saveToDB(items: TelegraphItem[]) {
  if (!items.length) return;

  // Prisma 不支持 bulkUpsert，用 Promise.all 并发写
  await Promise.all(
    items.map((item) =>
      prisma.telegraph.upsert({
        where: { id: item.id },
        update: {},  // 已存在则不更新（保持幂等）
        create: {
          id: item.id,
          ctime: item.ctime,
          level: item.level ?? 'C',
          title: item.title || null,
          content: item.content ?? '',
        },
      })
    )
  );

  logger.info(`[telegraph] 写入 ${items.length} 条`);
}

// ── 核心逻辑 ─────────────────────────────────────────────────────────────────

async function init() {
  const items = await fetchTelegraph(20);
  if (!items.length) return;

  await saveToDB(items);
  latestCtime = Math.max(...items.map((i) => i.ctime));
  initialized = true;
}

async function poll() {
  if (!initialized) return;
  try {
    const items = await fetchTelegraphUpdate(latestCtime);
    if (!items.length) return;

    await saveToDB(items);
    latestCtime = Math.max(...items.map((i) => i.ctime));
  } catch (err) {
    logger.error(`[telegraph] 拉取失败: ${(err as Error).message}`);
  }
}

// ── 启动 ─────────────────────────────────────────────────────────────────────
export function startTelegraphScheduler(intervalSeconds = 15) {
  init()
    .then(() => {
      logger.info(`[telegraph] 定时任务已启动，间隔 ${intervalSeconds}s`);
      setInterval(poll, intervalSeconds * 1000);
    })
    .catch((err) => {
      logger.error(`[telegraph] 初始化失败: ${(err as Error).message}`);
    });
}
