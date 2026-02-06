<template>
  <div class="resource-monitor-chart">
    <div class="chart-title">
      {{ chartTitle }}
    </div>
    <div
      :id="chartId"
      class="chart"
      :style="{ height: chartHeight + 'px' }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import * as echarts from "echarts";

// 定义组件props
interface Props {
  chartId: string;
  chartTitle: string;
  chartType: "cpu" | "memory" | "handle";
  chartData: number[];
  timestamps: string[];
  chartHeight?: number;
  maxValue?: number;
  unit?: string;
  color?: string;
}

const props = withDefaults(defineProps<Props>(), {
  chartHeight: 120,
  maxValue: undefined,
  unit: "",
  color: "#6366f1",
});

// 图表实例引用
let chartInstance: echarts.ECharts | null = null;

// 初始化图表
const initChart = () => {
  const chartDom = document.getElementById(props.chartId);
  if (chartDom) {
    chartInstance = echarts.init(chartDom);

    const option = {
      title: {
        text: props.chartTitle,
        textStyle: {
          fontSize: 12,
          fontWeight: "normal",
          color: "var(--text-secondary)",
        },
        left: "center",
        top: 6,
      },
      grid: {
        left: "0%",
        right: "0%",
        bottom: "0%",
        top: "10%",
        containLabel: true,
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-color)",
        textStyle: {
          color: "var(--text-primary)",
        },
        formatter: function (params: any) {
          const item = params[0];
          return (
            item.axisValue +
            "<br/>" +
            props.chartTitle +
            ": " +
            item.value +
            (props.unit ? props.unit : "")
          );
        },
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: props.timestamps,
        axisLine: {
          lineStyle: {
            color: "var(--border-color)",
          },
        },
        axisTick: {
          lineStyle: {
            color: "var(--border-color)",
          },
        },
        axisLabel: {
          fontSize: 10,
          color: "var(--text-muted)",
        },
      },
      yAxis: {
        type: "value",
        axisLine: {
          show: true,
          lineStyle: {
            color: "var(--border-color)",
          },
        },
        axisTick: {
          show: true,
          lineStyle: {
            color: "var(--border-color)",
          },
        },
        splitLine: {
          lineStyle: {
            color: "var(--border-color)",
            type: "dashed",
          },
        },
        axisLabel: {
          fontSize: 10,
          color: "var(--text-muted)",
        },
      },
      series: [
        {
          name: props.chartTitle,
          type: "line",
          data: props.chartData,
          smooth: true,
          lineStyle: {
            color: props.color,
            width: 2,
          },
          itemStyle: {
            color: props.color,
          },
          areaStyle: {
            opacity: 0.1,
          },
          symbolSize: 0, // 隐藏数据点
        },
      ],
    };

    chartInstance.setOption(option);
  }
};

// 更新图表数据
const updateChart = () => {
  if (!chartInstance) {
    initChart();
  }
  if (chartInstance) {
    chartInstance.setOption({
      xAxis: {
        data: props.timestamps,
      },
      series: [
        {
          data: props.chartData,
        },
      ],
    });
  }
};
// 监听数据变化并更新图表
watch(
  () => [props.chartData, props.timestamps],
  () => {
    updateChart();
  },
  { deep: true }
);
// 组件挂载时初始化图表
onMounted(() => {
  initChart();

  window.addEventListener("resize", () => {
    if (chartInstance) {
      chartInstance.resize();
    }
  });
});

// 组件卸载时销毁图表实例
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose();
  }
});

// 当组件属性发生变化时，重新调整图表大小
defineExpose({
  resize: () => {
    if (chartInstance) {
      chartInstance.resize();
    }
  },
});
</script>

<style scoped>
.resource-monitor-chart {
  width: 100%;
  margin-bottom: 12px;
}

.chart-title {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.chart {
  width: 100%;
  background: var(--bg-tertiary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}
</style>
