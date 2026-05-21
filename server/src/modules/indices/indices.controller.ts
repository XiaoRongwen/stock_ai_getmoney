import { Request, Response } from 'express';
import axios from 'axios';

const SYMBOLS = [
  { key: 'sh000001', name: '上证指数', short: '上证' },
  { key: 'sz399001', name: '深证成指', short: '深证' },
  { key: 'sz399006', name: '创业板指', short: '创业' },
  { key: 'sh000300', name: '沪深300',  short: '300'  },
];

export const getIndices = async (_req: Request, res: Response) => {
  const symbolStr = SYMBOLS.map(s => s.key).join(',');

  const { data: raw } = await axios.get<string>(
    `https://hq.sinajs.cn/list=${symbolStr}`,
    {
      headers: {
        Referer: 'https://finance.sina.com.cn',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      responseType: 'text',
      timeout: 8000,
    },
  );

  const lines = raw.trim().split('\n');

  const result = SYMBOLS.map((symbol, i) => {
    const match = (lines[i] ?? '').match(/"([^"]*)"/);
    if (!match) return { ...symbol, value: '--', change: 0, changeAmt: 0 };

    const fields = match[1].split(',');
    const current   = parseFloat(fields[3]) || 0;
    const prevClose = parseFloat(fields[2]) || 0;
    const change    = prevClose > 0
      ? parseFloat(((current - prevClose) / prevClose * 100).toFixed(2))
      : 0;

    return {
      key: symbol.key,
      name: symbol.name,
      short: symbol.short,
      value: current.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      change,
      changeAmt: parseFloat((current - prevClose).toFixed(2)),
    };
  });

  res.json(result);
};
