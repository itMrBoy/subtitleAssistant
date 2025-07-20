# YouTube字幕提取助手

一个Chrome浏览器扩展，用于提取YouTube视频的字幕并转换为格式化文档下载到本地。

## 开发环境设置

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

开发服务器将在 `http://localhost:5173` 启动。

### 3. 在Chrome中加载扩展

1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目根目录（包含manifest.json的目录）
6. 扩展将被加载到浏览器中

### 4. 开发模式下的热更新

- 修改源代码后，Vite会自动重新构建
- 在Chrome扩展页面点击"重新加载"按钮来更新扩展
- 或者使用快捷键 `Ctrl+R` 重新加载扩展

## 构建生产版本

```bash
npm run build
```

构建后的文件将输出到 `dist` 目录。

## 项目结构

```
subtitleAssistant/
├── src/
│   ├── App.tsx          # 主应用组件
│   ├── content/         # 内容脚本
│   └── background/      # 后台脚本
├── icons/               # 扩展图标
├── dist/                # 构建输出目录
├── manifest.config.js   # 扩展清单配置
└── vite.config.ts       # Vite配置
```

## 功能特性

- 提取YouTube视频字幕
- 转换为Markdown格式
- 下载到本地文件
- 右键菜单集成

## 技术栈

- React 19
- TypeScript
- Vite
- Chrome Extension Manifest V3
- @crxjs/vite-plugin

## 故障排除

### 开发服务器连接问题

如果遇到"Cannot connect to the Vite Dev Server"错误：

1. 确保开发服务器正在运行（`npm run dev`）
2. 检查端口5173是否被占用
3. 在Chrome扩展页面重新加载扩展

### 热更新不工作

1. 确保vite.config.ts中的watch配置正确
2. 检查文件是否被.gitignore忽略
3. 重启开发服务器

## 许可证

ISC
