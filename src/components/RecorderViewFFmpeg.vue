<template>
  <div :class="['recorder-view', theme]">
    <!-- 顶部标题栏 -->
    <div class="title-bar">
      <div class="app-logo">
        <div class="logo-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="4"
              y="4"
              width="16"
              height="16"
              rx="4"
              stroke="currentColor"
              stroke-width="2"
            />
            <circle cx="12" cy="12" r="4" fill="#ef4444" />
            <path
              d="M12 2v2M12 20v2M2 12h2M20 12h2M6.34 6.34L4.93 4.93M19.07 4.93l-1.41 1.41M6.34 17.66l-1.41 1.41M19.07 19.07l-1.41-1.41"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </div>
        <span>{{ appName }}</span>
      </div>
      <div class="window-controls">
        <button
          class="control-btn theme-toggle"
          @click="toggleTheme"
          :title="theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'"
        >
          <svg v-if="theme === 'dark'" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="5"
              stroke="currentColor"
              stroke-width="2"
            />
            <path
              d="M12 2v2M12 20v2M4 12H2M22 12h-2M6.34 6.34L4.93 4.93M19.07 4.93l-1.41 1.41M6.34 17.66l-1.41 1.41M19.07 19.07l-1.41-1.41"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none">
            <path
              d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <button class="control-btn" @click="checkForUpdates" title="检查更新">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M12 9v4M12 17h.01"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <button class="control-btn" @click="minimizeWindow">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12h14"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
        <button class="control-btn close" @click="closeWindow">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M6 6l12 12M6 18L18 6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- 状态卡片 -->
    <div class="status-card shadow-premium">
      <div class="status-indicator">
        <div class="pulse-ring" v-if="isRecording"></div>
        <div
          class="status-dot"
          :class="{
            recording: isRecording,
            'replay-recording': isReplayRecording,
            idle: !isRecording && !isReplayRecording,
          }"
        ></div>
      </div>
      <div class="status-info">
        <span class="status-text">{{ statusText }}</span>
        <span class="duration" v-if="isRecording || isReplayRecording">
          {{ formatDuration(recordingDuration) }}
        </span>
      </div>
      <div class="main-actions">
        <button
          class="record-btn shadow-glow"
          :class="{ recording: isRecording }"
          @click="toggleRecording"
          :disabled="isStarting"
        >
          <svg viewBox="0 0 24 24" fill="none">
            <template v-if="!isRecording">
              <circle cx="12" cy="12" r="8" fill="currentColor" />
            </template>
            <template v-else>
              <rect
                x="6"
                y="6"
                width="12"
                height="12"
                rx="2"
                fill="currentColor"
              />
            </template>
          </svg>
        </button>
        <button
          class="action-btn secondary shadow-soft"
          @click="takeScreenshot"
          :disabled="isStarting"
        >
          <svg viewBox="0 0 24 24" fill="none">
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="2"
              stroke="currentColor"
              stroke-width="2"
            />
            <circle
              cx="12"
              cy="12"
              r="3"
              stroke="currentColor"
              stroke-width="2"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- 配置表单 -->
    <div class="settings-panel custom-scrollbar">
      <div class="panel-section">
        <h3 class="section-title">录制设置</h3>

        <!-- 屏幕选择 -->
        <div class="setting-item">
          <label class="setting-label">
            <svg class="icon-small" viewBox="0 0 24 24" fill="none">
              <rect
                x="2"
                y="3"
                width="20"
                height="14"
                rx="2"
                stroke="currentColor"
                stroke-width="2"
              />
              <path
                d="M8 21h8M12 17v4"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
            选择录制屏幕
          </label>
          <div class="source-selector" v-if="sources.length > 0">
            <div
              v-for="source in sources"
              :key="source.id"
              class="source-card"
              :class="{ active: config.display_id === source.display_id }"
              @click="selectSource(source.id, source.display_id)"
            >
              <div class="source-thumb">
                <VideoPreview
                  :source-id="source.id"
                  :active="config.sourceId === source.id"
                />
              </div>
              <div class="source-name">{{ source.name }}</div>
            </div>
          </div>
          <div v-else class="source-loading">正在获取屏幕信息...</div>
        </div>

        <!-- 帧率与码率 -->
        <div class="setting-item">
          <label class="setting-label">
            <svg class="icon-small" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
            帧率
            <span class="badge primary">{{ config.frameRate }} fps</span>
          </label>
          <el-slider
            v-model="config.frameRate"
            :min="15"
            :max="60"
            :step="1"
            :marks="{ 15: '15', 30: '30', 45: '45', 60: '60' }"
            :disabled="isRecording"
          />
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <svg class="icon-small" viewBox="0 0 24 24" fill="none">
              <path
                d="M22 12h-4l-3 9L9 3l-3 9H2"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            录制码率
            <span class="badge primary">{{
              formatBitrate(config.bitRate)
            }}</span>
            <span class="size-estimate">≈ {{ estimatedSizePerMin }}/min</span>
          </label>
          <el-slider
            v-model="config.bitRate"
            :min="5000"
            :max="120000"
            :step="5000"
            :disabled="isRecording"
            :marks="{
              5000: '5M',
              50000: '50M',
              100000: '100M',
              120000: '120M',
            }"
          />
        </div>

        <!-- 回溯设置 -->
        <div class="sub-section">
          <h4 class="sub-title">回溯设置 (降低画质以减少卡顿)</h4>
          <div class="setting-item">
            <label class="setting-label">
              <svg class="icon-small" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              回溯码率
              <span class="badge primary">{{
                formatBitrate(config.replayBitRate)
              }}</span>
              <span class="size-estimate"
                >≈ {{ estimatedReplaySizePerMin }}/min</span
              >
            </label>
            <el-slider
              v-model="config.replayBitRate"
              :min="1000"
              :max="50000"
              :step="1000"
              :disabled="isRecording"
              :marks="{ 1000: '1M', 25000: '25M', 50000: '50M' }"
            />
          </div>
        </div>

        <!-- 保存设置 -->
        <div class="setting-item">
          <label class="setting-label">
            <svg class="icon-small" viewBox="0 0 24 24" fill="none">
              <path
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                fill="currentColor"
              />
              <path
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="currentColor"
                stroke-width="2"
              />
            </svg>
            编码格式
          </label>
          <div class="format-group">
            <button
              v-for="fmt in ['mp4', 'mkv', 'webm']"
              :key="fmt"
              class="format-btn"
              :class="{ active: config.format === fmt }"
              :disabled="isRecording"
              @click="config.format = fmt as 'mp4' | 'mkv' | 'webm'"
            >
              {{ fmt.toUpperCase() }}
            </button>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <svg class="icon-small" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            保存路径
          </label>
          <div class="path-input-group">
            <input
              type="text"
              v-model="config.savePath"
              :disabled="isRecording"
              readonly
            />
            <div class="path-actions">
              <button
                class="icon-btn"
                @click="openSavePath"
                :disabled="isRecording"
                title="打开文件夹"
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5l-2-2z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
              <button
                class="icon-btn"
                @click="selectSavePath"
                :disabled="isRecording"
                title="更改路径"
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M12 5l7 7-7 7"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 系统状态监控 -->
      <div class="panel-section monitor-section">
        <h3 class="section-title">系统资源监控</h3>

        <div class="monitor-item">
          <div class="monitor-label">
            <span>CPU 使用率</span>
            <span class="monitor-value"
              >{{ (sysUsage.cpuUsage * 100).toFixed(1) }}%</span
            >
          </div>
          <el-progress
            :percentage="
              isNaN(sysUsage.cpuUsage)
                ? 0
                : Math.min(100, Math.round(sysUsage.cpuUsage * 100))
            "
            :show-text="false"
            :stroke-width="4"
            stroke-linecap="round"
          />
          <div class="monitor-detail">
            {{ sysInfo.cpuModel }} ({{ sysInfo.cpuCores }} 核心)
          </div>
        </div>

        <div class="monitor-item">
          <div class="monitor-label">
            <span>内存占用</span>
            <span class="monitor-value"
              >{{ usedMemGB.toFixed(1) }}G / {{ totalMemGB.toFixed(1) }}G</span
            >
          </div>
          <el-progress
            :percentage="
              !totalMemGB || isNaN(usedMemGB / totalMemGB)
                ? 0
                : Math.round((usedMemGB / totalMemGB) * 100)
            "
            :show-text="false"
            :stroke-width="4"
            stroke-linecap="round"
            status="warning"
          />
        </div>

        <div class="monitor-item" v-if="diskInfo">
          <div class="monitor-label">
            <span>磁盘空间 ({{ diskRoot }})</span>
            <span class="monitor-value">
              剩余 {{ (diskInfo.free / 1024 / 1024 / 1024).toFixed(1) }}G / 总
              {{ (diskInfo.size / 1024 / 1024 / 1024).toFixed(0) }}G
            </span>
          </div>
          <el-progress
            :percentage="
              !diskInfo ||
              !diskInfo.size ||
              isNaN((diskInfo.size - diskInfo.free) / diskInfo.size)
                ? 0
                : Math.round(
                    ((diskInfo.size - diskInfo.free) / diskInfo.size) * 100
                  )
            "
            :show-text="false"
            :stroke-width="4"
            stroke-linecap="round"
            status="success"
          />
        </div>
      </div>

      <!-- 更新状态提示 -->
      <div class="panel-section update-section" v-if="updateMessage">
        <h3 class="section-title">软件更新</h3>
        <div class="update-info">
          <div class="update-msg">{{ updateMessage }}</div>
          <el-progress
            v-if="updateProgress > 0 && updateProgress < 100"
            :percentage="Math.round(updateProgress)"
            :stroke-width="4"
          />
        </div>
      </div>
    </div>

    <!-- 快捷键提示 -->
    <div class="shortcuts-footer">
      <div class="shortcut-tip">
        <kbd>Ctrl+F12</kbd>
        <span>录制</span>
      </div>
      <div class="shortcut-tip">
        <kbd>Ctrl+F11</kbd>
        <span>回溯</span>
      </div>
      <div class="shortcut-tip">
        <kbd>Ctrl+F10</kbd>
        <span>截图</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from "vue";
import { ElMessage, ElNotification } from "element-plus";
import VideoPreview from "./VideoPreview.vue";

// ==================== 类型定义 ====================
interface RecorderConfig {
  sourceId: string;
  frameRate: number;
  bitRate: number;
  replayBitRate: number;
  format: "mp4" | "mkv" | "webm";
  savePath: string;
  display_id: string;
}

// ==================== 响应式状态 ====================
const theme = ref<"dark" | "light">("dark");
const appName = ref("UltraClear Recorder");

const config = reactive<RecorderConfig>({
  sourceId: "",
  display_id: "",
  frameRate: 60,
  bitRate: 50000,
  replayBitRate: 15000,
  format: "mkv",
  savePath: "",
});

const sources = ref<
  { id: string; name: string; thumbnail: string; display_id: string }[]
>([]);

const isRecording = ref(false);
const isReplayRecording = ref(false);
const isStarting = ref(false);
const recordingDuration = ref(0); // 秒
const recordingStartTime = ref<number>(0);

let durationTimer: ReturnType<typeof setInterval> | null = null;
let monitorTimer: ReturnType<typeof setInterval> | null = null;
let sourceTimer: ReturnType<typeof setInterval> | null = null;

// 系统监控
const sysInfo = ref<any>({ cpuModel: "", cpuCores: 0, totalMem: 0 });
const sysUsage = ref<any>({ cpuUsage: 0, freeMem: 1, totalMem: 1 });
const diskInfo = ref<any>(null);

// 更新状态
const updateMessage = ref("");
const updateProgress = ref(0);

// ==================== 计算属性 ====================
const usedMemGB = computed(
  () =>
    (sysUsage.value.totalMem - sysUsage.value.freeMem) / (1024 * 1024 * 1024)
);
const totalMemGB = computed(
  () => sysUsage.value.totalMem / (1024 * 1024 * 1024)
);
const diskRoot = computed(() => {
  if (!config.savePath) return "";
  return config.savePath.substring(0, 3); // 获取驱动器盘符，如 C:\
});

const statusText = computed(() => {
  if (isRecording.value) return "正在录制";
  if (isReplayRecording.value) return "正在保存回溯";
  return "准备就绪";
});

// 估算每分钟文件大小
const estimatedSizePerMin = computed(() => {
  const mbPerMin = ((config.bitRate / 8) * 60) / 1024;
  return mbPerMin.toFixed(1) + " MB";
});

const estimatedReplaySizePerMin = computed(() => {
  const mbPerMin = ((config.replayBitRate / 8) * 60) / 1024;
  return mbPerMin.toFixed(1) + " MB";
});

// ==================== 工具函数 ====================
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatBitrate(kbps: number): string {
  return kbps >= 1000 ? `${(kbps / 1000).toFixed(0)} Mbps` : `${kbps} Kbps`;
}

function selectSource(id: string, display_id: string) {
  if (!isRecording.value) {
    config.sourceId = id;
    config.display_id = display_id;
    console.log("[ config ]-604", config);
  }
}

function generateFileName(prefix: string = "recording"): string {
  const now = new Date();
  const y = now.getFullYear();
  const M = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  return `${prefix}_${y}${M}${d}_${h}${m}${s}`;
}

// ==================== 接口交互 ====================
async function initTheme() {
  const systemTheme = await window.electronAPI.getSystemTheme();
  const savedConfig = await window.electronAPI.getConfig();
  theme.value = (savedConfig.theme as "dark" | "light") || systemTheme;

  window.electronAPI.onThemeChanged((newTheme) => {
    window.electronAPI.getConfig().then((cfg) => {
      if (!cfg.themeManual) {
        theme.value = newTheme;
      }
    });
  });
}

function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark";
  window.electronAPI.saveConfig({ theme: theme.value, themeManual: true });
}

function minimizeWindow() {
  window.electronAPI.minimizeWindow();
}
function closeWindow() {
  window.electronAPI.closeWindow();
}

async function loadConfig() {
  try {
    const savedConfig = await window.electronAPI.getConfig();
    if (savedConfig.frameRate) config.frameRate = savedConfig.frameRate;
    if (savedConfig.bitRate) config.bitRate = savedConfig.bitRate;
    if (savedConfig.replayBitRate)
      config.replayBitRate = savedConfig.replayBitRate;
    if (savedConfig.format) config.format = savedConfig.format;
    if (savedConfig.savePath) {
      config.savePath = savedConfig.savePath;
      refreshDiskInfo();
    } else {
      config.savePath = await window.electronAPI.getDefaultPath();
    }
  } catch {
    config.savePath = await window.electronAPI.getDefaultPath();
  }
}

async function refreshMonitorData() {
  try {
    sysUsage.value = await window.electronAPI.getSystemUsage();
    refreshDiskInfo();
  } catch (e) {
    console.error("Failed to refresh monitor data", e);
  }
}

async function refreshDiskInfo() {
  if (!config.savePath) return;
  try {
    diskInfo.value = await window.electronAPI.getDiskInfo(config.savePath);
  } catch (e) {
    console.error("Failed to get disk info", e);
  }
}

async function refreshSources() {
  try {
    const _sources = await window.electronAPI.getSources();
    // 优先保留带有 "screen" 关键字的源（显示器）
    const screenSources = _sources.filter(
      (s: any) =>
        s.name.toLowerCase().includes("screen") ||
        s.name.includes("屏幕") ||
        s.id.startsWith("screen:")
    );
    sources.value = screenSources.length > 0 ? screenSources : _sources;

    if (
      (!config.sourceId || !sources.value.find((s) => s.id === config.sourceId)) &&
      sources.value.length > 0
    ) {
      config.sourceId = sources.value[0].id;
      config.display_id = sources.value[0].display_id;
    }
  } catch (e) {
    console.error("Failed to get sources", e);
  }
}

async function saveConfig() {
  await window.electronAPI.saveConfig({
    frameRate: config.frameRate,
    bitRate: config.bitRate,
    replayBitRate: config.replayBitRate,
    format: config.format,
    savePath: config.savePath,
  });
}

async function selectSavePath() {
  const path = await window.electronAPI.selectDir();
  if (path) {
    config.savePath = path;
    await saveConfig();
  }
}

async function openSavePath() {
  if (config.savePath) {
    await window.electronAPI.openPath(config.savePath);
  }
}

watch(
  () => ({ ...config }),
  () => {
    saveConfig();
  },
  { deep: true }
);

// ==================== FFmpeg录制核心 ====================

async function toggleRecording() {
  if (isRecording.value) {
    await stopRecording();
  } else {
    await startRecording();
  }
}

async function startRecording() {
  if (isStarting.value || isRecording.value) return;
  isStarting.value = true;

  try {
    // 停止回溯缓冲
    await window.electronAPI.ffmpegStopReplayBuffer();

    // 使用FFmpeg开始录制
    const ffmpegConfig = {
      sourceId: config.display_id,
      frameRate: config.frameRate,
      bitRate: config.bitRate,
      format: config.format,
      savePath: config.savePath,
    };

    const result = await window.electronAPI.ffmpegStartRecording(ffmpegConfig);

    if (result) {
      isRecording.value = true;
      recordingStartTime.value = Date.now();
      recordingDuration.value = 0;
      durationTimer = setInterval(() => {
        recordingDuration.value++;
      }, 1000);

      window.electronAPI.updateRecordingStatus({
        isRecording: true,
        isReplay: false,
      });

      ElNotification({
        title: "录制已开始",
        message: "按 F12 或点击按钮停止",
        type: "success",
        duration: 2000,
        position: "bottom-right",
      });
    } else {
      throw new Error("FFmpeg启动录制失败");
    }
  } catch (error: any) {
    console.error("Start recording failed:", error);
    ElMessage.error("启动录制失败: " + error.message);
    // 失败后尝试恢复回溯缓冲
    startReplayBuffer();
  } finally {
    isStarting.value = false;
  }
}

async function stopRecording() {
  if (!isRecording.value) return;

  try {
    if (durationTimer) {
      clearInterval(durationTimer);
      durationTimer = null;
    }

    // 使用FFmpeg停止录制
    const result = await window.electronAPI.ffmpegStopRecording();

    isRecording.value = false;
    window.electronAPI.updateRecordingStatus({
      isRecording: false,
      isReplay: false,
    });

    if (result) {
      ElNotification({
        title: "录制完成",
        message: `已保存: ${result.split("/").pop()}`,
        type: "success",
        duration: 3000,
        position: "bottom-right",
      });
    }

    // 录制停止后重新开启回溯缓冲
    setTimeout(() => {
      startReplayBuffer();
    }, 500);
  } catch (error: any) {
    console.error("Stop recording failed:", error);
    ElMessage.error("停止录制失败: " + error.message);
  }
}

// ==================== 回溯缓冲逻辑 ====================

async function startReplayBuffer() {
  if (isRecording.value) return;

  try {
    const ffmpegConfig = {
      sourceId: config.display_id,
      frameRate: 30, // 回溯使用较低帧率
      bitRate: config.replayBitRate,
      format: "mkv",
      savePath: config.savePath,
    };

    await window.electronAPI.ffmpegStartReplayBuffer(ffmpegConfig);
  } catch (error) {
    console.error("启动回溯缓冲失败:", error);
  }
}

async function saveReplayRecording() {
  isReplayRecording.value = true;
  window.electronAPI.updateRecordingStatus({
    isRecording: false,
    isReplay: true,
  });

  try {
    const ffmpegConfig = {
      sourceId: config.sourceId,
      frameRate: config.frameRate,
      bitRate: config.bitRate,
      format: "mkv",
      savePath: config.savePath,
    };

    const result = await window.electronAPI.ffmpegSaveReplay(ffmpegConfig);

    if (result) {
      ElNotification({
        title: "回溯录制完成",
        message: `已保存: ${result.split("/").pop()}`,
        type: "success",
        duration: 3000,
        position: "bottom-right",
      });
    } else {
      ElMessage.warning("没有可用的回溯数据");
    }
  } catch (e: any) {
    ElMessage.error("保存回溯失败: " + e.message);
  } finally {
    isReplayRecording.value = false;
    window.electronAPI.updateRecordingStatus({
      isRecording: false,
      isReplay: false,
    });
  }
}

// ==================== 屏幕截图 ====================


// ==================== 更新逻辑 ====================
function checkForUpdates() {
  window.electronAPI.checkForUpdates();
}

// ==================== 生命周期 ====================

async function takeScreenshot() {
  if (isStarting.value) return;
  isStarting.value = true;

  try {
    const savePath = config.savePath || (await window.electronAPI.getDefaultPath());
    // 调用基于 FFmpeg 的后端截图接口，并传递正确的显示器 ID
    const result = await window.electronAPI.ffmpegTakeScreenshot(config.display_id, savePath);

    if (result) {
      ElNotification({
        title: "截图成功",
        message: `已保存: ${result}`,
        type: "success",
        duration: 3000,
        position: "bottom-right",
      });
    } else {
      throw new Error("FFmpeg 截图返回空值");
    }
  } catch (error: any) {
    console.error("Take screenshot failed:", error);
    ElMessage.error("截图失败: " + error.message);
  } finally {
    isStarting.value = false;
  }
}

onMounted(async () => {
  await loadConfig();
  await initTheme();
  const name = await window.electronAPI.getAppName();
  if (name) appName.value = name;

  sysInfo.value = await window.electronAPI.getSystemInfo();
  refreshMonitorData();
  monitorTimer = setInterval(refreshMonitorData, 2000);
  const _sources = await window.electronAPI.getSources();
  // 优先保留带有 "screen" 关键字的源（显示器）

  sources.value = _sources;
  selectSource(config.sourceId, config.display_id);
  await refreshSources();
  sourceTimer = setInterval(refreshSources, 5000);

  // 监听主进程发起的命令
  window.electronAPI.onToggleRecording(() => {
    toggleRecording();
  });
  window.electronAPI.onReplayRecording(() => {
    saveReplayRecording();
  });
  window.electronAPI.onTakeScreenshot(() => {
    takeScreenshot();
  });

  // 监听更新事件
  window.electronAPI.onUpdateMessage((msg) => {
    updateMessage.value = msg;
    if (msg.includes("出错") || msg.includes("完成")) {
      ElMessage({
        message: msg,
        type: msg.includes("出错") ? "error" : "success",
        duration: 5000,
      });
    }
  });

  window.electronAPI.onUpdateProgress((percent) => {
    updateProgress.value = percent;
  });

  // 启动回溯缓冲
  setTimeout(() => {
    startReplayBuffer();
  }, 1000);
});

onUnmounted(() => {
  if (durationTimer) clearInterval(durationTimer);
  if (monitorTimer) clearInterval(monitorTimer);
  if (sourceTimer) clearInterval(sourceTimer);

  // 清理FFmpeg资源
  window.electronAPI.ffmpegStopReplayBuffer();

  window.electronAPI.removeAllListeners("toggle-recording");
  window.electronAPI.removeAllListeners("replay-recording");
  window.electronAPI.removeAllListeners("take-screenshot");
  window.electronAPI.removeAllListeners("theme-changed");
});
</script>

<style scoped>
/* 保持原有的样式不变 */
.recorder-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  --primary: #6366f1;
  --primary-rgb: 99, 102, 241;
  --success: #10b981;
  --danger: #ef4444;
  --warning: #f59e0b;
}

/* 主题颜色变量 */
.recorder-view.dark {
  --bg-primary: #0f0f14;
  --bg-secondary: #16161d;
  --bg-tertiary: #1e1e28;
  --bg-hover: #252532;
  --text-primary: #ffffff;
  --text-secondary: #a0a0b0;
  --text-muted: #606070;
  --border-color: rgba(255, 255, 255, 0.08);
}

.recorder-view.light {
  --bg-primary: #fafafa;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f3f4f6;
  --bg-hover: #e5e7eb;
  --text-primary: #111827;
  --text-secondary: #4b5563;
  --text-muted: #9ca3af;
  --border-color: rgba(0, 0, 0, 0.08);
}

/* 其余样式保持不变，这里省略重复内容 */
.title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  -webkit-app-region: drag;
  user-select: none;
}

.app-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.logo-icon {
  width: 24px;
  height: 24px;
  color: var(--primary);
}

.window-controls {
  display: flex;
  gap: 8px;
  -webkit-app-region: no-drag;
}

.control-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  cursor: pointer;
}

.control-btn:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.control-btn.close:hover {
  background-color: var(--danger);
  color: white;
}

.control-btn svg {
  width: 16px;
  height: 16px;
}

/* 状态卡片 */
.status-card {
  margin: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  background-color: var(--bg-secondary);
  border-radius: 20px;
  border: 1px solid var(--border-color);
}

.status-indicator {
  position: relative;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.status-dot.idle {
  background-color: var(--success);
}
.status-dot.recording {
  background-color: var(--danger);
}
.status-dot.replay-recording {
  background-color: var(--warning);
}

.pulse-ring {
  position: absolute;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--danger);
  animation: pulse 1.5s ease-out infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.5);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

.status-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-text {
  font-size: 14px;
  font-weight: 600;
}

.duration {
  font-family: "JetBrains Mono", monospace;
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
  letter-spacing: -0.02em;
}

.main-actions {
  display: flex;
  gap: 12px;
}

.record-btn {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary), #8b5cf6);
  color: white;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
}

.record-btn.recording {
  background: linear-gradient(135deg, var(--danger), #f87171);
}

.record-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.record-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.record-btn svg {
  width: 24px;
  height: 24px;
}

.record-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  transition: all 0.2s ease;
  cursor: pointer;
}

.action-btn:hover:not(:disabled) {
  background-color: var(--bg-hover);
  transform: scale(1.05);
}

.action-btn svg {
  width: 24px;
  height: 24px;
}

/* 配置主面板 */
.settings-panel {
  flex: 1;
  margin: 0 16px 16px;
  padding: 20px;
  background-color: var(--bg-secondary);
  border-radius: 20px;
  border: 1px solid var(--border-color);
  overflow-y: auto;
}

.panel-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.sub-section {
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.sub-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.icon-small {
  width: 16px;
  height: 16px;
  color: var(--primary);
}

.badge {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
}

.badge.primary {
  background-color: var(--primary);
  color: white;
  margin-left: auto;
}

.size-estimate {
  font-size: 11px;
  color: var(--text-muted);
  margin-left: 8px;
  padding: 2px 6px;
  background-color: var(--bg-tertiary);
  border-radius: 6px;
}

/* 屏幕选择器 */
.source-selector {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.source-card {
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 2px;
  background-color: var(--bg-secondary);
  transition: all 0.2s ease;
  cursor: pointer;
  overflow: hidden;
}

.source-card:hover {
  background-color: var(--bg-tertiary);
  transform: translateY(-2px);
}

.source-card.active {
  border-color: var(--primary);
  background-color: var(--bg-tertiary);
  box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.2);
}

.source-thumb {
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 8px;
  background-color: black;
  overflow: hidden;
}

.source-name {
  padding: 8px;
  font-size: 12px;
  text-align: center;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.source-card.active .source-name {
  color: var(--primary);
  font-weight: 600;
}

.source-loading {
  text-align: center;
  padding: 20px;
  font-size: 13px;
  color: var(--text-muted);
}

/* 格式选择 */
.format-group {
  display: flex;
  gap: 8px;
}

.format-btn {
  flex: 1;
  padding: 10px;
  border-radius: 10px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s ease;
  cursor: pointer;
}

.format-btn:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--text-primary);
}

.format-btn.active {
  background-color: var(--primary);
  border-color: var(--primary);
  color: white;
}

.format-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 路径输入组 */
.path-input-group {
  display: flex;
  gap: 8px;
}

.path-input-group input {
  flex: 1;
  padding: 10px 14px;
  border-radius: 10px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  outline: none;
}

.path-actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  transition: all 0.2s ease;
  cursor: pointer;
}

.icon-btn:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
}

.icon-btn svg {
  width: 16px;
  height: 16px;
}

/* 系统监控 */
.monitor-section {
  margin-top: 10px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.monitor-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.monitor-label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-secondary);
  padding: 0 4px;
}

.monitor-value {
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  font-weight: 600;
  color: var(--primary);
}

.monitor-detail {
  font-size: 11px;
  color: var(--text-muted);
  padding: 0 4px;
}

/* 页脚快捷键 */
.shortcuts-footer {
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 14px;
  background-color: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.shortcut-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-muted);
}

.shortcut-tip kbd {
  display: inline-block;
  padding: 4px 8px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
}

/* 滚动条美化 */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

/* 深度选择器修改 Element Plus 样式 */
:deep(.el-slider__runway) {
  background-color: var(--bg-tertiary);
}

:deep(.el-progress-bar__outer) {
  background-color: var(--bg-tertiary) !important;
}

/* 阴影效果 */
.shadow-premium {
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.3);
}

.shadow-glow {
  box-shadow: 0 4px 16px rgba(var(--primary-rgb), 0.4);
}

.shadow-soft {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
