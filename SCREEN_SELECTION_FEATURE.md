# 屏幕选择录制功能实现说明

## 功能概述

实现了根据屏幕分辨率和位置自动裁剪对应屏幕区域的录制功能。

## 主要修改

### 1. 完善 getDisplayBounds() 方法

```typescript
private getDisplayBounds() {
  try {
    const displays = screen.getAllDisplays();
    console.log("[FFmpegService] 检测到显示器数量:", displays.length);

    const displayInfo = displays.map((display, index) => ({
      id: index,
      bounds: display.bounds,        // 包含 x, y, width, height
      workArea: display.workArea,
      size: display.size,
      scaleFactor: display.scaleFactor
    }));

    console.log("[FFmpegService] 显示器信息:", displayInfo);
    return displayInfo;
  } catch (error) {
    console.error("[FFmpegService] 获取显示器信息失败:", error);
    return [];
  }
}
```

### 2. 重构 buildFFmpegCommand() 方法

```typescript
private buildFFmpegCommand(config: RecordingConfig, outputPath: string): string[] {
  let inputDevice = "desktop";
  let videoFilter = "scale=trunc(iw/2)*2:trunc(ih/2)*2";

  if (config.sourceId) {
    console.log("[FFmpegService] 使用指定屏幕源:", config.sourceId);

    // 解析屏幕ID (格式: screen:index:id)
    const screenMatch = config.sourceId.match(/screen:(\d+):(\d+)/);
    if (screenMatch) {
      const screenIndex = parseInt(screenMatch[1]);
      const displays = this.getDisplayBounds();

      if (displays[screenIndex]) {
        const display = displays[screenIndex];
        const { x, y, width, height } = display.bounds;

        // 构建裁剪过滤器: crop=width:height:x:y
        videoFilter = `crop=${width}:${height}:${x}:${y},scale=trunc(iw/2)*2:trunc(ih/2)*2`;
        console.log(`[FFmpegService] 为屏幕${screenIndex}设置裁剪:`, `crop=${width}:${height}:${x}:${y}`);
      }
    }
  }
  // ... 其他代码
}
```

## 工作原理

### 1. 屏幕检测

- 使用 `screen.getAllDisplays()` 获取所有连接的显示器信息
- 每个显示器包含边界信息 `{x, y, width, height}`
- `x, y` 是屏幕相对于虚拟桌面的坐标
- `width, height` 是屏幕的分辨率

### 2. 裁剪参数计算

对于屏幕 ID `screen:1:0`：

- 解析出索引 `1`
- 获取第二个显示器的边界信息
- 自动生成裁剪参数：`crop=width:height:x:y`

例如：

- 屏幕 1 位置：x=1920, y=0, width=1920, height=1080
- 生成裁剪参数：`crop=1920:1080:1920:0`

### 3. FFmpeg 命令构建

最终的视频过滤器链：

```
crop=1920:1080:1920:0,scale=trunc(iw/2)*2:trunc(ih/2)*2
```

## 使用示例

### 录制全部屏幕

```javascript
{
  sourceId: "",  // 空字符串表示录制全部屏幕
  // ...
}
```

### 录制特定屏幕

```javascript
{
  sourceId: "screen:0:0",  // 录制第一个屏幕
  // ...
}

{
  sourceId: "screen:1:0",  // 录制第二个屏幕
  // ...
}
```

## 测试验证

创建了测试文件 `test-screen-recording.js` 来验证功能：

- 检测系统中的所有显示器
- 验证不同屏幕 ID 的裁剪参数生成
- 输出详细的调试信息

## 错误处理

1. **屏幕 ID 格式错误**：记录警告并录制全部屏幕
2. **屏幕索引不存在**：记录警告并录制全部屏幕
3. **显示器信息获取失败**：返回空数组并记录错误

## 优势特点

1. **自动化**：无需手动配置裁剪参数
2. **准确性**：基于实际屏幕分辨率和位置计算
3. **兼容性**：支持任意数量和排列的显示器
4. **健壮性**：完善的错误处理机制
5. **可调试**：详细的日志输出便于问题排查

## 注意事项

- 屏幕索引从 0 开始计数
- 裁剪参数基于虚拟桌面坐标系统
- 支持各种屏幕排列方式（水平、垂直、混合）
- 自动处理不同分辨率的屏幕
