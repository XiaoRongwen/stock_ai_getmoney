export interface UserInfo {
  id: number
  username: string
  role: 'user' | 'vip' | 'admin'
  vipExpiry?: string
}

const user = ref<UserInfo | null>(null)
const token = ref<string | null>(null)

export function useAuth() {
  const isLoggedIn = computed(() => !!user.value)
  const isVip = computed(() => user.value?.role === 'vip' || user.value?.role === 'admin')
  const isAdmin = computed(() => user.value?.role === 'admin')

  function init() {
    if (import.meta.client) {
      const saved = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')
      if (saved && savedUser) {
        token.value = saved
        user.value = JSON.parse(savedUser)
      }
    }
  }

  function setAuth(t: string, u: UserInfo) {
    token.value = t
    user.value = u
    localStorage.setItem('token', t)
    localStorage.setItem('user', JSON.stringify(u))
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { user, token, isLoggedIn, isVip, isAdmin, init, setAuth, logout }
}
