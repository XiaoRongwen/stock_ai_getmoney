import { Request, Response } from 'express';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { env } from '@/config/env';
import { sendSuccess, sendFail } from '@/utils/response';

const prisma = new PrismaClient();
const ARK_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

function todayStr() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
}

/**
 * GET /api/news
 * 获取新闻联播列表（按日期倒序）
 * query: limit(默认30) page(默认1)
 */
export const list = async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const page  = Math.max(Number(req.query.page) || 1, 1);
  const skip  = (page - 1) * limit;

  const [total, items] = await Promise.all([
    prisma.newsReport.count(),
    prisma.newsReport.findMany({
      orderBy: { date: 'desc' },
      take: limit,
      skip,
    }),
  ]);

  sendSuccess(res, { total, page, limit, items });
};

/**
 * GET /api/news/:date
 * 获取指定日期的新闻联播（date 格式 YYYY-MM-DD 或 "today"）
 */
export const getByDate = async (req: Request, res: Response) => {
  const date = req.params.date === 'today' ? todayStr() : req.params.date;
  const item = await prisma.newsReport.findUnique({ where: { date } });
  sendSuccess(res, item);
};

/**
 * POST /api/news
 * 新增或更新新闻联播文本（幂等，同一天可覆盖）
 * body: { date?: string, content: string }
 */
export const upsert = async (req: Request, res: Response) => {
  const { content, date: dateInput } = req.body as { content?: string; date?: string };

  if (!content || !content.trim()) {
    sendFail(res, '缺少 content 参数', 400);
    return;
  }

  const date = dateInput?.trim() || todayStr();

  const item = await prisma.newsReport.upsert({
    where:  { date },
    create: { date, content: content.trim(), analysis: '' },
    update: { content: content.trim(), analysis: '' }, // 更新内容时清空旧分析
  });

  sendSuccess(res, item, '保存成功');
};

/**
 * DELETE /api/news/:id
 * 删除指定记录
 */
export const remove = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) { sendFail(res, '参数错误', 400); return; }

  await prisma.newsReport.delete({ where: { id } });
  sendSuccess(res, null, '删除成功');
};

/**
 * POST /api/news/:id/analyze
 * SSE 流式：AI 基于新闻联播文本生成热点追踪（与 daily-report 格式完全一致）
 * body: { markets?: string[], horizons?: string[], strengths?: string[] }
 * data 格式：{ type: 'progress'|'chunk'|'done'|'error', ...payload }
 */
export const analyze = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ code: 400, message: '参数错误' }); return; }

  const item = await prisma.newsReport.findUnique({ where: { id } });
  if (!item) { res.status(404).json({ code: 404, message: '记录不存在' }); return; }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const markets:   string[] = Array.isArray(body.markets)   ? body.markets   : [];
  const horizons:  string[] = Array.isArray(body.horizons)  ? body.horizons  : [];
  const strengths: string[] = Array.isArray(body.strengths) ? body.strengths : [];

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  function send(type: string, payload: object) {
    res.write('data: ' + JSON.stringify({ type, ...payload }) + '\n\n');
    if (typeof (res as any).flush === 'function') (res as any).flush();
  }

  send('progress', { message: '正在解析新闻联播内容，AI 分析中...' });

  const constraints: string[] = [];
  if (markets.length)   constraints.push('只选以下市场的股票：' + markets.join('、'));
  if (horizons.length)  constraints.push('只选 ' + horizons.join(' 或 ') + ' 机会');
  if (strengths.length) constraints.push('只选确定性为 ' + strengths.join(' 或 ') + ' 的标的');
  const constraintText = constraints.length
    ? '\n用户筛选偏好（必须严格遵守）：\n' + constraints.map(c => '- ' + c).join('\n') + '\n'
    : '';

  const prompt = [
    '【角色】你是拥有20年实战经验的A股顶级操盘手，曾管理百亿私募，擅长从官方媒体信息中精准捕捉主力资金动向、政策套利机会和板块轮动节奏。新闻联播是中国最权威的政策风向标，每一条内容都可能预示资金流向。你的选股逻辑：政策催化 + 资金承接 + 技术位配合，三者缺一不可。',
    '',
    '【新闻联播原文 · ' + item.date + '】',
    item.content,
    constraintText,
    '【任务】基于以上新闻联播内容，从主力资金视角精选今明两日最具爆发力的A股标的。',
    '严格按以下JSON格式输出，不输出任何其他内容：',
    '',
    '{',
    '  "summary": "今日核心主线一句话（板块+驱动逻辑，25字内）",',
    '  "market_mood": "偏多或震荡或偏空",',
    '  "stocks": [',
    '    {',
    '      "name": "公司A股全称",',
    '      "code": "6位股票代码",',
    '      "market": "主板或创业板或科创板或北交所",',
    '      "sector": "细分概念，如：华为产业链、低空经济、固态电池等",',
    '      "gain_range": "预计涨幅区间，如：+5%~+12%",',
    '      "logic": "选股核心逻辑：新闻联播催化+资金面+操作建议，50字内",',
    '      "risk": "主要风险点，20字内",',
    '      "horizon": "短线或中线",',
    '      "strength": "强或中或弱",',
    '      "strength_reason": "强度判断依据：政策直接受益/业绩超预期/资金异动/题材炒作，选一个最符合的"',
    '    }',
    '  ]',
    '}',
    '',
    '【选股铁律】',
    '1. 精选 8~10 只，宁缺毋滥，按爆发确定性从高到低排序',
    '2. code 必须是正确6位数字，market 根据代码前缀严格判断：',
    '   60xxxx/000xxx/001xxx/002xxx/003xxx → 主板',
    '   300xxx/301xxx → 创业板',
    '   688xxx/689xxx → 科创板',
    '   8xxxxx/43xxxx → 北交所',
    '3. gain_range 基于催化强度和同类历史事件涨幅给出，不可为空，不可写"不确定"',
    '4. strength 判断标准：',
    '   强 = 政策直接点名/领导人重点强调/重大工程部署，确定性高',
    '   中 = 间接受益/预期改善/板块联动，需要配合市场情绪',
    '   弱 = 题材炒作/消息面刺激/跟风机会，风险较高',
    '5. logic 必须包含：①新闻联播中的直接依据 ②为什么这只股票受益 ③建议操作方向',
    '6. 只输出纯JSON，不要markdown代码块，不要任何解释',
  ].join('\n');

  try {
    const resp = await axios.post(
      ARK_URL,
      {
        model: env.ARK_MODEL,
        stream: true,
        messages: [
          { role: 'system', content: '你是专业的A股分析师，只输出纯JSON，不输出任何其他内容。' },
          { role: 'user', content: prompt },
        ],
      },
      {
        headers: { Authorization: 'Bearer ' + env.ARK_API_KEY, 'Content-Type': 'application/json' },
        responseType: 'stream',
        timeout: 120000,
      },
    );

    let raw = '';

    await new Promise<void>((resolve, reject) => {
      resp.data.on('data', (chunk: Buffer) => {
        for (const line of chunk.toString().split('\n')) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              raw += delta;
              send('chunk', { delta });
            }
          } catch { /* 忽略不完整 JSON */ }
        }
      });
      resp.data.on('end', resolve);
      resp.data.on('error', reject);
    });

    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    const parsed = JSON.parse(cleaned);

    // 存库：analysis 字段存 JSON 字符串
    const updated = await prisma.newsReport.update({
      where: { id },
      data:  { analysis: JSON.stringify({ stocks: parsed.stocks ?? [], summary: parsed.summary ?? '', market_mood: parsed.market_mood ?? '' }) },
    });

    send('done', {
      id:          updated.id,
      date:        updated.date,
      stocks:      parsed.stocks ?? [],
      summary:     parsed.summary ?? '',
      market_mood: parsed.market_mood ?? '',
      updatedAt:   updated.updatedAt.toISOString(),
    });
    res.end();
  } catch (err: any) {
    const msg = err?.response?.data?.error?.message ?? err.message ?? '分析失败';
    send('error', { message: msg });
    res.end();
  }

  req.on('close', () => res.end());
};
