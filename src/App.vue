<template>
  <div class="app-container">
    <!-- 首次启动引导浮层 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showGuide" class="guide-overlay">
          <div class="guide-modal">
            <div class="guide-header">
              <div class="guide-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="2"
                  />
                  <circle cx="12" cy="12" r="4" fill="currentColor" />
                </svg>
              </div>
              <h2>欢迎使用 UltraClear Recorder</h2>
              <p>轻量级桌面录屏工具</p>
            </div>

            <div class="guide-content">
              <h4>快捷键</h4>
              <div class="shortcut-list">
                <div class="shortcut-row">
                  <kbd>Ctrl+F12</kbd>
                  <span>开始 / 停止录制</span>
                </div>
                <div class="shortcut-row">
                  <kbd>Ctrl+F11</kbd>
                  <span>保存过去 2 分钟回溯</span>
                </div>
                <div class="shortcut-row">
                  <kbd>Ctrl+F10</kbd>
                  <span>截取当前屏幕</span>
                </div>
              </div>
              <p class="guide-tip">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
                    stroke="currentColor"
                    stroke-width="2"
                  />
                  <path
                    d="M12 16v-4M12 8h.01"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
                快捷键全局有效，窗口最小化时也能使用
              </p>
            </div>

            <button class="guide-btn" @click="dismissGuide">开始使用</button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <RecorderView />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import RecorderView from "./components/RecorderView.vue";

const showGuide = ref(false);

onMounted(async () => {
  const config = await window.electronAPI.getConfig();
  if (!config.guideShown) {
    showGuide.value = true;
  }
});

const dismissGuide = async () => {
  showGuide.value = false;
  await window.electronAPI.saveConfig({ guideShown: true });
};
</script>

<style>
/* Google Fonts removed to fix CSP issues */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

.app-container {
  width: 100%;
  height: 100vh;
}

/* 引导浮层 */
.guide-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.guide-modal {
  width: 380px;
  background: linear-gradient(145deg, #1a1a24, #0f0f14);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 32px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
}

.guide-header {
  text-align: center;
  margin-bottom: 28px;
}

.guide-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  color: #6366f1;
}

.guide-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}

.guide-header p {
  font-size: 13px;
  color: #888;
}

.guide-content h4 {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #666;
  margin-bottom: 16px;
}

.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.shortcut-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.shortcut-row kbd {
  min-width: 48px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 8px;
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  text-align: center;
}

.shortcut-row span {
  font-size: 13px;
  color: #ccc;
}

.guide-tip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 10px;
  font-size: 12px;
  color: #a5b4fc;
  margin-bottom: 24px;
}

.guide-tip svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.guide-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.guide-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .guide-modal {
  animation: slideUp 0.4s ease;
}

.fade-leave-active .guide-modal {
  animation: slideDown 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes slideDown {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
}

/* Element Plus 样式覆盖 */
.el-notification {
  background: #1a1a24 !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
}

.el-notification__title {
  color: #fff !important;
}

.el-notification__content {
  color: #aaa !important;
}
</style>
