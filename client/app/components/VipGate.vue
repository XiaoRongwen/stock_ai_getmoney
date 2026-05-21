<template>
  <!-- VIP 可用：直接显示内容 -->
  <slot v-if="isVip" />

  <!-- 未登录 -->
  <div v-else-if="!isLoggedIn"
    class="flex flex-col items-center justify-center gap-3 py-8 px-4 rounded-xl text-center"
    style="background:#f9fafb; border:1px dashed #e5e7eb;">
    <span class="text-3xl">🔒</span>
    <div>
      <p class="text-sm font-medium" style="color:#374151;">请先登录</p>
      <p class="text-xs mt-1" style="color:#9ca3af;">登录后可使用 AI 分析功能</p>
    </div>
    <button
      class="px-4 py-2 rounded-lg text-xs font-semibold text-white"
      style="background:linear-gradient(135deg,#c0392b,#e74c3c);"
      @click="$emit('login')">
      立即登录
    </button>
  </div>

  <!-- 已登录但非 VIP -->
  <div v-else
    class="flex flex-col items-center justify-center gap-3 py-8 px-4 rounded-xl text-center"
    style="background:linear-gradient(135deg,#fffbeb,#fff); border:1px dashed #fde68a;">
    <span class="text-3xl">👑</span>
    <div>
      <p class="text-sm font-semibold" style="color:#92400e;">此功能仅限 VIP 会员</p>
      <p class="text-xs mt-1" style="color:#b45309;">升级 VIP 后可无限使用 AI 分析、发送消息、生成报告</p>
    </div>
    <div class="flex items-center gap-2">
      <div class="text-xs px-3 py-1.5 rounded-lg" style="background:#f3f4f6;color:#6b7280;">
        今日剩余 <strong style="color:#e03131;">{{ remaining }}</strong> 次免费额度
      </div>
      <button class="px-4 py-1.5 rounded-lg text-xs font-semibold text-white"
        style="background:linear-gradient(135deg,#d97706,#f59e0b);">
        升级 VIP
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{ login: [] }>()
defineProps<{ remaining?: number }>()

const { isLoggedIn, isVip } = useAuth()
</script>
