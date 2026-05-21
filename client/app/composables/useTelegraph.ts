export interface TelegraphItem {
  id: number
  ctime: number
  level: 'A' | 'B' | 'C'
  title: string | null
  content: string
}

export function useTelegraph() {
  const items = ref<TelegraphItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 格式化时间：今天显示 HH:mm，否则显示 MM/DD HH:mm
  function formatTime(ctime: number): string {
    const d = new Date(ctime * 1000)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    const hm = d.toTimeString().slice(0, 5)
    return isToday ? hm : `${d.getMonth() + 1}/${d.getDate()} ${hm}`
  }

  // 初始加载
  async function load(limit = 50) {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<{ code: number; data: TelegraphItem[] }>(
        '/api/telegraph',
        { params: { limit } }
      )
      items.value = res.data ?? []
    } catch (e: any) {
      error.value = e?.message ?? '加载失败'
    } finally {
      loading.value = false
    }
  }

  // SSE 实时推送：有新内容插到顶部
  function startStream() {
    if (typeof window === 'undefined') return
    const es = new EventSource('/api/telegraph/stream')
    es.onmessage = (e) => {
      const newItems: TelegraphItem[] = JSON.parse(e.data)
      items.value = [...newItems, ...items.value].slice(0, 200) // 最多保留200条
    }
    es.onerror = () => es.close()
    onUnmounted(() => es.close())
  }

  return { items, loading, error, formatTime, load, startStream }
}
