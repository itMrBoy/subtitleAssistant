import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'youtube字幕提取助手',
  description: '将youtube字幕提取并转换成格式化文档下载到本地',
  version: '1.0.0',
  "icons": {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  action: {
    default_popup: 'index.html',
    default_icon: {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },
  "content_scripts":[
    {
      "js" :["src/content/content.tsx"],
      "matches": ["https://www.youtube.com/*"],
      "run_at": "document_end"
    }
  ],
  "background": {
    "service_worker": "src/background/serviceWorker.ts"
  },
  "permissions": [
    "downloads",
    "contextMenus",
    "storage",
    "tabs"
  ],
  "host_permissions": [
    "https://www.youtube.com/*",
    "http://localhost:5173/*",
    "https://127.0.0.1:5173/*",
    "https://yt2note-production.up.railway.app/*"
  ],
}) 