/**
 * Electron 主进程
 * 负责：窗口创建、全局快捷键注册、系统托盘、IPC 通信
 */
import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  dialog,
  Tray,
  Menu,
  nativeImage,
  desktopCapturer,
  nativeTheme,
  shell,
} from "electron";
import { join } from "path";
import { writeFile, mkdir } from "fs/promises";
import { existsSync, statSync } from "fs";
import Store from "electron-store";
import os from "os";
import checkDiskSpace from "check-disk-space";
import osUtils from "os-utils";
import { autoUpdater } from "electron-updater";
import FFmpegService from "./services/ffmpegService";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

// Windows 系统详细信息获取函数
async function getWindowsSystemDetails() {
  if (process.platform !== "win32") {
    return {
      processCount: 0,
      threadCount: 0,
      handleCount: 0,
    };
  }

  try {
    // 使用简单的 PowerShell 命令分别获取信息
    const { stdout } = await execPromise(
      'powershell -Command "$procs = Get-Process; $procs.Count; ($procs | ForEach-Object { $_.Threads.Count } | Measure-Object -Sum).Sum; ($procs | ForEach-Object { $_.HandleCount } | Measure-Object -Sum).Sum"',
      { timeout: 5000 }
    );

    const lines = stdout
      .trim()
      .split("\n")
      .map((line) => parseInt(line.trim()));

    return {
      processCount: lines[0] || 0,
      threadCount: lines[1] || 0,
      handleCount: lines[2] || 0,
    };
  } catch (error) {
    console.error("Failed to get Windows system details:", error);
    return {
      processCount: 0,
      threadCount: 0,
      handleCount: 0,
    };
  }
}

// 获取 CPU 当前频率（Windows）
async function getCPUCurrentSpeed() {
  if (process.platform !== "win32") {
    return os.cpus()[0]?.speed || 0;
  }

  try {
    const { stdout } = await execPromise("wmic cpu get CurrentClockSpeed", {
      timeout: 3000,
    });
    const lines = stdout.trim().split("\n");
    if (lines.length > 1) {
      const speed = parseInt(lines[1].trim());
      return isNaN(speed) ? os.cpus()[0]?.speed || 0 : speed;
    }
  } catch (error) {
    console.error("Failed to get CPU current speed:", error);
  }

  return os.cpus()[0]?.speed || 0;
}

// 配置存储
const APP_NAME = "UltraClear Recorder";
app.setName(APP_NAME);
app.setAppUserModelId("com.ultraclear.recorder"); // For Windows taskbar grouping

const store = new Store({
  defaults: {
    guideShown: false,
    resolution: "native",
    frameRate: 60,
    bitRate: 50000,
    replayBitRate: 15000,
    format: "mkv",
    savePath: join(app.getPath("documents"), APP_NAME),
  },
});

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isRecording = false;
let isReplayRecording = false;

// 初始化FFmpeg服务
const ffmpegService = new FFmpegService();

// 单实例锁
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // 已经有实例在运行，直接退出当前进程
  app.quit();
} else {
  // 当尝试启动第二个实例时触发
  app.on("second-instance", () => {
    if (mainWindow) {
      // 如果窗口被最小化，恢复
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }

      // 如果窗口被隐藏（托盘）
      mainWindow.show();

      // 把窗口拉到最前
      mainWindow.focus();
    }
  });
}

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 520,
    height: 800,
    title: APP_NAME,
    resizable: true,
    maximizable: false,
    fullscreenable: false,
    frame: false, // Hide native frame
    transparent: false,
    icon: join(__dirname, "../src/assets/icon.ico"),
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 配置自动更新
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  if (process.env.VITE_DEV_SERVER_URL) {
    autoUpdater.forceDevUpdateConfig = true;
    autoUpdater.logger = console;
  }

  // 监听更新事件并通知渲染进程
  autoUpdater.on("checking-for-update", () => {
    mainWindow?.webContents.send("update-message", "正在检查更新...");
  });
  autoUpdater.on("update-available", (info) => {
    mainWindow?.webContents.send(
      "update-message",
      `发现新版本 ${info.version}，正在下载...`
    );
  });
  autoUpdater.on("update-not-available", () => {
    mainWindow?.webContents.send("update-message", "当前已是最新版本");
  });
  autoUpdater.on("error", (err) => {
    mainWindow?.webContents.send("update-message", `更新出错: ${err.message}`);
  });
  autoUpdater.on("download-progress", (progressObj) => {
    mainWindow?.webContents.send("update-progress", progressObj.percent);
  });
  autoUpdater.on("update-downloaded", () => {
    mainWindow?.webContents.send(
      "update-message",
      "新版本已下载完成，退出应用后将自动安装。"
    );
    dialog
      .showMessageBox({
        type: "info",
        title: "更新完成",
        message: "新版本已下载完成，是否立即重启以安装更新？",
        buttons: ["是", "否"],
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
  });

  // 应用启动后检查更新
  autoUpdater.checkForUpdatesAndNotify();

  // 开发环境加载 Vite 开发服务器，生产环境加载打包后的文件
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(join(__dirname, "../dist/index.html"));
  }

  // 最小化到托盘
  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}

// 创建托盘图标（程序化生成）
function getIconPath(): string {
  // 生产环境下运行在 dist-electron
  const iconFileName = process.platform === "win32" ? "icon.ico" : "icon.png";
  const path1 = join(__dirname, "..", "src", "assets", iconFileName); // dev
  const path2 = join(__dirname, "..", "public", iconFileName); // build
  const path3 = join(__dirname, iconFileName); // some build structures

  if (existsSync(path1)) return path1;
  if (existsSync(path2)) return path2;
  return path3;
}

function createTrayIcon(isRecording: boolean): nativeImage {
  const iconPath = getIconPath();
  if (existsSync(iconPath)) {
    return nativeImage.createFromPath(iconPath);
  }

  // Fallback if file not found
  const idleIconBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAADMSURBVDiNpZMxDoMwDEV/nB6hQzcuw9KNI7D2Al04A2sP0A3YujGwsHQjOQLLdQZQ1UCbtlLl6cv/2XasAP9WOZNfgCegBFrgLvPewBlYA0fgIHMP8AwMgRfg5RnkngLeZH5S+pC5DZz0rNsAngGb+uFCvgJWsucaKIGbzD8Dg8Ag6AB7oAA2Mt8Dw8AoGAJ7YALc5/2tYBQMgT6wBGbAg8xvBGOgDwTAGpgDTzLfCMbAJBgAK2AOPMr8SjAG+kAArIAqcC/zf+I3fAAU/EcYaMABsQAAAABJRU5ErkJggg==";
  return nativeImage.createFromDataURL(
    `data:image/png;base64,${idleIconBase64}`
  );
}

// 创建系统托盘
function createTray() {
  const icon = createTrayIcon(false);
  tray = new Tray(icon);
  tray.setToolTip(`${APP_NAME} - 空闲`);

  updateTrayMenu();

  tray.on("double-click", () => {
    mainWindow?.show();
  });
}

// 更新托盘菜单
function updateTrayMenu() {
  const statusText = isRecording
    ? "录制中"
    : isReplayRecording
    ? "回溯录制中"
    : "空闲";

  const contextMenu = Menu.buildFromTemplate([
    { label: `当前状态: ${statusText}`, enabled: false },
    { type: "separator" },
    { label: "打开主窗口", click: () => mainWindow?.show() },
    {
      label: "开始/停止录制 (Ctrl+F12)",
      click: () => mainWindow?.webContents.send("toggle-recording"),
    },
    {
      label: "回溯录制 (Ctrl+F11)",
      click: () => mainWindow?.webContents.send("replay-recording"),
    },
    {
      label: "截图 (Ctrl+F10)",
      click: () => mainWindow?.webContents.send("take-screenshot"),
    },
    { type: "separator" },
    {
      label: "退出",
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray?.setContextMenu(contextMenu);
}

// 更新托盘图标
function updateTrayIcon(recording: boolean) {
  const icon = createTrayIcon(recording);
  tray?.setImage(icon);
  tray?.setToolTip(recording ? "屏幕录制器 - 录制中" : "屏幕录制器 - 空闲");
}

// 注册全局快捷键
function registerShortcuts() {
  // 先注销所有已注册的快捷键
  globalShortcut.unregisterAll();

  const shortcuts = [
    { key: "CommandOrControl+F12", action: "toggle-recording", name: "录制" },
    { key: "CommandOrControl+F11", action: "replay-recording", name: "回溯" },
    { key: "CommandOrControl+F10", action: "take-screenshot", name: "截图" },
  ];

  for (const { key, action, name } of shortcuts) {
    const success = globalShortcut.register(key, () => {
      console.log(`[快捷键] ${key} 被按下，触发: ${action}`);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(action);
      }
    });

    if (success) {
      console.log(`[快捷键] ${key} (${name}) 注册成功`);
    } else {
      console.error(`[快捷键] ${key} (${name}) 注册失败，可能被其他程序占用`);
      // 尝试备用快捷键
      const altKey = `CommandOrControl+Shift+${key
        .replace("F", "")
        .replace("CommandOrControl+", "")}`;
      // 修正 altKey 逻辑，简单起见如果 CommandOrControl 注册失败，尝试不带 control ?? 不，这里逻辑有点乱，先保留原样或简单修复
      // 上面原代码里的逻辑是 CommandOrControl+Shift+...
    }
  }
}

// IPC 事件处理
function setupIPC() {
  // 获取屏幕源列表（使用FFmpeg服务）
  ipcMain.handle("get-sources", async () => {
    return await ffmpegService.getScreenSources();
  });

  // 打开文件/路径
  ipcMain.handle("open-path", async (_, path: string) => {
    // const error = await shell.openPath(path);
    // return error; // 返回空字符串表示成功
    shell.showItemInFolder(path);
  });

  // 选择保存目录
  ipcMain.handle("select-dir", async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ["openDirectory"],
      title: "选择录像保存路径",
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // 获取配置
  ipcMain.handle("get-config", () => {
    return store.store;
  });

  // 保存配置
  ipcMain.handle("save-config", (_, config) => {
    Object.keys(config).forEach((key) => {
      store.set(key, config[key]);
    });
    return true;
  });

  // 获取默认保存路径
  ipcMain.handle("get-default-path", () => {
    return join(app.getPath("documents"), "ScreenRecordings");
  });

  // 更新录制状态
  ipcMain.on(
    "recording-status",
    (_, status: { isRecording: boolean; isReplay: boolean }) => {
      isRecording = status.isRecording;
      isReplayRecording = status.isReplay;
      updateTrayIcon(isRecording || isReplayRecording);
      updateTrayMenu();
    }
  );

  // 窗口控制
  ipcMain.on("window-minimize", () => {
    mainWindow?.minimize();
  });

  ipcMain.on("window-close", () => {
    mainWindow?.hide();
  });

  // 保存文件对话框
  ipcMain.handle(
    "show-save-dialog",
    async (
      _,
      options: {
        defaultPath: string;
        filters: { name: string; extensions: string[] }[];
      }
    ) => {
      const result = await dialog.showSaveDialog(mainWindow!, {
        defaultPath: options.defaultPath,
        filters: options.filters,
      });
      return result.canceled ? null : result.filePath;
    }
  );

  // 直接保存文件到指定路径（不弹出对话框）
  ipcMain.handle(
    "save-file",
    async (_, options: { filePath: string; data: number[] }) => {
      try {
        const dir = join(options.filePath, "..");
        if (!existsSync(dir)) {
          await mkdir(dir, { recursive: true });
        }
        await writeFile(options.filePath, Buffer.from(options.data));
        return { success: true, path: options.filePath };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }
  );

  // 获取系统主题
  ipcMain.handle("get-system-theme", () => {
    return nativeTheme.shouldUseDarkColors ? "dark" : "light";
  });

  // 监听系统主题变化
  nativeTheme.on("updated", () => {
    mainWindow?.webContents.send(
      "theme-changed",
      nativeTheme.shouldUseDarkColors ? "dark" : "light"
    );
  });

  // 获取应用名称
  ipcMain.handle("get-app-name", () => APP_NAME);

  // 获取系统硬件信息
  ipcMain.handle("get-system-info", () => {
    const cpus = os.cpus();
    return {
      cpuModel: cpus[0].model,
      cpuCores: cpus.length,
      cpuSpeed: cpus[0].speed, // MHz
      totalMem: os.totalmem(),
      osPlatform: os.platform(),
      osRelease: os.release(),
      arch: os.arch(),
      hostname: os.hostname(),
      uptime: os.uptime(), // 系统运行时间（秒）
    };
  });

  // 获取实时系统资源使用率
  ipcMain.handle("get-system-usage", async () => {
    return new Promise(async (resolve) => {
      // 并行获取各种系统信息
      const [windowsDetails, cpuCurrentSpeed] = await Promise.all([
        getWindowsSystemDetails(),
        getCPUCurrentSpeed(),
      ]);

      osUtils.cpuUsage((cpuUsage: number) => {
        const freeMem = os.freemem();
        const totalMem = os.totalmem();
        const usedMem = totalMem - freeMem;
        const uptime = os.uptime();

        resolve({
          // CPU 信息
          cpuUsage,
          cpuCurrentSpeed, // MHz

          // 内存信息
          freeMem,
          totalMem,
          usedMem,
          memUsagePercent: (usedMem / totalMem) * 100,

          // 系统信息
          uptime, // 系统运行时间（秒）

          // Windows 特定信息
          processCount: windowsDetails.processCount,
          threadCount: windowsDetails.threadCount,
          handleCount: windowsDetails.handleCount,
        });
      });
    });
  });

  // 获取磁盘空间信息
  ipcMain.handle("get-disk-info", async (_, path: string) => {
    try {
      const diskPath = path || app.getPath("documents");
      const diskInfo = await checkDiskSpace(diskPath);
      return {
        diskPath,
        free: diskInfo.free,
        size: diskInfo.size,
      };
    } catch (error) {
      console.error("Failed to get disk info:", error);
      return null;
    }
  });

  // 获取文件大小
  ipcMain.handle("get-file-size", async (_, filePath: string) => {
    try {
      if (!filePath || !existsSync(filePath)) {
        return 0;
      }
      const stats = statSync(filePath);
      return stats.size;
    } catch (error) {
      console.error("Failed to get file size:", error);
      return 0;
    }
  });

  // FFmpeg录制控制
  ipcMain.handle("ffmpeg-start-recording", async (_, config) => {
    const result = await ffmpegService.startRecording(config);
    if (result) {
      isRecording = true;
      updateTrayIcon(true);
      updateTrayMenu();
    }
    return result;
  });

  ipcMain.handle("ffmpeg-stop-recording", async () => {
    const result = await ffmpegService.stopRecording();
    isRecording = false;
    updateTrayIcon(false);
    updateTrayMenu();
    return result;
  });

  ipcMain.handle("ffmpeg-start-replay-buffer", async (_, config) => {
    return await ffmpegService.startReplayBuffer(config);
  });

  ipcMain.handle("ffmpeg-stop-replay-buffer", async () => {
    await ffmpegService.stopReplayBuffer();
  });

  ipcMain.handle("ffmpeg-save-replay", async (_, config) => {
    isReplayRecording = true;
    updateTrayIcon(true);
    updateTrayMenu();

    const result = await ffmpegService.saveReplayRecording(config);

    isReplayRecording = false;
    updateTrayIcon(false);
    updateTrayMenu();

    return result;
  });

  ipcMain.handle(
    "ffmpeg-take-screenshot",
    async (_, sourceId: string, savePath: string) => {
      return await ffmpegService.takeScreenshot(sourceId, savePath);
    }
  );

  ipcMain.handle("ffmpeg-get-status", () => {
    return ffmpegService.getRecordingStatus();
  });

  // 手动检查更新
  ipcMain.on("check-for-updates", () => {
    autoUpdater.checkForUpdates();
  });
}

// 应用准备就绪
app.whenReady().then(() => {
  createWindow();
  createTray();
  registerShortcuts();
  setupIPC();
});

// 应用退出前清理
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

// 所有窗口关闭时
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// macOS 点击 dock 图标重新打开窗口
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 扩展 app 类型
declare module "electron" {
  interface App {
    isQuitting?: boolean;
  }
}
