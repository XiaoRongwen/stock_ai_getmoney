import { fetchSseStream } from './useSse'

export function useAiAnalyze() {
  const results = reactive<Record<number, string>>({})
  const loading = reactive<Record<number, boolean>>({})

  async function analyze(id: number, content: string, title?: string | null) {
    if (loading[id]) return
    loading[id] = true
    results[id] = ''

    await fetchSseStream({
      url: '/api/ai/analyze',
      body: { content, title },
      onChunk(data) {
        if (data === '[DONE]') return true
        try {
          const json = JSON.parse(data)
          if (json.error) { results[id] = `解读失败：${json.error}`; return true }
          const delta = json.choices?.[0]?.delta?.content
          if (delta) results[id] += delta
        } catch { /* 忽略不完整 JSON */ }
      },
      onError(err) { results[id] = `解读失败：${err.message}` },
      onDone() { loading[id] = false },
    })

    loading[id] = false
  }

  return { results, loading, analyze }
}
