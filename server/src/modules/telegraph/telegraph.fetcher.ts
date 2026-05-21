import axios from 'axios';
import { makeSign } from '@/utils/sign';

// ── 接口地址 ────────────────────────────────────────────────────────────────
/** 全量列表（支持分类、翻页） */
const V1_URL = 'https://www.cls.cn/v1/roll/get_roll_list';
/** 增量更新（轮询专用，只返回比 lastTime 更新的内容） */
const NODEAPI_UPDATE_URL = 'https://www.cls.cn/nodeapi/updateTelegraphList';
/** 电报列表（nodeapi 版，支持翻页） */
const NODEAPI_LIST_URL = 'https://www.cls.cn/nodeapi/telegraphList';

// ── 请求头（缺少任意一项可能被 403 拦截） ───────────────────────────────────
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Referer: 'https://www.cls.cn/telegraph',
  Accept: 'application/json, text/plain, */*',
};

// ── 类型定义 ─────────────────────────────────────────────────────────────────
export interface TelegraphItem {
  id: number;
  ctime: number;   // 秒级时间戳
  title: string;
  content: string;
  level: 'A' | 'B' | 'C'; // A=加红重要, B=重要, C=普通
}

// ── 接口函数 ─────────────────────────────────────────────────────────────────

/**
 * 全量拉取电报列表（v1 接口）
 * @param count    每次拉取条数，默认 20
 * @param category 分类筛选：'' 全部 | 'red' 加红 | 'announcement' 公司 |
 *                 'watch' 看盘 | 'hk_us' 港美股 | 'fund' 基金 | 'remind' 提醒
 */
export async function fetchTelegraph(count = 20, category = ''): Promise<TelegraphItem[]> {
  const params: Record<string, string> = {
    app: 'CailianpressWeb',
    os: 'web',
    sv: '8.4.6',
    refresh_type: '1',
    rn: String(count),
    last_time: String(Math.floor(Date.now() / 1000)),
    category,
  };
  params.sign = makeSign(params);

  const res = await axios.get(V1_URL, { headers: HEADERS, params, timeout: 10000 });

  if (res.data.errno !== 0) {
    throw new Error(`fetchTelegraph 错误: errno=${res.data.errno} msg=${res.data.msg}`);
  }

  return (res.data.data?.roll_data ?? []) as TelegraphItem[];
}

/**
 * 增量拉取（轮询专用，nodeapi/updateTelegraphList）
 * 只返回比 lastTime 更新的内容，适合定时轮询去重
 * @param lastTime 上次最新一条的 ctime（秒），不传则返回当前最新一批
 */
export async function fetchTelegraphUpdate(lastTime?: number): Promise<TelegraphItem[]> {
  const params: Record<string, string> = {
    app: 'CailianpressWeb',
    hasFirstVipArticle: '0',
    lastTime: String(lastTime ?? Math.floor(Date.now() / 1000)),
    os: 'web',
    rn: '20',
    subscribedColumnIds: '',
    sv: '8.4.6',
  };
  params.sign = makeSign(params);

  const res = await axios.get(NODEAPI_UPDATE_URL, { headers: HEADERS, params, timeout: 10000 });

  if (res.data.error !== 0) {
    throw new Error(`fetchTelegraphUpdate 错误: error=${res.data.error}`);
  }

  return (res.data.data?.roll_data ?? []) as TelegraphItem[];
}

/**
 * 电报列表（nodeapi/telegraphList）
 * 与 v1 类似，支持翻页，lastTime 传上一批最旧一条的 ctime 往前翻
 * @param lastTime 上一批最旧一条的 ctime（秒），不传则从最新开始
 * @param count    每次拉取条数，默认 20
 */
export async function fetchTelegraphList(lastTime?: number, count = 20): Promise<TelegraphItem[]> {
  const ts = String(lastTime ?? Math.floor(Date.now() / 1000));
  const params: Record<string, string> = {
    app: 'CailianpressWeb',
    lastTime: ts,
    last_time: ts,
    os: 'web',
    refresh_type: '1',
    rn: String(count),
    sv: '8.4.6',
  };
  params.sign = makeSign(params);

  const res = await axios.get(NODEAPI_LIST_URL, { headers: HEADERS, params, timeout: 10000 });

  if (res.data.error !== 0) {
    throw new Error(`fetchTelegraphList 错误: error=${res.data.error}`);
  }

  return (res.data.data?.roll_data ?? []) as TelegraphItem[];
}
