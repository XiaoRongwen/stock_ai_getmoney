<template>
  <div class="space-y-4">

    <!-- 添加面板（折叠） -->
    <div class="rounded-xl bg-white overflow-hidden"
      style="border:1px solid #e8e8e8; box-shadow:0 1px 3px rgba(0,0,0,.04);">
      <div class="flex items-center justify-between px-4 py-3" style="border-bottom:1px solid #f3f4f6;">
        <div class="flex items-center gap-2">
          <span class="w-1 h-4 rounded-full inline-block" style="background:#c0392b;"></span>
          <span class="text-sm font-semibold" style="color:#1a1a2e;">📺 新闻联播</span>
          <span class="text-xs px-2 py-0.5 rounded-full" style="background:#fff1f0;color:#e03131;">央视</span>
        </div>
        <button
          class="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
          style="background:linear-gradient(135deg,#c0392b,#e74c3c);color:#fff;cursor:pointer;"
          @click="showAddPanel = !showAddPanel">
          {{ showAddPanel ? '收起' : '＋ 添加内容' }}
        </button>
      </div>

      <div v-if="showAddPanel" class="px-4 py-4 space-y-3" style="background:#fafafa;border-bottom:1px solid #f3f4f6;">
        <div class="flex items-center gap-3">
          <label class="text-xs font-medium shrink-0" style="color:#374151;">日期</label>
          <input v-model="inputDate" type="date"
            class="text-xs px-2 py-1.5 rounded-lg border outline-none"
            style="border-color:#e8e8e8;color:#374151;background:#fff;" />
          <span class="text-xs" style="color:#9ca3af;">留空默认今天</span>
        </div>
        <div>
          <label class="text-xs font-medium block mb-1.5" style="color:#374151;">新闻联播内容</label>
          <textarea v-model="inputContent" rows="5"
            placeholder="粘贴新闻联播文本，例如：钛媒体App 4月29日消息，今天《新闻联播》主要内容有：1.xxx；2.xxx..."
            class="w-full text-xs px-3 py-2.5 rounded-lg border outline-none resize-none leading-relaxed"
            style="border-color:#e8e8e8;color:#374151;background:#fff;font-family:inherit;" />
        </div>
        <div class="flex items-center gap-2">
          <button
            class="text-xs px-4 py-1.5 rounded-lg font-medium transition-all"
            :style="saving ? 'background:#f3f4f6;color:#9ca3af;cursor:not-allowed;'
                           : 'background:linear-gradient(135deg,#c0392b,#e74c3c);color:#fff;cursor:pointer;'"
            :disabled="saving"
            @click="handleSave">
            {{ saving ? '保存中...' : '保存' }}
          </button>
          <button class="text-xs px-4 py-1.5 rounded-lg border transition-all"
            style="border-color:#e8e8e8;color:#6b7280;cursor:pointer;"
            @click="clearInput">清空</button>
          <span v-if="saveMsg" class="text-xs" :style="saveMsg.ok ? 'color:#16a34a;' : 'color:#e03131;'">
            {{ saveMsg.text }}
          </span>
        </div>
      </div>
    </div>

    <!-- 三栏主体 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4" style="min-height:75vh;">

      <!-- 左栏：历史列表 -->
      <div class="md:col-span-1 rounded-xl bg-white overflow-hidden flex flex-col"
        style="border:1px solid #e8e8e8; box-shadow:0 1px 3px rgba(0,0,0,.04); max-height:80vh;">
        <div class="px-4 py-3 shrink-0 flex items-center justify-between" style="border-bottom:1px solid #f3f4f6;">
          <span class="text-sm font-semibold" style="color:#1a1a2e;">历史记录</span>
          <span class="text-xs px-2 py-0.5 rounded-full" style="background:#f3f4f6;color:#6b7280;">{{ total }} 条</span>
        </div>

        <div v-if="loading" class="flex items-center justify-center py-12 text-sm" style="color:#9ca3af;">
          <span class="animate-pulse">加载中...</span>
        </div>
        <div v-else-if="!items.length" class="flex flex-col items-center justify-center py-12 gap-2">
          <span class="text-2xl">📺</span>
          <p class="text-xs" style="color:#9ca3af;">暂无记录</p>
        </div>
        <div v-else class="flex-1 overflow-y-auto divide-y" style="border-color:#f3f4f6;">
          <div v-for="item in items" :key="item.id"
            class="px-3 py-3 cursor-pointer transition-colors hover:bg-gray-50"
            :style="selected?.id === item.id
              ? 'background:#fff8f8;border-left:3px solid #e03131;'
              : 'border-left:3px solid transparent;'"
            @click="selectItem(item)">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-semibold" style="color:#1a1a2e;">{{ item.date }}</span>
              <div class="flex items-center gap-1">
                <span v-if="item.analysis" class="text-[10px] px-1.5 py-0.5 rounded-full"
                  style="background:#f0fdf4;color:#16a34a;">已分析</span>
                <button class="text-[10px] px-1.5 py-0.5 rounded transition-colors"
                  style="color:#d1d5db;cursor:pointer;"
                  @click.stop="handleDelete(item)">删除</button>
              </div>
            </div>
            <p class="text-xs leading-relaxed line-clamp-2" style="color:#9ca3af;">{{ item.content }}</p>
          </div>
        </div>
      </div>

      <!-- 中栏：原文 -->
      <div class="md:col-span-1 rounded-xl bg-white overflow-hidden flex flex-col"
        style="border:1px solid #e8e8e8; box-shadow:0 1px 3px rgba(0,0,0,.04); max-height:80vh;">
        <div class="px-4 py-3 shrink-0" style="border-bottom:1px solid #f3f4f6;">
          <span class="text-sm font-semibold" style="color:#1a1a2e;">
            {{ selected ? selected.date + ' 原文' : '原文内容' }}
          </span>
        </div>

        <div v-if="!selected" class="flex flex-col items-center justify-center flex-1 gap-2 py-12">
          <span class="text-3xl">📄</span>
          <p class="text-xs" style="color:#9ca3af;">从左侧选择记录</p>
        </div>
        <div v-else class="flex-1 overflow-y-auto px-4 py-3">
          <p class="text-xs leading-relaxed whitespace-pre-wrap" style="color:#374151;">{{ selected.content }}</p>
        </div>
      </div>

      <!-- 右栏：热点追踪（复刻 index.vue 右侧面板） -->
      <div class="md:col-span-2 rounded-xl bg-white overflow-hidden flex flex-col"
        style="border:1px solid #e8e8e8; box-shadow:0 1px 3px rgba(0,0,0,.04); max-height:80vh;">

        <!-- 头部 -->
        <div class="px-3 py-2.5 shrink-0"
          style="border-bottom:1px solid #f3f4f6; background:linear-gradient(135deg,#fff8f8,#fff);">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-1.5">
              <span class="text-sm">📺</span>
              <span class="text-sm font-semibold" style="color:#1a1a2e;">热点追踪</span>
            </div>
            <button
              class="text-xs px-3 py-1 rounded-lg font-medium transition-all"
              :style="!selected || currentLoading
                ? 'background:#f3f4f6;color:#9ca3af;cursor:not-allowed;'
                : 'background:linear-gradient(135deg,#c0392b,#e74c3c);color:#fff;cursor:pointer;'"
              :disabled="!selected || currentLoading"
              @click="generate">
              <span v-if="currentLoading" class="flex items-center gap-1">
                <span class="w-2.5 h-2.5 border border-gray-300 border-t-gray-500 rounded-full animate-spin inline-block"></span>
                分析中
              </span>
              <span v-else>{{ currentReport ? '重新生成' : '生成报告' }}</span>
            </button>
          </div>

          <!-- 筛选行 -->
          <div class="flex gap-1.5">
            <select v-model="filterMarket" class="flex-1 text-xs px-2 py-1 rounded-lg border outline-none"
              style="border-color:#e8e8e8;color:#374151;background:#f9fafb;">
              <option value="">全部市场</option>
              <option v-for="m in marketOptions" :key="m" :value="m">{{ m }}</option>
            </select>
            <select v-model="filterHorizon" class="flex-1 text-xs px-2 py-1 rounded-lg border outline-none"
              style="border-color:#e8e8e8;color:#374151;background:#f9fafb;">
              <option value="">全部周期</option>
              <option v-for="h in horizonOptions" :key="h" :value="h">{{ h }}</option>
            </select>
            <select v-model="filterStrength" class="flex-1 text-xs px-2 py-1 rounded-lg border outline-none"
              style="border-color:#e8e8e8;color:#374151;background:#f9fafb;">
              <option value="">全部强度</option>
              <option v-for="s in strengthOptions" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
        </div>

        <!-- 结果区 -->
        <div class="flex-1 overflow-y-auto">

          <!-- 未选中记录 -->
          <div v-if="!selected" class="flex flex-col items-center justify-center py-16 gap-2">
            <span class="text-2xl">📊</span>
            <p class="text-xs" style="color:#9ca3af;">先从左侧选择一条记录</p>
          </div>

          <!-- 加载中 -->
          <div v-else-if="currentLoading" class="flex flex-col items-center justify-center py-10 gap-2">
            <div class="w-5 h-5 border-2 border-red-200 border-t-red-500 rounded-full animate-spin"></div>
            <span class="text-xs" style="color:#9ca3af;">AI 分析中...</span>
          </div>

          <!-- 空态（已选中但未生成） -->
          <div v-else-if="!currentReport" class="flex flex-col items-center justify-center py-10 gap-2">
            <span class="text-2xl">📊</span>
            <p class="text-xs text-center" style="color:#9ca3af;">设置条件后点击「生成报告」</p>
          </div>

          <!-- 有数据 -->
          <template v-else>
            <!-- 摘要 -->
            <div class="mx-3 mt-2 px-2.5 py-1.5 rounded-lg text-xs leading-relaxed"
              style="background:#f8faff;color:#374151;border:1px solid #e8eef8;">
              <span class="font-medium">📋 {{ currentReport.summary }}</span>
              <span v-if="currentReport.market_mood" class="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                :style="currentReport.market_mood === '偏多' ? 'background:#fff1f0;color:#e03131;'
                  : currentReport.market_mood === '偏空' ? 'background:#f0fdf4;color:#16a34a;'
                  : 'background:#fffbeb;color:#d97706;'">
                市场情绪：{{ currentReport.market_mood }}
              </span>
            </div>

            <!-- 风险提示 -->
            <div class="mx-3 mt-1.5 px-2.5 py-1.5 rounded-lg text-[10px] leading-relaxed"
              style="background:#fffbeb;color:#92400e;">
              ⚠️ 以下内容由 AI 基于新闻联播自动生成，仅供信息参考，不构成任何投资建议。股市有风险，投资需谨慎。
            </div>

            <!-- 个股列表 -->
            <div class="px-2 pt-2 pb-3 space-y-1">
              <div v-if="!filteredStocks.length" class="text-xs text-center py-4" style="color:#9ca3af;">
                无符合条件的数据
              </div>

              <div v-for="(stock, i) in filteredStocks" :key="stock.code"
                class="rounded-lg px-2.5 py-2 hover:bg-gray-50 transition-colors"
                style="border:1px solid #f3f4f6;">

                <!-- 第一行：序号 + 名称 + 代码 + 热度 -->
                <div class="flex items-center gap-1.5">
                  <span class="shrink-0 w-3.5 h-3.5 rounded-full text-center font-bold text-[10px] flex items-center justify-center"
                    :style="i < 3 ? 'background:#e03131;color:#fff;' : 'background:#e5e7eb;color:#6b7280;'">
                    {{ i + 1 }}
                  </span>
                  <span class="font-semibold text-xs flex-1 truncate" style="color:#1a1a2e;">{{ stock.name }}</span>
                  <span class="font-mono text-[11px] px-1 rounded shrink-0" style="background:#f3f4f6;color:#374151;">{{ stock.code }}</span>
                  <span class="text-[10px] px-1 rounded-full shrink-0 font-medium"
                    :style="stock.strength === '强' ? 'background:#eff6ff;color:#1e40af;'
                      : stock.strength === '中' ? 'background:#fffbeb;color:#d97706;'
                      : 'background:#f9fafb;color:#9ca3af;'">
                    热度{{ stock.strength === '强' ? '高' : stock.strength === '中' ? '中' : '低' }}
                  </span>
                </div>

                <!-- 第二行：标签 -->
                <div class="flex items-center gap-1 mt-1 flex-wrap">
                  <span class="text-[10px] px-1.5 py-0.5 rounded-full" :style="marketStyle(stock.market)">{{ stock.market }}</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded-full" style="background:#eff6ff;color:#1d4ed8;">{{ stock.sector }}</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded-full" style="background:#f9fafb;color:#6b7280;">
                    {{ stock.horizon === '短线' ? '短期关注' : '中期关注' }}
                  </span>
                  <span class="ml-auto text-[10px] font-mono shrink-0" style="color:#6b7280;">参考 {{ stock.gain_range }}</span>
                </div>

                <!-- 第三行：逻辑 -->
                <p class="text-[11px] mt-1 leading-relaxed" style="color:#4b5563;">{{ stock.logic }}</p>

                <!-- 第四行：风险 -->
                <p class="text-[10px] mt-0.5 leading-relaxed" style="color:#9ca3af;">注意：{{ stock.risk }}</p>
              </div>

              <p class="text-[10px] text-center pt-1" style="color:#d1d5db;">
                {{ formatTime(selected.updatedAt) }} 生成 · 仅供参考
              </p>
            </div>
          </template>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useNews, useNewsAnalyze } from '~/composables/useNews'
import type { NewsReport, NewsAnalysis } from '~/composables/useNews'

const { items, total, loading, error, load, save, del, parseAnalysis } = useNews()
const { reportMap, loadingMap, analyze } = useNewsAnalyze()

// ── 添加面板 ──────────────────────────────────────────
const showAddPanel = ref(false)
const inputContent = ref('')
const inputDate    = ref('')
const saving       = ref(false)
const saveMsg      = ref<{ ok: boolean; text: string } | null>(null)

async function handleSave() {
  if (!inputContent.value.trim()) {
    saveMsg.value = { ok: false, text: '请输入内容' }
    return
  }
  saving.value  = true
  saveMsg.value = null

  const result = await save(inputContent.value.trim(), inputDate.value || undefined)
  if (result) {
    saveMsg.value    = { ok: true, text: '保存成功' }
    showAddPanel.value = false
    clearInput()
    await load()
    const found = items.value.find(i => i.id === result.id)
    if (found) selectItem(found)
  } else {
    saveMsg.value = { ok: false, text: '保存失败，请重试' }
  }
  saving.value = false
  setTimeout(() => { saveMsg.value = null }, 3000)
}

function clearInput() {
  inputContent.value = ''
  inputDate.value    = ''
}

// ── 选中记录 ──────────────────────────────────────────
const selected = ref<NewsReport | null>(null)

function selectItem(item: NewsReport) {
  // 始终从 items 里取最新对象，避免持有旧引用
  const fresh = items.value.find(i => i.id === item.id) ?? item
  selected.value = fresh
  // 如果已有存库分析且 reportMap 里没有，则解析填入
  if (fresh.analysis && !reportMap[fresh.id]) {
    const parsed = parseAnalysis(fresh.analysis)
    if (parsed) reportMap[fresh.id] = parsed
  }
}

// ── 删除 ──────────────────────────────────────────────
async function handleDelete(item: NewsReport) {
  if (!confirm(`确认删除 ${item.date} 的记录？`)) return
  const ok = await del(item.id)
  if (ok && selected.value?.id === item.id) {
    selected.value = items.value[0] ?? null
  }
}

// ── 筛选选项 ──────────────────────────────────────────
const marketOptions   = ['主板', '创业板', '科创板', '北交所']
const horizonOptions  = ['短线', '中线']
const strengthOptions = ['强', '中', '弱']

const filterMarket   = ref('')
const filterHorizon  = ref('')
const filterStrength = ref('')

// ── 当前选中记录的报告和加载状态 ─────────────────────
const currentReport  = computed<NewsAnalysis | null>(() =>
  selected.value ? (reportMap[selected.value.id] ?? null) : null
)
const currentLoading = computed<boolean>(() =>
  selected.value ? (loadingMap[selected.value.id] ?? false) : false
)

// ── 生成报告 ──────────────────────────────────────────
async function generate() {
  if (!selected.value || currentLoading.value) return
  const targetId = selected.value.id  // 快照 id，防止回调时 selected 已切换
  await analyze(
    selected.value,
    {
      markets:   filterMarket.value   ? [filterMarket.value]   : [],
      horizons:  filterHorizon.value  ? [filterHorizon.value]  : [],
      strengths: filterStrength.value ? [filterStrength.value] : [],
    },
    (result) => {
      const analysisJson = JSON.stringify(result)
      // 更新列表里对应记录的 analysis 字段（"已分析"标签 + 下次 selectItem 能读到）
      const idx = items.value.findIndex(i => i.id === targetId)
      if (idx !== -1) {
        items.value[idx] = { ...items.value[idx], analysis: analysisJson }
        // 如果当前还选着这条，同步更新 selected
        if (selected.value?.id === targetId) {
          selected.value = items.value[idx]
        }
      }
    },
  )
}

// ── 前端筛选 ──────────────────────────────────────────
const filteredStocks = computed(() => {
  if (!currentReport.value) return []
  return currentReport.value.stocks.filter(s => {
    if (filterMarket.value   && s.market   !== filterMarket.value)   return false
    if (filterHorizon.value  && s.horizon  !== filterHorizon.value)  return false
    if (filterStrength.value && s.strength !== filterStrength.value) return false
    return true
  })
})

// ── 样式辅助 ──────────────────────────────────────────
function marketStyle(market: string) {
  const map: Record<string, string> = {
    '主板':   'background:#eff6ff;color:#1e40af;',
    '创业板': 'background:#fdf4ff;color:#6b21a8;',
    '科创板': 'background:#fff7ed;color:#c2410c;',
    '北交所': 'background:#f0fdf4;color:#166534;',
  }
  return map[market] ?? 'background:#f9fafb;color:#6b7280;'
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── 初始化 ────────────────────────────────────────────
onMounted(async () => {
  await load()
  if (items.value.length) selectItem(items.value[0])
})
</script>
