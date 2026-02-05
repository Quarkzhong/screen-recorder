<template>
  <button
    class="control-btn theme-toggle"
    @click="toggleTheme"
    :title="model === 'dark' ? '切换到浅色模式' : '切换到深色模式'"
  >
    <svg v-if="model === 'dark'" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2" />
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
</template>

<script setup lang="ts">
// 使用 defineModel 接收 v-model 绑定的值
const model = defineModel<"light" | "dark">({ required: true });

// 主题切换函数
const toggleTheme = (event: MouseEvent) => {
  const x = event.clientX;
  const y = event.clientY;

  const endRadius = Math.hypot(
    Math.max(x, innerWidth - x),
    Math.max(y, innerHeight - y)
  );

  // 计算新主题
  const newTheme = model.value === "dark" ? "light" : "dark";

  // 如果不支持 View Transitions，直接更新
  if (!document.startViewTransition) {
    model.value = newTheme;
    return;
  }

  // 使用 View Transitions API
  const transition = document.startViewTransition(() => {
    model.value = newTheme;
  });

  transition.ready.then(() => {
    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`,
    ];

    // 注意：动画方向取决于 *切换前* 的状态（即 model 原值）
    const isSwitchingToDark = newTheme === "dark";
    document.documentElement.animate(
      {
        clipPath: isSwitchingToDark ? clipPath : [...clipPath].reverse(),
      },
      {
        duration: 400,
        easing: "ease-in",
        fill: "forwards",
        pseudoElement: isSwitchingToDark
          ? "::view-transition-new(root)"
          : "::view-transition-old(root)",
      }
    );
  });
};
</script>

<style lang="scss" scoped>
.control-btn {
  cursor: pointer;
  border: none;
  background: transparent;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.control-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
}
</style>
