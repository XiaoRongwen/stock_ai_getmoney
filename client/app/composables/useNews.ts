import { fetchSseStream } from './useSse'

export interface StockItem {
  name: string
  code: string
  market: string
  sector: string
  gain_range: string
  logic: string
  risk: string
  horizon: '短线' | '中线'
  strength: '强' | '中' | '弱'
  strength_reason: string
}

export interface NewsAnalysis {
  stocks: StockItem[]
  summary: string
  market_mood: string
}

export interface NewsReport {
  id: number
  date: string
  content: string
  analysis: string   // JSON 字符串，结构同 NewsAnalysis
  createdAt: string
  updatedAt: string
}

export function useNews() {
  const items   = ref<NewsReport[]>([])
  const total   = ref(0)
  const loading = ref(false)
  const error   = ref<string | null>(null)

  async function load(page = 1, limit = 30) {
    loading.value = true
    error.value   = null
    try {
      const res = await $fetch<{ code: number; data: { total: number; items: NewsReport[] } }>(
        '/api/news',
        { params: { page, limit } },
      )
      items.value = res.data?.items ?? []
      total.value = res.data?.total ?? 0
    } catch (e: any) {
      error.value = e?.message ?? '加载失败'
    } finally {
      loading.value = false
    }
  }

  async function save(content: string, date?: string): Promise<NewsReport | null> {
    try {
      const res = await $fetch<{ code: number; data: NewsReport }>(
        '/api/news',
        { method: 'POST', body: { content, date } },
      )
      return res.data ?? null
    } catch (e: any) {
      error.value = e?.message ?? '保存失败'
      return null
    }
  }

  async function del(id: number): Promise<boolean> {
    try {
      await $fetch(`/api/news/${id}`, { method: 'DELETE' })
      items.value = items.value.filter(i => i.id !== id)
      total.value = Math.max(0, total.value - 1)
      return true
    } catch (e: any) {
      error.value = e?.message ?? '删除失败'
      return false
    }
  }

  /** 解析 analysis JSON 字段 */
  function parseAnalysis(raw: string): NewsAnalysis | null {
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw)
      if (!parsed.stocks) return null
      return parsed as NewsAnalysis
    } catch {
      return null
    }
  }

  return { items, total, loading, error, load, save, del, parseAnalysis }
}

export function useNewsAnalyze() {
  // 每条记录的分析结果（解析后的对象）
  const reportMap  = reactive<Record<number, NewsAnalysis>>({})
  const loadingMap = reactive<Record<number, boolean>>({})

  async function analyze(
    item: NewsReport,
    filters: { markets: string[]; horizons: string[]; strengths: string[] },
    onDone?: (report: NewsAnalysis) => void,
  ) {
    if (loadingMap[item.id]) return
    loadingMap[item.id] = true
    // 清空旧结果，开始新一轮
    delete reportMap[item.id]

    await fetchSseStream({
      url:  `/api/news/${item.id}/analyze`,
      body: filters,
      onChunk(data) {
        try {
          const json = JSON.parse(data)
          if (json.type === 'done') {
            const result: NewsAnalysis = {
              stocks:      json.stocks      ?? [],
              summary:     json.summary     ?? '',
              market_mood: json.market_mood ?? '',
            }
            reportMap[item.id] = result
            onDone?.(result)
            return true
          }
          if (json.type === 'error') {
            console.error('分析失败:', json.message)
            return true
          }
          // progress / chunk 忽略（JSON 流不做增量渲染）
        } catch { /* 忽略不完整数据 */ }
      },
      onError(err) { console.error('请求失败:', err.message) },
      onDone()     { loadingMap[item.id] = false },
    })

    loadingMap[item.id] = false
  }

  return { reportMap, loadingMap, analyze }
}
