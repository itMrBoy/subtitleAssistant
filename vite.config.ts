import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.config.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), crx({ manifest })],
  server: {
    cors: {
      origin: [
        /chrome-extension:\/\//,
      ],
    },
    // 减少热重载频率
    hmr: {
      overlay: false
    },
    // 监听所有相关文件，包括dist目录
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        // 移除对dist目录的忽略，允许热更新
        // '**/dist/**',
      ]
    }
  },
  // 配置 public 目录
  publicDir: 'icons', // 默认值，可以改为其他目录名
  build: {
    // 输出目录配置
    outDir: 'dist', // 默认值，可以自定义输出目录
    // 是否复制 public 目录到输出目录
    copyPublicDir: true, // 默认值，设为 false 可以禁用复制
    // 优化构建配置
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    },
    // 确保CSS被正确提取
    cssCodeSplit: false
  },
  // CSS处理配置
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  }
})
