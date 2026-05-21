export interface SseOptions<T = any> {
  /** 请求地址 */
  url: string
  /** POST body，有则用 POST，无则用 GET */
  body?: Record<string, any>
  /** 额外请求头 */
  headers?: Record<string, string>
  /** 收到每个 data chunk 时的回调，返回 true 表示提前终止 */
  onChunk: (data: string) => boolean | void
  /** 请求出错时的回调 */
  onError?: (err: Error) => void
  /** 流结束时的回调 */
  onDone?: () => void
}

/**
 * 底层 SSE 流读取工具函数（非响应式，可在任意地方调用）
 * 支持 POST + body，自动处理跨 chunk 的不完整行缓冲
 */
export async function fetchSseStream<T = any>(options: SseOptions<T>, signal?: AbortSignal) {
  const { url, body, headers = {}, onChunk, onError, onDone } = options

  try {
    const res = await fetch(url, {
      method: body ? 'POST' : 'GET',
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    })

    if (!res.ok || !res.body) {
      throw new Error(`请求失败 ${res.status}`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // 按换行切割，保留最后不完整的行继续缓冲
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const data = trimmed.slice(5).trim()
        // 回调返回 true 表示提前终止
        if (onChunk(data) === true) {
          reader.cancel()
          onDone?.()
          return
        }
      }
    }

    onDone?.()
  } catch (err: any) {
    // AbortError 是主动取消，不算错误
    if (err?.name !== 'AbortError') {
      onError?.(err instanceof Error ? err : new Error(err?.message ?? '请求失败'))
    }
  }
}

/**
 * 通用 SSE composable
 * 封装 loading / error / abort 状态，适合在组件里直接使用
 *
 * @example
 * const { text, loading, error, start, abort } = useSse({
 *   url: '/api/ai/analyze',
 *   body: { content, title },
 *   onData(data) {
 *     // 解析 OpenAI 格式 delta
 *     if (data === '[DONE]') return true  // 返回 true 终止流
 *     const json = JSON.parse(data)
 *     const delta = json.choices?.[0]?.delta?.content
 *     if (delta) text.value += delta
 *   },
 * })
 */
export function useSse(options: {
  url: string
  body?: Record<string, any>
  headers?: Record<string, string>
  /** 收到每条 data 时的处理，返回 true 终止流 */
  onData: (data: string) => boolean | void
  onDone?: () => void
}) {
  const loading = ref(false)
  const error = ref('')
  let controller: AbortController | null = null

  async function start(overrideBody?: Record<string, any>) {
    abort() // 取消上一次未完成的请求
    loading.value = true
    error.value = ''
    controller = new AbortController()

    await fetchSseStream(
      {
        url: options.url,
        body: overrideBody ?? options.body,
        headers: options.headers,
        onChunk: options.onData,
        onError: (err) => { error.value = err.message },
        onDone: () => {
          loading.value = false
          options.onDone?.()
        },
      },
      controller.signal,
    )

    loading.value = false
  }

  function abort() {
    controller?.abort()
    controller = null
    loading.value = false
  }

  return { loading, error, start, abort }
}
