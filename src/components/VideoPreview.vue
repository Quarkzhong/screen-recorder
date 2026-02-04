<template>
  <div class="video-preview-container">
    <video
      ref="videoRef"
      autoplay
      playsinline
      muted
      class="preview-video"
    ></video>
    <div v-if="loading" class="preview-loading">加载中...</div>
    <div v-if="error" class="preview-error">预览加载失败</div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted, watch } from "vue";

const props = defineProps<{
  sourceId: string | undefined;
  active: boolean;
}>();

const videoRef = ref<HTMLVideoElement | null>(null);
const stream = shallowRef<MediaStream | null>(null);
const error = ref(false);
const loading = ref(false);

const stopStream = () => {
  if (stream.value) {
    stream.value.getTracks().forEach((t: MediaStreamTrack) => t.stop());
    stream.value = null;
  }
};

const startStream = async () => {
  if (!props.sourceId) return;
  stopStream();

  try {
    loading.value = true;
    error.value = false;
    // 为 Electron 优化的视频请求约束
    const constraints: any = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: props.sourceId,
          // 如果 OverconstrainedError 持续出现，降低要求
          minWidth: 160,
          maxWidth: 1280,
          minHeight: 90,
          maxHeight: 720,
          maxFrameRate: 30,
        },
      },
    };
    let s: MediaStream;
    try {
      s = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err: any) {
      console.log("[ err ]-62", err);
      if (err.name === "OverconstrainedError") {
        console.warn("High-res constraints failed, falling back to minimal");
        // 最基础的回退约束
        const fallback: any = {
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: "desktop",
              chromeMediaSourceId: props.sourceId,
            },
          },
        };
        s = await navigator.mediaDevices.getUserMedia(fallback);
      } else {
        throw err;
      }
    }

    stream.value = s;
    if (videoRef.value) {
      videoRef.value.srcObject = s;
      // 手动触发 play 以防 autoplay 失效
      videoRef.value.onloadedmetadata = () => {
        videoRef.value
          ?.play()
          .catch((e) => console.warn("Play interrupted", e));
        loading.value = false;
      };
    }
  } catch (e: any) {
    console.warn("Preview stream failed", e);
    error.value = true;
    loading.value = false;
  }
};

onMounted(() => {
  startStream();
});

onUnmounted(() => {
  stopStream();
});

watch(
  () => props.sourceId,
  (newId: string | undefined) => {
    if (newId) startStream();
    else stopStream();
  }
);
</script>

<style scoped>
.video-preview-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-error,
.preview-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #606070;
  background: #16161d;
}
</style>
