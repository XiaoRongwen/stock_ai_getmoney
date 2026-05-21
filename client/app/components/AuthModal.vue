<template>
  <!-- 遮罩 -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style="background:rgba(0,0,0,.45);"
        @click.self="$emit('update:modelValue', false)">

        <Transition name="scale">
          <div v-if="modelValue"
            class="w-full max-w-sm rounded-2xl bg-white overflow-hidden"
            style="box-shadow:0 20px 60px rgba(0,0,0,.2);">

            <!-- 顶部品牌区 -->
            <div class="px-6 pt-7 pb-5 text-center" style="background:linear-gradient(135deg,#fff8f8,#fff);">
              <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl text-white text-lg font-bold mb-3"
                style="background:linear-gradient(135deg,#c0392b,#e74c3c);">AI</div>
              <h2 class="text-lg font-bold" style="color:#1a1a2e;">智投雷达</h2>
              <p class="text-xs mt-1" style="color:#9ca3af;">登录后解锁 AI 分析功能</p>
            </div>

            <!-- Tab 切换 -->
            <div class="flex border-b" style="border-color:#f3f4f6;">
              <button
                v-for="tab in ['登录', '注册']" :key="tab"
                class="flex-1 py-3 text-sm font-medium transition-colors"
                :style="activeTab === tab
                  ? 'color:#c0392b; border-bottom:2px solid #c0392b; margin-bottom:-1px;'
                  : 'color:#9ca3af;'"
                @click="activeTab = tab; error = ''">
                {{ tab }}
              </button>
            </div>

            <!-- 表单 -->
            <div class="px-6 py-5 space-y-3">
              <div>
                <label class="block text-xs font-medium mb-1.5" style="color:#374151;">用户名</label>
                <input v-model="form.username" type="text" placeholder="请输入用户名"
                  class="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all"
                  style="border:1px solid #e5e7eb; color:#1a1a2e;"
                  :style="focusField === 'username' ? 'border-color:#c0392b; box-shadow:0 0 0 3px rgba(192,57,43,.08);' : ''"
                  @focus="focusField = 'username'" @blur="focusField = ''"
                  @keyup.enter="submit" />
              </div>
              <div>
                <label class="block text-xs font-medium mb-1.5" style="color:#374151;">密码</label>
                <div class="relative">
                  <input v-model="form.password" :type="showPwd ? 'text' : 'password'" placeholder="请输入密码"
                    class="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all pr-10"
                    style="border:1px solid #e5e7eb; color:#1a1a2e;"
                    :style="focusField === 'password' ? 'border-color:#c0392b; box-shadow:0 0 0 3px rgba(192,57,43,.08);' : ''"
                    @focus="focusField = 'password'" @blur="focusField = ''"
                    @keyup.enter="submit" />
                  <button class="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                    style="color:#9ca3af;" @click="showPwd = !showPwd">
                    {{ showPwd ? '隐藏' : '显示' }}
                  </button>
                </div>
              </div>

              <!-- 错误提示 -->
              <div v-if="error" class="text-xs px-3 py-2 rounded-lg" style="background:#fff1f0;color:#e03131;">
                {{ error }}
              </div>

              <!-- 提交按钮 -->
              <button
                class="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity mt-1"
                style="background:linear-gradient(135deg,#c0392b,#e74c3c);"
                :class="loading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'"
                :disabled="loading"
                @click="submit">
                <span v-if="loading">处理中...</span>
                <span v-else>{{ activeTab === '登录' ? '登录' : '注册账号' }}</span>
              </button>
            </div>

            <!-- VIP 提示 -->
            <div class="mx-6 mb-5 px-4 py-3 rounded-xl" style="background:#fffbeb; border:1px solid #fde68a;">
              <div class="flex items-start gap-2">
                <span class="text-base shrink-0">👑</span>
                <div class="text-xs leading-relaxed" style="color:#92400e;">
                  <strong>VIP 会员</strong> 可无限使用 AI 分析、发送消息、生成报告等高级功能。
                  普通用户每日限 3 次。
                </div>
              </div>
            </div>

          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

const { setAuth } = useAuth()

const activeTab = ref('登录')
const focusField = ref('')
const showPwd = ref(false)
const loading = ref(false)
const error = ref('')

const form = reactive({ username: '', password: '' })

async function submit() {
  error.value = ''
  if (!form.username || !form.password) {
    error.value = '请填写用户名和密码'
    return
  }
  loading.value = true
  try {
    const endpoint = activeTab.value === '登录' ? '/api/user/login' : '/api/user/register'
    const res = await $fetch<any>(endpoint, {
      method: 'POST',
      body: { username: form.username, password: form.password },
    })
    if (activeTab.value === '登录') {
      // 登录成功，拿 token 再获取用户信息
      setAuth(res.data.token, res.data.user ?? { id: 0, username: form.username, role: 'user' })
      emit('update:modelValue', false)
    } else {
      // 注册成功，切换到登录
      activeTab.value = '登录'
      error.value = ''
    }
  } catch (e: any) {
    error.value = e?.data?.message ?? '请求失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.scale-enter-active, .scale-leave-active { transition: all .2s cubic-bezier(.34,1.56,.64,1); }
.scale-enter-from, .scale-leave-to { opacity: 0; transform: scale(.92); }
</style>
