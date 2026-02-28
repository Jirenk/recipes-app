import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // 部署到 GitHub Pages 时，将此改为 '/你的仓库名/'
  // 例如：base: '/recipes-app/'
  base: '/recipes-app/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '私房菜谱',
        short_name: '菜谱',
        description: '个人菜谱手机查阅工具',
        theme_color: '#E8634B',
        background_color: '#FAF8F5',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: './icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: './icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /\/recipes\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'recipes-cache',
              expiration: { maxEntries: 200 },
            },
          },
        ],
      },
    }),
  ],
})
