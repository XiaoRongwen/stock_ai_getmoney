<template>
  <div class="relative" ref="avatarRef">
    <!-- 未登录：登录按钮 -->
    <button v-if="!isLoggedIn"
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90"
      style="background:linear-gradient(135deg,#c0392b,#e74c3c);"
      @click="$emit('login')">
      登录 / 注册
    </button>

    <!-- 已登录：头像 -->
    <button v-else
      class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors hover:bg-gray-50"
      style="border:1px solid #e5e7eb;"
      @click="dropdownOpen = !dropdownOpen">
      <!-- 头像圆圈 -->
      <div class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
        :style="isVip ? 'background:linear-gradient(135deg,#d97706,#f59e0b);' : 'background:linear-gradient(135deg,#c0392b,#e74c3c);'">
        {{ user?.username?.[0]?.toUpperCase() }}
      </div>
      <span class="text-xs font-medium hidden sm:block" style="color:#374151;">{{ user?.username }}</span>
      <!-- VIP 徽章 -->
      <span v-if="isVip"
        class="text-xs px-1.5 py-0.5 rounded font-bold hidden sm:block"
        style="background:linear-gradient(135deg,#fef3c7,#fde68a);color:#92400e;">
        👑 VIP
      </span>
      <svg class="w-3 h-3 hidden sm:block" style="color:#9ca3af;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
      </svg>
    </button>

    <!-- 下拉菜单 -->
    <Transition name="dropdown">
      <div v-if="dropdownOpen && isLoggedIn"
        class="absolute right-0 top-full mt-2 w-52 rounded-xl bg-white overflow-hidden z-50"
        style="border:1px solid #e5e7eb; box-shadow:0 8px 24px rgba(0,0,0,.1);">

        <!-- 用户信息头 -->
        <div class="px-4 py-3.5" style="background:linear-gradient(135deg,#fff8f8,#fff); border-bottom:1px solid #f3f4f6;">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold"
              :style="isVip ? 'background:linear-gradient(135deg,#d97706,#f59e0b);' : 'background:linear-gradient(135deg,#c0392b,#e74c3c);'">
              {{ user?.username?.[0]?.toUpperCase() }}
            </div>
            <div>
              <div class="text-sm font-semibold" style="color:#1a1a2e;">{{ user?.username }}</div>
              <div v-if="isVip" class="text-xs" style="color:#d97706;">👑 VIP 会员</div>
              <div v-else class="text-xs" style="color:#9ca3af;">普通用户</div>
            </div>
          </div>
          <!-- VIP 升级提示 -->
          <div v-if="!isVip" class="mt-2.5 px-3 py-2 rounded-lg text-xs cursor-pointer transition-opacity hover:opacity-80"
            style="background:linear-gradient(135deg,#fef3c7,#fde68a);color:#92400e;">
            👑 升级 VIP，解锁无限 AI 分析
          </div>
        </div>

        <!-- 菜单项 -->
        <div class="py-1.5">
          <button class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors hover:bg-gray-50"
            style="color:#374151;">
            <span>👤</span> 个人中心
          </button>
          <button class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors hover:bg-gray-50"
            style="color:#374151;">
            <span>⚙️</span> 设置
          </button>
          <div style="border-top:1px solid #f3f4f6; margin:4px 0;"></div>
          <button class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors hover:bg-red-50"
            style="color:#e03131;"
            @click="handleLogout">
            <span>🚪</span> 退出登录
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
defineEmits<{ login: [] }>()

const { user, isLoggedIn, isVip, logout } = useAuth()
const dropdownOpen = ref(false)
const avatarRef = ref<HTMLElement>()

function handleLogout() {
  logout()
  dropdownOpen.value = false
}

// 点击外部关闭
onMounted(() => {
  document.addEventListener('click', (e) => {
    if (avatarRef.value && !avatarRef.value.contains(e.target as Node)) {
      dropdownOpen.value = false
    }
  })
})
</script>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active { transition: all .15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
