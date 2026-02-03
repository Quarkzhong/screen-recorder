# UltraClear Recorder 技术文档 (Developer & User Guide)

模型名称：Antigravity
模型大小：N/A
模型类型：Agentic AI Coding Assistant
修订版本：2026-02-03

## 1. 项目概览
`UltraClear Recorder` 是一款基于 Electron + Vue 3 + TypeScript 开发的轻量级 Windows 桌面录屏工具。它专注于高画质录制、低资源占用，并提供了独特的“回溯录制”和“一键截图”功能。

### 核心特性
- **高清录制**：支持高达 60fps 录制，自定码率（最高 120Mbps）。
- **回溯录制**：循环记录最近 120 秒的内容，按下快捷键即可保存过去发生的精彩瞬间。
- **系统监控**：实时显示 CPU 使用率、内存占用及磁盘剩余空间。
- **自定义配置**：支持多种视频格式（MP4/MKV/WebM），可自定义保存路径。
- **全局快捷键**：支持录制、回溯、截图的全局快捷键操作。
- **极简设计**：支持深色/浅色模式切换，精致的透明感 UI。

---

## 2. 技术栈
- **Framework**: [Electron 28+](https://www.electronjs.org/)
- **Frontend**: [Vue 3](https://vuejs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: Vanilla CSS (Premium Aesthetics) + [Element Plus](https://element-plus.org/) (UI Components)
- **Store**: [Pinia](https://pinia.vuejs.org/) (State Management)
- **Storage**: [electron-store](https://github.com/sindresorhus/electron-store) (Persistent Configuration)
- **Duration Fix**: `fix-webm-duration` (Fixing missing metadata in WebM/MKV)
- **Monitoring**: `os-utils`, `check-disk-space`

---

## 3. 项目结构
```text
screen-recorder/
├── electron/
│   ├── main.ts         # 主进程：负责窗口管理、IPC 通信、快捷键注册、托盘控制
│   └── preload.ts      # 预加载脚本：暴露安全的 electronAPI 给渲染进程
├── src/
│   ├── components/
│   │   ├── RecorderView.vue   # 主视图：包含录制逻辑、设置界面、系统监控显示
│   │   └── VideoPreview.vue   # 组件：提供屏幕捕获的实时预览画面
│   ├── assets/                # 静态资源（图标等）
│   ├── App.vue                # 入口组件
│   ├── main.ts                # 渲染进程入口
│   └── index.css              # 全局样式与设计系统变量
├── package.json               # 依赖与脚本配置
└── vite.config.mts            # Vite 配置文件
```

---

## 4. 核心逻辑实现 (AI 开发参考)

### 4.1 录制原理
项目使用浏览器原生的 `MediaRecorder` API。由于在 Electron 环境下，通过 `desktopCapturer` 在主进程获取源 ID，传递给渲染进程后，使用 `navigator.mediaDevices.getUserMedia` 获取桌面流。

**流获取约束示例：**
```typescript
const constraints = {
  audio: false,
  video: {
    mandatory: {
      chromeMediaSource: 'desktop',
      chromeMediaSourceId: sourceId,
      minFrameRate: config.frameRate,
      maxFrameRate: 60,
      maxWidth: 7680,
      maxHeight: 4320
    }
  }
}
```

### 4.2 回溯录制 (Replay Buffer)
回溯录制通过开启一个独立的 `MediaRecorder` 持续录制。
- 每隔 1 秒生成一个数据片段（Blob）。
- 将片段存入 `replayBuffer` 数组。
- 定期清理超过 120 秒的旧片段。
- **保存时**：将 Buffer 中所有 Blob 合并为一个大的 Blob 并写入硬盘。

### 4.3 IPC 通信接口 (`electronAPI`)
渲染进程通过 `window.electronAPI` 访问以下核心能力：
- `getSources()`: 获取所有可用屏幕源。
- `saveFile({ filePath, data })`: 将 Uint8Array 数据保存到本地磁盘。
- `getConfig()` / `saveConfig(config)`: 读取/保存用户配置（帧率、格式等）。
- `updateRecordingStatus(status)`: 通知主进程录制状态，用于更新托盘图标。
- `onToggleRecording(callback)`: 监听来自系统托盘或快捷键的录制指令。

### 4.4 快捷键配置
默认全局快捷键：
- **录制/停止**: `Ctrl + F12`
- **回溯录制**: `Ctrl + F11`
- **屏幕截图**: `Ctrl + F10`

---

## 5. 开发建议与扩展
如果您是 AI 或开发者，希望在此基础上增加功能：

1.  **添加音频支持**：
    需要同时捕获系统音频（可以使用第三方库或特定的 Electron 配置）和麦克风音频，并使用 `AudioContext` 进行混音，最后合并到 `MediaStream`。
2.  **区域录制**：
    目前仅支持全屏录制。实现区域录制需要创建一个透明的蒙版窗口供用户选择区域，并对生成的视频进行 `Canvas` 裁剪或利用编码器参数。
3.  **UI 扩展**：
    所有的设计变量（颜色、间距）都定义在 `RecorderView.vue` 的 `:root` 或局部变量中，遵循 `Glassmorphism` (玻璃拟态) 风格。

---

## 6. 用户指南
1.  **开始录制**：点击红色圆形大按钮或按 `Ctrl+F12`。再次点击/按下则停止并保存。
2.  **保存回溯**：如果发生了精彩瞬间但未开启录制，按 `Ctrl+F11` 即可保存过去 2 分钟的内容。
3.  **截图**：点击相机图标或按 `Ctrl+F10`。
4.  **设置**：在下方可以调整帧率和码率。若录制时感到卡顿，建议降低帧率（如 30fps）或降低录制码率。
5.  **查看录像**：点击路径旁的文件夹图标可快速打开保存目录。
