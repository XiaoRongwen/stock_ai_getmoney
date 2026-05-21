<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background:rgba(0,0,0,0.45);"
        @click.self="$emit('update:modelValue', false)">

        <div class="relative w-full max-w-3xl rounded-2xl bg-white overflow-hidden flex flex-col"
          style="box-shadow:0 20px 60px rgba(0,0,0,0.2); height:90vh;">

          <!-- 头部 -->
          <div class="flex items-center justify-between px-5 py-4 shrink-0"
            style="border-bottom:1px solid #f3f4f6; background:linear-gradient(135deg,#fff8f8,#fff);">
            <div class="flex items-center gap-2">
              <span class="text-lg">🤖</span>
              <span class="text-sm font-semibold" style="color:#1a1a2e;">AI 解读</span>
              <span class="text-xs px-2 py-0.5 rounded-full" style="background:#fff1f0;color:#e03131;">豆包</span>
            </div>
            <button class="w-7 h-7 flex items-center justify-center rounded-full transition-colors hover:bg-gray-100"
              style="color:#9ca3af;"
              @click="$emit('update:modelValue', false)">✕</button>
          </div>

          <!-- 原文 -->
          <div class="px-5 py-3 shrink-0" style="border-bottom:1px solid #f3f4f6; background:#f9fafb;">
            <div class="text-xs mb-1 font-medium" style="color:#9ca3af;">原文</div>
            <p v-if="item?.title" class="text-sm font-medium mb-1" style="color:#1a1a2e;">{{ item.title }}</p>
            <p class="text-xs leading-relaxed line-clamp-3" style="color:#4b5563;">{{ item?.content }}</p>
          </div>

          <!-- 内容区 -->
          <div ref="scrollEl" class="px-6 py-5 overflow-y-auto flex-1">

            <!-- 初始加载 -->
            <div v-if="loading && !result" class="flex items-center gap-2 text-sm" style="color:#9ca3af;">
              <span class="flex gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-red-400 animate-bounce" style="animation-delay:0ms" />
                <span class="w-1.5 h-1.5 rounded-full bg-red-400 animate-bounce" style="animation-delay:150ms" />
                <span class="w-1.5 h-1.5 rounded-full bg-red-400 animate-bounce" style="animation-delay:300ms" />
              </span>
              正在分析...
            </div>

            <!-- 错误 -->
            <div v-if="error" class="text-sm" style="color:#e03131;">⚠️ {{ error }}</div>

            <!-- 流式打字结果 -->
            <div v-if="result">
              <div class="prose max-w-none leading-relaxed ai-content"
                style="font-size:14px;"
                v-html="renderedResult" />
              <!-- 打字光标，流结束后消失 -->
              <span v-if="loading" class="animate-pulse text-red-400 text-base">▌</span>
            </div>

          </div>

          <!-- 底部 -->
          <div class="px-5 py-3 flex justify-end gap-2 shrink-0" style="border-top:1px solid #f3f4f6;">
            <button class="text-xs px-4 py-2 rounded-lg transition-colors"
              style="background:#f3f4f6;color:#6b7280;"
              @click="$emit('update:modelValue', false)">关闭</button>
            <button class="text-xs px-4 py-2 rounded-lg text-white transition-opacity"
              style="background:linear-gradient(135deg,#c0392b,#e74c3c);"
              :style="loading ? 'opacity:0.6;cursor:not-allowed;' : ''"
              :disabled="loading"
              @click="retry">{{ loading ? '分析中...' : '重新分析' }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { marked } from 'marked'
import { useSse } from '~/composables/useSse'
import type { TelegraphItem } from '~/composables/useTelegraph'

marked.setOptions({ breaks: true })

const props = defineProps<{
  modelValue: boolean
  item: TelegraphItem | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const result = ref('')
const scrollEl = ref<HTMLElement>()
const renderedResult = computed(() => marked.parse(result.value) as string)

function scrollToBottom() {
  nextTick(() => {
    if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  })
}

const { loading, error, start, abort } = useSse({
  url: '/api/ai/analyze',
  onData(data) {
    if (data === '[DONE]') return true
    try {
      const json = JSON.parse(data)
      if (json.error) { error.value = json.error; return true }
      const delta = json.choices?.[0]?.delta
      // reasoning_content 是思维链，content 是正式答案，两个都实时追加
      const text = delta?.content ?? delta?.reasoning_content ?? ''
      if (text) {
        result.value += text
        scrollToBottom()
      }
    } catch { /* 忽略不完整 JSON */ }
  },
})

function run() {
  if (!props.item) return
  result.value = ''
  start({ content: props.item.content, title: props.item.title })
}

function retry() { run() }

watch(() => props.modelValue, (val) => {
  if (val && props.item) run()
  else abort()
})
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s, transform 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.96); }

.ai-content :deep(p)      { margin: 0 0 0.6em; color: #1a1a2e; }
.ai-content :deep(strong) { font-weight: 600; color: #1a1a2e; }
.ai-content :deep(ol),
.ai-content :deep(ul)     { padding-left: 1.4em; margin: 0.4em 0; }
.ai-content :deep(li)     { margin: 0.25em 0; color: #1a1a2e; }
.ai-content :deep(h1),
.ai-content :deep(h2),
.ai-content :deep(h3)     { font-weight: 600; margin: 0.8em 0 0.3em; color: #1a1a2e; }
</style>
