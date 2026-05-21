<template>
  <div class="min-h-screen flex flex-col" style="background:#f0f2f5;">

    <!-- ── 顶部导航栏 ── -->
    <header class="sticky top-0 z-50 bg-white" style="border-bottom:1px solid #e8e8e8; box-shadow:0 1px 4px rgba(0,0,0,.06);">

      <!-- 第一行：品牌 + 指数 + 工具 -->
      <div class="flex items-center justify-between px-4 md:px-6" style="height:52px;">

        <!-- 左：Logo -->
        <div class="flex items-center gap-2.5 shrink-0">
          <div class="flex items-center justify-center w-8 h-8 rounded-md text-white text-xs font-bold"
            style="background:linear-gradient(135deg,#c0392b,#e74c3c);">AI</div>
          <div class="hidden sm:block">
            <div class="font-bold text-sm leading-tight" style="color:#1a1a2e;">智投雷达</div>
            <div class="text-xs leading-tight" style="color:#9ca3af;">AI 驱动的市场分析平台</div>
          </div>
          <div class="sm:hidden font-bold text-sm" style="color:#1a1a2e;">智投雷达</div>
        </div>

        <!-- 中：实时指数（移动端只显示两个） -->
        <div class="flex items-center gap-3 md:gap-6 overflow-x-auto no-scrollbar">
          <div v-for="(idx, i) in indices" :key="idx.name"
            class="flex items-center gap-1.5 text-xs shrink-0"
            :class="i >= 2 ? 'hidden md:flex' : 'flex'">
            <span class="hidden sm:inline" style="color:#6b7280;">{{ idx.name }}</span>
            <span class="sm:hidden text-xs font-medium" style="color:#6b7280;">{{ idx.short }}</span>
            <span class="font-semibold tabular-nums" :style="{ color: idx.change >= 0 ? '#e03131' : '#2f9e44' }">
              {{ idx.value }}
            </span>
            <span class="px-1 py-0.5 rounded text-xs font-medium tabular-nums"
              :style="idx.change >= 0 ? 'background:#fff1f0;color:#e03131;' : 'background:#f0fdf4;color:#2f9e44;'">
              {{ idx.change >= 0 ? '▲' : '▼' }}{{ Math.abs(idx.change) }}%
            </span>
          </div>
        </div>

        <!-- 右：状态 + 时间 + 用户 + 移动端菜单按钮 -->
        <div class="flex items-center gap-2 shrink-0">
          <div class="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
            style="background:#fff1f0;color:#e03131;border:1px solid #fecaca;">
            <span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background:#e03131;"></span>
            交易中
          </div>
          <div class="hidden md:block text-xs font-mono px-2.5 py-1 rounded-full"
            style="background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb;">
            {{ currentTime }}
          </div>
          <!-- 用户头像/登录按钮 -->
          <UserAvatar @login="authModalOpen = true" />
          <!-- 移动端汉堡菜单 -->
          <button class="md:hidden p-2 rounded-lg" style="color:#6b7280;"
            @click="mobileMenuOpen = !mobileMenuOpen">
            <svg v-if="!mobileMenuOpen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 第二行：Tab 导航（桌面端） -->
      <div class="hidden md:flex items-end px-6 gap-1" style="border-top:1px solid #f3f4f6;">
        <NuxtLink
          v-for="item in navItems" :key="item.path" :to="item.path"
          class="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors relative"
          :style="$route.path === item.path ? 'color:#c0392b;' : 'color:#6b7280;'"
          style="text-decoration:none;"
          @click="mobileMenuOpen = false"
        >
          <span>{{ item.icon }}</span>
          <span>{{ item.label }}</span>
          <span v-if="$route.path === item.path"
            class="absolute bottom-0 left-0 right-0 h-0.5 rounded-t" style="background:#c0392b;"></span>
        </NuxtLink>
      </div>

      <!-- 移动端下拉菜单 -->
      <Transition name="slide-down">
        <div v-if="mobileMenuOpen" class="md:hidden border-t" style="border-color:#f3f4f6; background:#fff;">
          <NuxtLink
            v-for="item in navItems" :key="item.path" :to="item.path"
            class="flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors"
            :style="$route.path === item.path
              ? 'color:#c0392b; background:#fff8f8;'
              : 'color:#374151;'"
            style="text-decoration:none; border-bottom:1px solid #f9fafb;"
            @click="mobileMenuOpen = false"
          >
            <span>{{ item.icon }}</span>
            <div>
              <div>{{ item.label }}</div>
              <div class="text-xs mt-0.5" style="color:#9ca3af;">{{ item.desc }}</div>
            </div>
            <span v-if="$route.path === item.path" class="ml-auto w-1.5 h-1.5 rounded-full" style="background:#c0392b;"></span>
          </NuxtLink>
        </div>
      </Transition>
    </header>

    <!-- ── 移动端底部 Tab 栏 ── -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white flex"
      style="border-top:1px solid #e8e8e8; box-shadow:0 -2px 8px rgba(0,0,0,.06); padding-bottom:env(safe-area-inset-bottom);">
      <NuxtLink
        v-for="item in navItems" :key="item.path" :to="item.path"
        class="flex-1 flex flex-col items-center justify-center py-2 text-xs transition-colors"
        :style="$route.path === item.path ? 'color:#c0392b;' : 'color:#9ca3af;'"
        style="text-decoration:none;"
        @click="mobileMenuOpen = false"
      >
        <span class="text-lg leading-none mb-0.5">{{ item.icon }}</span>
        <span class="text-xs leading-tight">{{ item.shortLabel }}</span>
      </NuxtLink>
    </nav>

    <!-- ── 副标题栏（桌面端） ── -->
    <div v-if="currentPage" class="hidden md:flex items-center justify-between px-6 py-2.5 bg-white"
      style="border-bottom:1px solid #e8e8e8;">
      <div class="flex items-center gap-3">
        <div class="w-1 h-4 rounded-full" style="background:#c0392b;"></div>
        <span class="text-sm font-semibold" style="color:#1a1a2e;">{{ currentPage.label }}</span>
        <span class="text-xs" style="color:#9ca3af;">{{ currentPage.desc }}</span>
      </div>
      <div class="flex items-center gap-1.5 text-xs" style="color:#9ca3af;">
        <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block"></span>
        数据实时更新
      </div>
    </div>

    <!-- ── 主内容 ── -->
    <!-- 移动端底部留出 Tab 栏高度 -->
    <main class="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
      <slot />
    </main>

    <!-- 登录弹窗 -->
    <AuthModal v-model="authModalOpen" />

  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const mobileMenuOpen = ref(false)
const authModalOpen = ref(false)

const { init } = useAuth()
onMounted(() => init())

// 路由切换时关闭菜单
watch(() => route.path, () => { mobileMenuOpen.value = false })

const navItems = [
  { path: '/',        icon: '⚡', label: '今日实时时讯分析', shortLabel: '实时',   desc: '实时监控市场动态，AI 即时解读' },
  { path: '/news',    icon: '📺', label: '新闻联播分析', shortLabel: '新闻',   desc: '解析新闻联播政策信号' },
  { path: '/midday',  icon: '☀️', label: '午盘分析',     shortLabel: '午盘',   desc: '午盘行情复盘与下午展望' },
  { path: '/morning', icon: '🌅', label: '早间分析',     shortLabel: '早间',   desc: '开盘前市场预判与策略' },
  { path: '/evening', icon: '🌙', label: '晚间复盘',     shortLabel: '复盘',   desc: '全天行情复盘与次日布局' },
]

const currentPage = computed(() => navItems.find(i => i.path === route.path))

const indices = ref([
  { name: '上证指数', short: '上证', value: '--', change: 0 },
  { name: '深证成指', short: '深证', value: '--', change: 0 },
  { name: '创业板指', short: '创业', value: '--', change: 0 },
  { name: '沪深300',  short: '300',  value: '--', change: 0 },
])

// 拉取指数数据，每 15 秒刷新一次
async function fetchIndices() {
  try {
    const data = await $fetch<typeof indices.value>('/api/indices')
    if (data?.length) indices.value = data
  } catch {}
}

onMounted(() => {
  fetchIndices()
  setInterval(fetchIndices, 15000)
})

const currentTime = ref('')
onMounted(() => {
  const tick = () => { currentTime.value = new Date().toLocaleTimeString('zh-CN', { hour12: false }) }
  tick()
  setInterval(tick, 1000)
})</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
