import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  devServer: {
    host: '0.0.0.0',
  },
  css: ['./app/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  // 所有 /api/** 全部代理到 Express 后端
  routeRules: {
    '/api/**': { proxy: 'http://localhost:3001/api/**' },
  },

  runtimeConfig: {
    backendUrl: process.env.BACKEND_URL || 'http://localhost:3001',
  },
})
