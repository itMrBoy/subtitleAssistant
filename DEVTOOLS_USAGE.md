# Chrome DevTools API 使用说明

## 问题解决

### ❌ 之前的错误做法
在 `content.tsx` 或 `serviceWorker.ts` 中直接调用：
```javascript
chrome.devtools.network.onRequestFinished.addListener(...)  // ❌ 返回 undefined
```

### ✅ 正确的解决方案

`chrome.devtools.network` API **只能在 DevTools 页面环境中使用**，不能在以下环境中使用：
- Content Scripts
- Background Scripts/Service Workers
- Popup 页面
- Options 页面

## 新的实现架构

### 1. DevTools 页面 (`src/devtools/devtools.ts`)
- ✅ 可以使用 `chrome.devtools.network` API
- 监控网络请求
- 检测字幕相关的API调用
- 通过 `chrome.devtools.inspectedWindow.eval()` 向页面发送消息

### 2. Content Script (`src/content/content.tsx`)
- 监听来自 DevTools 的 `window.postMessage` 消息
- 接收字幕请求检测通知
- 显示用户通知

### 3. DevTools 面板 (`src/devtools/panel.html`)
- 提供可视化界面
- 显示检测到的字幕请求日志
- 实时更新网络活动

## 如何使用

### 1. 安装扩展
```bash
npm run build
```

### 2. 加载到Chrome
1. 打开 `chrome://extensions/`
2. 启用"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `dist` 文件夹

### 3. 使用网络监控功能
1. 打开YouTube页面
2. 按 `F12` 打开开发者工具
3. 在DevTools中找到 **"YouTube字幕助手"** 面板
4. 播放视频，面板会显示检测到的字幕请求

### 4. 查看日志
- DevTools控制台：查看详细的网络请求信息
- 字幕助手面板：查看格式化的字幕请求列表
- 页面通知：Content Script会显示简单的通知消息

## API 环境对照表

| 环境 | chrome.devtools.network | chrome.runtime | chrome.tabs |
|------|------------------------|----------------|-------------|
| DevTools页面 | ✅ 可用 | ✅ 可用 | ❌ 不可用 |
| Content Script | ❌ 不可用 | ✅ 可用 | ❌ 不可用 |
| Service Worker | ❌ 不可用 | ✅ 可用 | ✅ 可用 |
| Popup | ❌ 不可用 | ✅ 可用 | ✅ 可用 |

## 通信流程

```
YouTube页面 → DevTools监听网络 → 检测字幕请求 → 发送消息到页面 → Content Script接收 → 显示通知
```

这样的架构确保了网络监控功能在正确的环境中运行，同时保持了良好的用户体验。