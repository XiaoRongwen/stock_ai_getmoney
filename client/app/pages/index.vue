<template>
  <div class="space-y-4">
    <AuthModal v-model="authModalOpen" />
    <AiAnalyzeModal v-model="aiModalOpen" :item="aiTarget" />

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

      <!-- 实时电报（左侧 2/3） -->
      <div class="md:col-span-2 rounded-xl bg-white overflow-hidden"
        style="border:1px solid #e8e8e8; box-shadow:0 1px 3px rgba(0,0,0,.04);">
        <div class="flex items-center justify-between px-4 py-3" style="border-bottom:1px solid #f3f4f6;">
          <div class="flex items-center gap-2">
            <span class="w-1 h-4 rounded-full inline-block" style="background:#c0392b;"></span>
            <span class="text-sm font-semibold" style="color:#1a1a2e;">实时电报</span>
            <span class="text-xs px-2 py-0.5 rounded-full" style="background:#fff1f0;color:#e03131;">财联社</span>
          </div>
          <div class="flex items-center gap-1.5 text-xs" style="color:#9ca3af;">
            <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block"></span>
            实时
          </div>
        </div>
        <div v-if="loading" class="flex items-center justify-center py-16 text-sm" style="color:#9ca3af;">
          <span class="animate-pulse">加载中...</span>
        </div>
        <div v-else-if="error" class="flex items-center justify-center py-16 text-sm" style="color:#e03131;">
          ⚠️ {{ error }}
        </div>
        <div v-else class="divide-y overflow-y-auto" style="border-color:#f3f4f6; max-height:70vh;">
          <div v-for="item in items" :key="item.id"
            class="flex gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
            <div class="shrink-0 mt-0.5">
              <span class="text-xs px-1.5 py-0.5 rounded font-medium"
                :style="item.level === 'A' ? 'background:#fff1f0;color:#e03131;'
                  : item.level === 'B' ? 'background:#fffbeb;color:#d97706;'
                  : 'background:#f9fafb;color:#9ca3af;'">
                {{ item.level === 'A' ? '重要' : item.level === 'B' ? '关注' : '普通' }}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <p v-if="item.title" class="text-sm font-medium leading-snug" style="color:#1a1a2e;">{{ item.title }}</p>
              <p class="text-xs leading-relaxed mt-0.5" :class="item.title ? 'line-clamp-2' : 'text-sm'" style="color:#4b5563;">
                {{ item.content }}
              </p>
              <div class="flex items-center gap-3 mt-2">
                <span class="text-xs" style="color:#9ca3af;">{{ formatTime(item.ctime) }}</span>
                <button class="text-xs px-2 py-0.5 rounded" style="background:#fff1f0;color:#e03131;cursor:pointer;" @click="openAi(item)">
                  🤖 AI 解读
                </button>
              </div>
            </div>
          </div>
          <div v-if="!items.length" class="flex items-center justify-center py-16 text-sm" style="color:#9ca3af;">暂无数据</div>
        </div>
      </div>

      <!-- 右侧：热点追踪面板 -->
      <div class="rounded-xl bg-white overflow-hidden flex flex-col"
        style="border:1px solid #e8e8e8; box-shadow:0 1px 3px rgba(0,0,0,.04); max-height:80vh;">

        <!-- 头部 -->
        <div class="px-3 py-2.5 shrink-0" style="border-bottom:1px solid #f3f4f6; background:linear-gradient(135deg,#fff8f8,#fff);">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-1.5">
              <span class="text-sm">📰</span>
              <span class="text-sm font-semibold" style="color:#1a1a2e;">热点追踪</span>
            </div>
            <button
              class="text-xs px-3 py-1 rounded-lg font-medium transition-all"
              :style="reportLoading
                ? 'background:#f3f4f6;color:#9ca3af;cursor:not-allowed;'
                : 'background:linear-gradient(135deg,#c0392b,#e74c3c);color:#fff;cursor:pointer;'"
              :disabled="reportLoading"
              @click="generate">
              <span v-if="reportLoading" class="flex items-center gap-1">
                <span class="w-2.5 h-2.5 border border-gray-300 border-t-gray-500 rounded-full animate-spin inline-block"></span>
                分析中
              </span>
              <span v-else>{{ report ? '重新生成' : '生成报告' }}</span>
            </button>
          </div>

          <!-- 下拉菜单行 -->
          <div class="flex gap-1.5">
            <!-- 日期 -->
            <select v-model="selectedDate" class="flex-1 text-xs px-2 py-1 rounded-lg border outline-none"
              style="border-color:#e8e8e8;color:#374151;background:#f9fafb;"
              @change="onDateChange">
              <option value="today">今天</option>
              <option value="yesterday">昨天</option>
            </select>
            <!-- 市场 -->
            <select v-model="filterMarket" class="flex-1 text-xs px-2 py-1 rounded-lg border outline-none"
              style="border-color:#e8e8e8;color:#374151;background:#f9fafb;">
              <option value="">全部市场</option>
              <option v-for="m in marketOptions" :key="m" :value="m">{{ m }}</option>
            </select>
            <!-- 周期 -->
            <select v-model="filterHorizon" class="flex-1 text-xs px-2 py-1 rounded-lg border outline-none"
              style="border-color:#e8e8e8;color:#374151;background:#f9fafb;">
              <option value="">全部周期</option>
              <option v-for="h in horizonOptions" :key="h" :value="h">{{ h }}</option>
            </select>
            <!-- 强度 -->
            <select v-model="filterStrength" class="flex-1 text-xs px-2 py-1 rounded-lg border outline-none"
              style="border-color:#e8e8e8;color:#374151;background:#f9fafb;">
              <option value="">全部强度</option>
              <option v-for="s in strengthOptions" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
        </div>

        <!-- 结果区 -->
        <div class="flex-1 overflow-y-auto">
          <!-- 加载态 -->
          <div v-if="reportLoading" class="flex flex-col items-center justify-center py-10 gap-2">
            <div class="w-5 h-5 border-2 border-red-200 border-t-red-500 rounded-full animate-spin"></div>
            <span class="text-xs" style="color:#9ca3af;">AI 分析中...</span>
          </div>

          <!-- 空态 -->
          <div v-else-if="!report" class="flex flex-col items-center justify-center py-10 gap-2">
            <span class="text-2xl">📊</span>
            <p class="text-xs text-center" style="color:#9ca3af;">设置条件后点击「生成报告」</p>
          </div>

          <!-- 有数据 -->
          <template v-else>
            <!-- 摘要 -->
            <div class="mx-3 mt-2 px-2.5 py-1.5 rounded-lg text-xs leading-relaxed" style="background:#f8faff;color:#374151;border:1px solid #e8eef8;">
              <span class="font-medium">📋 {{ report.summary }}</span>
              <span v-if="report.market_mood" class="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                :style="report.market_mood === '偏多' ? 'background:#fff1f0;color:#e03131;'
                  : report.market_mood === '偏空' ? 'background:#f0fdf4;color:#16a34a;'
                  : 'background:#fffbeb;color:#d97706;'">
                市场情绪：{{ report.market_mood }}
              </span>
            </div>

            <!-- 风险提示 -->
            <div class="mx-3 mt-1.5 px-2.5 py-1.5 rounded-lg text-[10px] leading-relaxed" style="background:#fffbeb;color:#92400e;">
              ⚠️ 以下内容由 AI 基于新闻自动生成，仅供信息参考，不构成任何投资建议。股市有风险，投资需谨慎。
            </div>

            <!-- 个股列表 -->
            <div class="px-2 pt-2 pb-3 space-y-1">
              <div v-if="!filteredStocks.length" class="text-xs text-center py-4" style="color:#9ca3af;">无符合条件的数据</div>

              <div v-for="(stock, i) in filteredStocks" :key="stock.code"
                class="rounded-lg px-2.5 py-2 hover:bg-gray-50 transition-colors"
                style="border:1px solid #f3f4f6;">

                <!-- 第一行：序号 + 名称 + 代码 + 新闻热度 -->
                <div class="flex items-center gap-1.5">
                  <span class="shrink-0 w-3.5 h-3.5 rounded-full text-center font-bold leading-3.5 text-[10px]"
                    :style="i < 3 ? 'background:#e03131;color:#fff;' : 'background:#e5e7eb;color:#6b7280;'">
                    {{ i + 1 }}
                  </span>
                  <span class="font-semibold text-xs flex-1 truncate" style="color:#1a1a2e;">{{ stock.name }}</span>
                  <span class="font-mono text-[11px] px-1 rounded shrink-0" style="background:#f3f4f6;color:#374151;">{{ stock.code }}</span>
                  <!-- strength 内部字段，前端展示为"新闻热度" -->
                  <span class="text-[10px] px-1 rounded-full shrink-0 font-medium"
                    :style="stock.strength === '强' ? 'background:#eff6ff;color:#1e40af;'
                      : stock.strength === '中' ? 'background:#fffbeb;color:#d97706;'
                      : 'background:#f9fafb;color:#9ca3af;'">
                    热度{{ stock.strength === '强' ? '高' : stock.strength === '中' ? '中' : '低' }}
                  </span>
                </div>

                <!-- 第二行：标签 + 影响周期 -->
                <div class="flex items-center gap-1 mt-1 flex-wrap">
                  <span class="text-[10px] px-1.5 py-0.5 rounded-full" :style="marketStyle(stock.market)">{{ stock.market }}</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded-full" style="background:#eff6ff;color:#1d4ed8;">{{ stock.sector }}</span>
                  <!-- horizon 内部字段，前端展示为"新闻影响周期" -->
                  <span class="text-[10px] px-1.5 py-0.5 rounded-full" style="background:#f9fafb;color:#6b7280;">
                    {{ stock.horizon === '短线' ? '短期关注' : '中期关注' }}
                  </span>
                  <!-- gain_range 内部字段，前端展示为"参考区间" -->
                  <span class="ml-auto text-[10px] font-mono shrink-0" style="color:#6b7280;">参考 {{ stock.gain_range }}</span>
                </div>

                <!-- 第三行：新闻摘要（logic 字段，去掉操作引导语气） -->
                <p class="text-[11px] mt-1 leading-relaxed" style="color:#4b5563;">
                  {{ stock.logic }}
                </p>

                <!-- 第四行：不确定因素 -->
                <p class="text-[10px] mt-0.5 leading-relaxed" style="color:#9ca3af;">
                  注意：{{ stock.risk }}
                </p>
              </div>

              <p class="text-[10px] text-center pt-1" style="color:#d1d5db;">{{ formatReportTime(report.createdAt) }} 生成 · 仅供参考</p>
            </div>
          </template>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useTelegraph } from '~/composables/useTelegraph'
import { fetchSseStream } from '~/composables/useSse'
import type { TelegraphItem } from '~/composables/useTelegraph'

const authModalOpen = ref(false)
const { items, loading, error, formatTime, load, startStream } = useTelegraph()

const aiModalOpen = ref(false)
const aiTarget = ref<TelegraphItem | null>(null)
function openAi(item: TelegraphItem) {
  aiTarget.value = item
  aiModalOpen.value = true
}

// ── 类型 ──────────────────────────────────────────────
interface StockItem {
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
interface DailyReport {
  id: number
  date: string
  stocks: StockItem[]
  summary: string
  market_mood?: string
  createdAt: string
}

// ── 下拉选项 ──────────────────────────────────────────
const marketOptions   = ['主板', '创业板', '科创板', '北交所']
const horizonOptions  = ['短线', '中线']
const strengthOptions = ['强', '中', '弱']

// ── 筛选状态（单选，空字符串=不限） ──────────────────
const selectedDate   = ref<'today' | 'yesterday'>('today')
const filterMarket   = ref('')
const filterHorizon  = ref('')
const filterStrength = ref('')

function getDateStr(which: 'today' | 'yesterday') {
  const d = new Date()
  if (which === 'yesterday') d.setDate(d.getDate() - 1)
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })
}

// ── 报告数据 ──────────────────────────────────────────
const report = ref<DailyReport | null>(null)
const reportLoading = ref(false)

function parseReport(data: any): DailyReport {
  return {
    ...data,
    stocks: typeof data.stocks === 'string' ? JSON.parse(data.stocks) : data.stocks,
  }
}

async function fetchReport() {
  const date = getDateStr(selectedDate.value)
  try {
    const res = await $fetch<{ data: any }>(`/api/ai/daily-report?date=${date}`)
    const data = res?.data
    report.value = data ? parseReport(data) : null
  } catch { report.value = null }
}

async function generate() {
  if (reportLoading.value) return
  reportLoading.value = true
  report.value = null

  const date = getDateStr(selectedDate.value)

  await fetchSseStream({
    url: `/api/ai/daily-report/generate?date=${date}`,
    body: {
      markets:   filterMarket.value   ? [filterMarket.value]   : [],
      horizons:  filterHorizon.value  ? [filterHorizon.value]  : [],
      strengths: filterStrength.value ? [filterStrength.value] : [],
    },
    onChunk(data) {
      try {
        const json = JSON.parse(data)
        if (json.type === 'done') {
          report.value = parseReport(json)
          return true // 终止流
        }
        if (json.type === 'error') {
          console.error('AI 分析失败:', json.message)
          return true
        }
        // progress / chunk 忽略
      } catch { /* 忽略不完整数据 */ }
    },
    onError(err) { console.error('生成失败', err.message) },
    onDone() { reportLoading.value = false },
  })

  reportLoading.value = false
}

async function onDateChange() {
  report.value = null
  await fetchReport()
  if (!report.value && selectedDate.value === 'today') generate()
}

// ── 前端过滤（已有结果时快速筛选，不重新调 AI） ──────
const filteredStocks = computed(() => {
  if (!report.value) return []
  return report.value.stocks.filter(s => {
    if (filterMarket.value   && s.market   !== filterMarket.value)   return false
    if (filterHorizon.value  && s.horizon  !== filterHorizon.value)  return false
    if (filterStrength.value && s.strength !== filterStrength.value) return false
    return true
  })
})

// ── 样式辅助 ──────────────────────────────────────────
function marketStyle(market: string) {
  const map: Record<string, string> = {
    '主板':  'background:#eff6ff;color:#1e40af;',
    '创业板': 'background:#fdf4ff;color:#6b21a8;',
    '科创板': 'background:#fff7ed;color:#c2410c;',
    '北交所': 'background:#f0fdf4;color:#166534;',
  }
  return map[market] ?? 'background:#f9fafb;color:#6b7280;'
}

function formatReportTime(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// ── 初始化 ────────────────────────────────────────────
onMounted(() => {
  load()
  startStream()
  fetchReport().then(() => {
    if (!report.value) generate()
  })
})
</script>
