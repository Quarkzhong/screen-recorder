/**
 * Electron 预加载脚本
 * 通过 contextBridge 安全地暴露 IPC 方法给渲染进程
 */
import { contextBridge, ipcRenderer } from "electron";

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld("electronAPI", {
  // 获取屏幕源列表（用于屏幕录制）
  getSources: (): Promise<{ id: string; name: string; thumbnail: string }[]> =>
    ipcRenderer.invoke("get-sources"),

  // FFmpeg录制控制
  ffmpegStartRecording: (config: any): Promise<boolean> =>
    ipcRenderer.invoke("ffmpeg-start-recording", config),
  ffmpegStopRecording: (): Promise<string | null> =>
    ipcRenderer.invoke("ffmpeg-stop-recording"),
  ffmpegStartReplayBuffer: (config: any): Promise<boolean> =>
    ipcRenderer.invoke("ffmpeg-start-replay-buffer", config),
  ffmpegStopReplayBuffer: (): Promise<void> =>
    ipcRenderer.invoke("ffmpeg-stop-replay-buffer"),
  ffmpegSaveReplay: (config: any): Promise<string | null> =>
    ipcRenderer.invoke("ffmpeg-save-replay", config),
  ffmpegTakeScreenshot: (
    sourceId: string,
    savePath: string
  ): Promise<string | null> =>
    ipcRenderer.invoke("ffmpeg-take-screenshot", sourceId, savePath),
  ffmpegGetStatus: (): Promise<{
    isRecording: boolean;
    isReplayBuffering: boolean;
  }> => ipcRenderer.invoke("ffmpeg-get-status"),

  // 选择目录
  selectDir: (): Promise<string | null> => ipcRenderer.invoke("select-dir"),

  // 获取配置
  getConfig: (): Promise<Record<string, unknown>> =>
    ipcRenderer.invoke("get-config"),

  // 保存配置
  saveConfig: (config: Record<string, unknown>): Promise<boolean> =>
    ipcRenderer.invoke("save-config", config),

  // 获取应用名称
  getAppName: (): Promise<string> => ipcRenderer.invoke("get-app-name"),

  // 获取系统硬件信息
  getSystemInfo: (): Promise<any> => ipcRenderer.invoke("get-system-info"),

  // 获取实时系统资源使用率
  getSystemUsage: (): Promise<any> => ipcRenderer.invoke("get-system-usage"),

  // 获取磁盘空间信息
  getDiskInfo: (path: string): Promise<any> =>
    ipcRenderer.invoke("get-disk-info", path),

  // 获取默认保存路径
  getDefaultPath: (): Promise<string> => ipcRenderer.invoke("get-default-path"),

  // 显示保存对话框
  showSaveDialog: (options: {
    defaultPath: string;
    filters: { name: string; extensions: string[] }[];
  }): Promise<string | null> => ipcRenderer.invoke("show-save-dialog", options),

  // 直接保存文件（不弹出对话框）
  saveFile: (options: {
    filePath: string;
    data: number[];
  }): Promise<{ success: boolean; path?: string; error?: string }> =>
    ipcRenderer.invoke("save-file", options),

  // 获取系统主题
  getSystemTheme: (): Promise<"dark" | "light"> =>
    ipcRenderer.invoke("get-system-theme"),

  // 监听系统主题变化
  onThemeChanged: (callback: (theme: "dark" | "light") => void): void => {
    ipcRenderer.on("theme-changed", (_, theme) => callback(theme));
  },

  // 更新录制状态到主进程
  updateRecordingStatus: (status: {
    isRecording: boolean;
    isReplay: boolean;
  }): void => {
    ipcRenderer.send("recording-status", status);
  },

  // 窗口控制
  minimizeWindow: (): void => ipcRenderer.send("window-minimize"),
  closeWindow: (): void => ipcRenderer.send("window-close"),

  // 监听主进程事件
  onToggleRecording: (callback: () => void): void => {
    ipcRenderer.on("toggle-recording", callback);
  },
  onReplayRecording: (callback: () => void): void => {
    ipcRenderer.on("replay-recording", callback);
  },
  onTakeScreenshot: (callback: () => void): void => {
    ipcRenderer.on("take-screenshot", callback);
  },

  // 打开文件/路径
  openPath: (path: string): Promise<string> =>
    ipcRenderer.invoke("open-path", path),

  // 移除事件监听
  removeAllListeners: (channel: string): void => {
    ipcRenderer.removeAllListeners(channel);
  },

  // 更新相关
  checkForUpdates: (): void => ipcRenderer.send("check-for-updates"),
  onUpdateMessage: (callback: (message: string) => void): void => {
    ipcRenderer.on("update-message", (_, message) => callback(message));
  },
  onUpdateProgress: (callback: (percent: number) => void): void => {
    ipcRenderer.on("update-progress", (_, percent) => callback(percent));
  },
});

// TypeScript 类型声明
export interface ScreenSource {
  id: string;
  name: string;
  thumbnail: string;
}

export interface ElectronAPI {
  getSources: () => Promise<ScreenSource[]>;
  selectDir: () => Promise<string | null>;
  openPath: (path: string) => Promise<string>;
  getConfig: () => Promise<Record<string, unknown>>;
  saveConfig: (config: Record<string, unknown>) => Promise<boolean>;
  getDefaultPath: () => Promise<string>;
  showSaveDialog: (options: {
    defaultPath: string;
    filters: { name: string; extensions: string[] }[];
  }) => Promise<string | null>;
  saveFile: (options: {
    filePath: string;
    data: number[];
  }) => Promise<{ success: boolean; path?: string; error?: string }>;
  getSystemTheme: () => Promise<"dark" | "light">;
  onThemeChanged: (callback: (theme: "dark" | "light") => void) => void;
  updateRecordingStatus: (status: {
    isRecording: boolean;
    isReplay: boolean;
  }) => void;
  minimizeWindow: () => void;
  closeWindow: () => void;
  onToggleRecording: (callback: () => void) => void;
  onReplayRecording: (callback: () => void) => void;
  onTakeScreenshot: (callback: () => void) => void;
  removeAllListeners: (channel: string) => void;
  checkForUpdates: () => void;
  onUpdateMessage: (callback: (message: string) => void) => void;
  onUpdateProgress: (callback: (percent: number) => void) => void;

  // FFmpeg相关接口
  ffmpegStartRecording: (config: any) => Promise<boolean>;
  ffmpegStopRecording: () => Promise<string | null>;
  ffmpegStartReplayBuffer: (config: any) => Promise<boolean>;
  ffmpegStopReplayBuffer: () => Promise<void>;
  ffmpegSaveReplay: (config: any) => Promise<string | null>;
  ffmpegTakeScreenshot: (
    sourceId: string,
    savePath: string
  ) => Promise<string | null>;
  ffmpegGetStatus: () => Promise<{
    isRecording: boolean;
    isReplayBuffering: boolean;
  }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
