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
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <span>{{ appName }}</span>
      </div>

      <!-- 更新通知弹窗 -->
      <div
        v-if="updateMessage"
        class="update-notification"
        :class="{ show: updateMessage }"
      >
        <div class="update-content">
          <div class="update-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M13 3L12 2M12 2L11 3M12 2V9"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M5 10V14C5 17.3137 7.68629 20 11 20H13C16.3137 20 19 17.3137 19 14V10"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M8 15H16"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <div class="update-info">
            <div class="update-title">软件更新</div>
            <div class="update-msg">{{ updateMessage }}</div>
            <div
              v-if="updateProgress > 0 && updateProgress < 100"
              class="update-progress"
            >
              <div
                class="progress-bar"
                :style="{ width: updateProgress + '%' }"
              ></div>
              <span class="progress-text"
                >{{ Math.round(updateProgress) }}%</span
              >
            </div>
          </div>
          <button class="update-close" @click="updateMessage = ''" title="关闭">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M6 18L18 6M6 6L18 18"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div class="window-controls">
        <ThemeToggle v-model="theme"></ThemeToggle>
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
              stroke-linejoin="round"
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
    <el-scrollbar>
      <div class="settings-panel custom-scrollbar">
        <div class="panel-section">
          <h3 class="section-title">录制设置</h3>
          <div class="setting-item">
            <label class="setting-label">
              <svg class="icon-small" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 4h16v16H4z"
                  stroke="currentColor"
                  stroke-width="2"
                />
              </svg>
              录制模式
            </label>

            <div class="record-mode-grid">
              <div
                v-for="mode in RECORD_MODE_OPTIONS"
                :key="mode.key"
                class="record-mode-card"
                :class="{ active: config.preset === mode.key }"
                @click="!isRecording && (config.preset = mode.key as any)"
              >
                <div class="mode-header">
                  <span class="mode-icon">{{ mode.icon }}</span>
                  <span class="mode-title">{{ mode.title }}</span>
                </div>

                <div class="mode-desc">{{ mode.desc }}</div>

                <div class="mode-meta">
                  <template v-if="mode.key !== 'custom'">
                    {{ mode.fps }} FPS · {{ formatBitrate(mode.bitrate) }}
                  </template>
                  <template v-else>自由设置</template>
                </div>
              </div>
            </div>
          </div>

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
              :disabled="isRecording || config.preset !== 'custom'"
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
              <span
                v-if="isRecording && currentFileSize > 0"
                class="current-size"
              >
                当前: {{ currentFileSizeFormatted }}
              </span>
            </label>
            <el-slider
              v-model="config.bitRate"
              :min="100"
              :max="120000"
              :step="100"
              :disabled="isRecording || config.preset !== 'custom'"
              :marks="{
                5000: '5M',
                50000: '50M',
                100000: '100M',
                120000: '120M',
              }"
            />
          </div>

          <!-- TODO:回溯设置 功能开发有问题 ，先隐藏后续有空再开发 -->
          <div class="sub-section" v-if="false">
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
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
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
              <span v-if="sysUsage.cpuCurrentSpeed">
                @ {{ sysUsage.cpuCurrentSpeed }} MHz
              </span>
            </div>
          </div>

          <div class="monitor-item">
            <div class="monitor-label">
              <span>内存占用</span>
              <span class="monitor-value"
                >{{ usedMemGB.toFixed(1) }}G /
                {{ totalMemGB.toFixed(1) }}G</span
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

          <!-- 新增：系统运行时间 -->
          <div class="monitor-item" v-if="sysUsage.uptime">
            <div class="monitor-label">
              <span>系统运行时间</span>
              <span class="monitor-value">{{
                formatUptime(sysUsage.uptime)
              }}</span>
            </div>
          </div>

          <!-- 新增：进程、线程、句柄信息 -->
          <div class="monitor-item" v-if="sysUsage.processCount">
            <div class="monitor-label">
              <span>系统进程</span>
              <span class="monitor-value">{{ sysUsage.processCount }} 个</span>
            </div>
            <div class="monitor-detail-grid">
              <div class="detail-item">
                <span class="detail-label">线程:</span>
                <span class="detail-value">{{
                  sysUsage.threadCount || 0
                }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">句柄:</span>
                <span class="detail-value">{{
                  sysUsage.handleCount || 0
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-scrollbar>

    <!-- 快捷键提示 -->
    <div class="shortcuts-footer">
      <div class="shortcut-tip">
        <kbd>Ctrl+F12</kbd>
        <span>录制</span>
      </div>
      <!-- <div class="shortcut-tip">
        <kbd>Ctrl+F11</kbd>
        <span>回溯</span>
      </div> -->
      <div class="shortcut-tip">
        <kbd>Ctrl+F10</kbd>
        <span>截图</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from "vue";
import { ElMessage } from "element-plus";
import VideoPreview from "./VideoPreview.vue";
import ThemeToggle from "./ThemeToggle.vue";

// ==================== 类型定义 ====================
type RecordPreset = "demo" | "game" | "compact" | "custom";

interface RecorderConfig {
  sourceId: string;
  frameRate: number;
  bitRate: number;
  replayBitRate: number;
  format: "mp4" | "mkv" | "webm";
  savePath: string;
  display_id: string;
  preset: "demo" | "game" | "compact" | "custom";
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
  preset: "game", // 默认给用户一个爽的
});
const RECORD_MODE_OPTIONS = [
  {
    key: "demo",
    title: "演示模式",
    desc: "稳定清晰，适合教学 / 演示 / PPT",
    icon: "🎬",
    fps: 30,
    bitrate: 8000,
  },
  {
    key: "game",
    title: "游戏模式",
    desc: "高帧率，流畅记录游戏画面",
    icon: "🎮",
    fps: 60,
    bitrate: 50000,
  },
  {
    key: "compact",
    title: "低体积模式",
    desc: "文件更小，适合长时间录制",
    icon: "📦",
    fps: 24,
    bitrate: 4000,
  },
  {
    key: "custom",
    title: "自定义模式",
    desc: "手动调整帧率和码率",
    icon: "⚙",
  },
] as const;

const sources = ref<
  { id: string; name: string; thumbnail: string; display_id: string }[]
>([]);

const isRecording = ref(false);
const isReplayRecording = ref(false);
const isStarting = ref(false);
const recordingDuration = ref(0); // 秒
const recordingStartTime = ref<number>(0);
const currentFileSize = ref<number>(0); // 当前录像文件大小（字节）
const recordingFilePath = ref<string>(""); // 当前录像文件路径

let durationTimer: ReturnType<typeof setInterval> | null = null;
let monitorTimer: ReturnType<typeof setInterval> | null = null;
let sourceTimer: ReturnType<typeof setInterval> | null = null;
let fileSizeTimer: ReturnType<typeof setInterval> | null = null;

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

// 估算每分钟文件大小（修正后的公式）
const estimatedSizePerMin = computed(() => {
  // 把 bitRate 当作「30fps 下的参考码率」
  const fpsFactor = config.frameRate / 30;

  const effectiveBitrateKbps = config.bitRate * fpsFactor;

  const bytesPerSecond = (effectiveBitrateKbps * 1000) / 8;
  const bytesPerMinute = bytesPerSecond * 60;
  const mbPerMinute = bytesPerMinute / (1024 * 1024);

  return mbPerMinute.toFixed(1) + " MB";
});

const estimatedReplaySizePerMin = computed(() => {
  const bytesPerSecond = (config.replayBitRate * 1000) / 8;
  const bytesPerMinute = bytesPerSecond * 60;
  const mbPerMinute = bytesPerMinute / (1024 * 1024);
  return mbPerMinute.toFixed(1) + " MB";
});

// 当前录像文件大小（格式化）
const currentFileSizeFormatted = computed(() => {
  if (!isRecording.value || currentFileSize.value === 0) return "0 MB";
  const mb = currentFileSize.value / (1024 * 1024);
  if (mb >= 1024) {
    return (mb / 1024).toFixed(2) + " GB";
  }
  return mb.toFixed(2) + " MB";
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

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const s = parseInt((seconds % 60) + "");

  if (days > 0) {
    return `${days}天 ${hours}小时 ${minutes}分钟 ${s}秒`;
  } else if (hours > 0) {
    return `${hours}小时 ${minutes}分钟 ${s}秒`;
  } else {
    return `${minutes}分钟 ${s}秒`;
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
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
    if (savedConfig.preset) config.preset = savedConfig.preset;

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
      (!config.sourceId ||
        !sources.value.find((s) => s.id === config.sourceId)) &&
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
    preset: config.preset,
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

watch(
  () => config.preset,
  (preset) => {
    const mode = RECORD_MODE_OPTIONS.find((m) => m.key === preset);
    if (mode && preset !== "custom") {
      config.frameRate = mode.fps;
      config.bitRate = mode.bitrate;
    }
  },
  { immediate: true }
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
      currentFileSize.value = 0;

      // 生成文件路径（与后端逻辑一致）
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `recording_${timestamp}.${config.format}`;
      recordingFilePath.value = `${config.savePath}\\${fileName}`;

      durationTimer = setInterval(() => {
        recordingDuration.value++;
      }, 1000);

      // 启动文件大小监控（每2秒更新一次）
      fileSizeTimer = setInterval(async () => {
        if (recordingFilePath.value) {
          try {
            const size = await window.electronAPI.getFileSize(
              recordingFilePath.value
            );
            currentFileSize.value = size;
          } catch (error) {
            console.error("获取文件大小失败:", error);
          }
        }
      }, 2000);

      window.electronAPI.updateRecordingStatus({
        isRecording: true,
        isReplay: false,
      });

      window.electronAPI.sendNotification({
        title: "录制已开始",
        body: "按 F12 或点击按钮停止",
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

    if (fileSizeTimer) {
      clearInterval(fileSizeTimer);
      fileSizeTimer = null;
    }

    // 使用FFmpeg停止录制
    const result = await window.electronAPI.ffmpegStopRecording();

    isRecording.value = false;
    window.electronAPI.updateRecordingStatus({
      isRecording: false,
      isReplay: false,
    });

    // 重置文件大小和路径
    currentFileSize.value = 0;
    recordingFilePath.value = "";

    if (result) {
      window.electronAPI.sendNotification({
        title: "录制完成",
        body: `已保存: ${result.split("/").pop()}`,
        onClickChannel: "notification-click-open-file",
        onClickData: result,
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
      window.electronAPI.sendNotification({
        title: "回溯录制完成",
        body: `已保存: ${result.split("/").pop()}`,
        onClickChannel: "notification-click-open-file",
        onClickData: result,
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
    const savePath =
      config.savePath || (await window.electronAPI.getDefaultPath());
    // 调用基于 FFmpeg 的后端截图接口，并传递正确的显示器 ID
    const result = await window.electronAPI.ffmpegTakeScreenshot(
      config.display_id,
      savePath
    );

    if (result) {
      window.electronAPI.sendNotification({
        title: "截图成功",
        body: `已保存: ${result}`,
        onClickChannel: "notification-click-open-file",
        onClickData: result,
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
  monitorTimer = setInterval(refreshMonitorData, 1000);
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

    setTimeout(() => {
      updateMessage.value = "";
    }, 5000);
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

  // 监听通知点击事件
  window.electronAPI.onNotificationClickOpenFile((filePath) => {
    window.electronAPI.openPath(filePath);
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
  window.electronAPI.removeAllListeners("notification-click-open-file");
});
</script>

<style lang="scss" scoped>
/* =========================
   SCSS 变量
   ========================= */
$primary: #6366f1;
$primary-rgb: 99, 102, 241;
$success: #10b981;
$danger: #ef4444;
$warning: #f59e0b;

$radius-sm: 6px;
$radius-md: 10px;
$radius-lg: 16px;
$radius-xl: 20px;

$transition-fast: 0.2s ease;
$transition-normal: 0.4s cubic-bezier(0.4, 0, 0.2, 1);

/* =========================
   根容器 + 主题
   ========================= */
.recorder-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  --primary: #{$primary};
  --primary-rgb: #{$primary-rgb};
  --success: #{$success};
  --danger: #{$danger};
  --warning: #{$warning};

  &.dark {
    --bg-primary: #0f0f14;
    --bg-secondary: #16161d;
    --bg-tertiary: #1e1e28;
    --bg-hover: #262635;

    --text-primary: #ffffff;
    --text-secondary: #a0a0b0;
    --text-muted: #6b7280;

    --border-color: rgba(255, 255, 255, 0.08);
  }

  &.light {
    --bg-primary: #f8fafc;
    --bg-secondary: #ffffff;
    --bg-tertiary: #f1f5f9;
    --bg-hover: #e5e7eb;

    --text-primary: #0f172a;
    --text-secondary: #475569;
    --text-muted: #94a3b8;

    --border-color: rgba(0, 0, 0, 0.08);
  }

  background: var(--bg-primary);
  color: var(--text-primary);

  /* =========================
     Title Bar
     ========================= */
  .title-bar {
    height: 44px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    -webkit-app-region: drag;

    .app-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;

      .logo-icon {
        width: 22px;
        height: 22px;
        color: var(--primary);
      }
    }

    .window-controls {
      display: flex;
      gap: 6px;
      -webkit-app-region: no-drag;

      .control-btn {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: transparent;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        transition: $transition-fast;

        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        &.close:hover {
          background: var(--danger);
          color: #fff;
        }

        svg {
          width: 14px;
          height: 14px;
        }
      }
    }
  }

  /* =========================
     状态卡片
     ========================= */
  .status-card {
    margin: 16px;
    padding: 18px 20px;
    display: flex;
    align-items: center;
    gap: 16px;

    background: var(--bg-secondary);
    border-radius: $radius-xl;
    border: 1px solid var(--border-color);

    .status-indicator {
      position: relative;
      width: 42px;
      height: 42px;

      .pulse-ring {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: var(--danger);
        opacity: 0.3;
        animation: pulse-ring 1.5s infinite;
      }

      .status-dot {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        margin: auto;
        position: relative;
        top: 14px;

        &.idle {
          background: var(--success);
        }
        &.recording {
          background: var(--danger);
        }
        &.replay-recording {
          background: var(--warning);
        }
      }
    }

    .status-info {
      flex: 1;

      .status-text {
        font-size: 14px;
        font-weight: 600;
      }

      .duration {
        font-size: 22px;
        font-weight: 700;
        font-family: "JetBrains Mono", monospace;
        color: var(--primary);
      }
    }

    .main-actions {
      display: flex;
      gap: 12px;

      .record-btn,
      .action-btn {
        width: 56px;
        height: 56px;
        border-radius: $radius-lg;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: $transition-fast;
        svg {
          width: 22px;
          height: 22px;
        }
      }

      .record-btn {
        background: linear-gradient(135deg, var(--primary), #8b5cf6);
        color: #fff;

        &.recording {
          background: linear-gradient(135deg, var(--danger), #f87171);
        }

        &:hover {
          transform: scale(1.05);
        }
        &:active {
          transform: scale(0.95);
        }
      }

      .action-btn {
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);

        &:hover {
          background: var(--bg-hover);
          transform: scale(1.05);
        }
      }
    }
  }

  /* =========================
     设置面板
     ========================= */
  .settings-panel {
    flex: 1;
    margin: 0 16px 16px;
    padding: 20px;
    overflow-y: auto;

    background: var(--bg-secondary);
    border-radius: $radius-xl;
    border: 1px solid var(--border-color);

    .panel-section {
      display: flex;
      flex-direction: column;
      gap: 20px;

      & + .panel-section {
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid var(--border-color);
      }
    }

    .section-title {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      color: var(--text-muted);
    }

    .setting-item {
      display: flex;
      flex-direction: column;
      gap: 10px;

      .setting-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: var(--text-secondary);

        .icon-small {
          width: 16px;
          height: 16px;
          color: var(--primary);
        }

        .badge.primary {
          margin-left: auto;
          padding: 2px 8px;
          border-radius: $radius-sm;
          background: var(--primary);
          color: #fff;
          font-size: 11px;
        }
      }
    }

    /* ===== 录制模式 ===== */
    .record-mode-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px;

      .record-mode-card {
        padding: 14px;
        border-radius: $radius-lg;
        border: 1px solid var(--border-color);
        background: var(--bg-tertiary);
        cursor: pointer;
        transition: $transition-fast;

        &.active {
          border-color: var(--primary);
          box-shadow: 0 0 0 1px var(--primary);
        }

        &:hover {
          background: var(--bg-hover);
        }

        .mode-header {
          display: flex;
          gap: 6px;
          font-weight: 600;
        }

        .mode-desc {
          margin-top: 6px;
          font-size: 12px;
          color: var(--text-muted);
        }

        .mode-meta {
          margin-top: 8px;
          font-size: 11px;
          color: var(--text-secondary);
        }
      }
    }

    /* ===== 屏幕选择 ===== */
    .source-selector {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 12px;

      .source-card {
        border-radius: $radius-lg;
        border: 1px solid var(--border-color);
        background: var(--bg-tertiary);
        cursor: pointer;
        overflow: hidden;

        &.active {
          border-color: var(--primary);
        }

        .source-thumb {
          height: 100px;
          background: #000;
        }

        .source-name {
          padding: 8px;
          font-size: 12px;
          text-align: center;
        }
      }
    }

    /* =========================
       编码格式
       ========================= */
    .format-group {
      display: flex;
      gap: 14px;

      .format-btn {
        min-width: 88px;
        height: 44px;
        padding: 0 22px;

        border-radius: $radius-lg;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.06em;

        background: linear-gradient(
          180deg,
          var(--bg-tertiary),
          rgba(0, 0, 0, 0.05)
        );
        border: 1px solid var(--border-color);
        color: var(--text-secondary);

        cursor: pointer;
        transition: $transition-normal;

        display: flex;
        align-items: center;
        justify-content: center;

        &:hover:not(:disabled) {
          background: var(--bg-hover);
          color: var(--text-primary);
          transform: translateY(-1px);
        }

        &:active:not(:disabled) {
          transform: scale(0.97);
        }

        &.active {
          background: linear-gradient(135deg, var(--primary), #8b5cf6);
          border-color: var(--primary);
          color: #fff;

          box-shadow: 0 6px 20px rgba(var(--primary-rgb), 0.45),
            inset 0 1px 0 rgba(255, 255, 255, 0.25);
        }

        &:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
      }
    }

    /* =========================
       保存路径
       ========================= */
    .path-input-group {
      display: flex;
      align-items: center;
      gap: 8px;

      input {
        flex: 1;
        height: 36px;
        padding: 0 10px;
        border-radius: $radius-md;

        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        font-size: 12px;

        &:disabled {
          opacity: 0.6;
        }
      }

      .path-actions {
        display: flex;
        gap: 6px;

        .icon-btn {
          width: 36px;
          height: 36px;
          border-radius: $radius-md;

          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          cursor: pointer;
          transition: $transition-fast;

          display: flex;
          align-items: center;
          justify-content: center;

          &:hover:not(:disabled) {
            background: var(--bg-hover);
            color: var(--text-primary);
          }

          &:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }

          svg {
            width: 16px;
            height: 16px;
          }
        }
      }
    }

    /* =========================
       系统资源监控
       ========================= */
    .monitor-section {
      .monitor-item {
        padding: 2px 16px;
        border-radius: $radius-lg;
        // background: var(--bg-tertiary);
        // border: 1px solid var(--border-color);
        display: flex;
        flex-direction: column;
        gap: 8px;

        .monitor-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);

          .monitor-value {
            font-family: "JetBrains Mono", monospace;
            color: var(--text-primary);
          }
        }

        .monitor-detail {
          font-size: 11px;
          color: var(--text-muted);
        }

        .monitor-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, auto);
          gap: 6px 16px;
          font-size: 11px;

          .detail-item {
            display: flex;
            gap: 4px;
            align-items: center;

            .detail-label {
              color: var(--text-muted);
            }

            .detail-value {
              font-family: "JetBrains Mono", monospace;
              color: var(--text-primary);
            }
          }
        }
      }
    }

    /* =========================
       更新提示
       ========================= */
    .update-section {
      .update-info {
        padding: 14px 16px;
        border-radius: $radius-lg;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        display: flex;
        flex-direction: column;
        gap: 10px;

        .update-msg {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.6;
        }
      }
    }
  }

  /* =========================
     Footer
     ========================= */
  .shortcuts-footer {
    padding: 12px;
    display: flex;
    justify-content: center;
    gap: 32px;
    background: var(--bg-secondary);
    border-top: 1px solid var(--border-color);

    .shortcut-tip {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--text-muted);

      kbd {
        padding: 4px 8px;
        background: var(--bg-tertiary);
        border-radius: $radius-sm;
        border: 1px solid var(--border-color);
        font-family: "JetBrains Mono", monospace;
      }
    }
  }
}

/* =========================
   动画
   ========================= */
@keyframes pulse-ring {
  from {
    transform: scale(0.6);
    opacity: 0.6;
  }
  to {
    transform: scale(1.4);
    opacity: 0;
  }
}

/* =========================
   Element Plus 深度样式
   ========================= */
:deep(.el-slider__runway),
:deep(.el-progress-bar__outer) {
  background: var(--bg-tertiary) !important;
}

/* =========================
   更新通知
   ========================= */
.update-notification {
  position: fixed;
  top: 44px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;

  .update-content {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 320px;
    padding: 12px 16px;
    border-radius: $radius-lg;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
    backdrop-filter: blur(12px);

    animation: slideInTop 0.3s ease-out;
  }

  .update-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--bg-tertiary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    svg {
      width: 18px;
      height: 18px;
      color: var(--primary);
    }
  }

  .update-info {
    flex: 1;

    .update-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 2px;
    }

    .update-msg {
      font-size: 12px;
      color: var(--text-secondary);
      margin-bottom: 6px;
      line-height: 1.4;
    }

    .update-progress {
      position: relative;
      height: 6px;
      background: var(--bg-tertiary);
      border-radius: 3px;
      overflow: hidden;

      .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, var(--primary), #8b5cf6);
        border-radius: 3px;
        transition: width 0.3s ease;
      }

      .progress-text {
        position: absolute;
        top: -20px;
        right: 0;
        font-size: 11px;
        color: var(--text-secondary);
        background: var(--bg-secondary);
        padding: 2px 6px;
        border-radius: $radius-sm;
        border: 1px solid var(--border-color);
      }
    }
  }

  .update-close {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--bg-tertiary);
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: $transition-fast;
    flex-shrink: 0;

    &:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }

    svg {
      width: 14px;
      height: 14px;
    }
  }
}

@keyframes slideInTop {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideOutTop {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-20px);
  }
}
</style>
