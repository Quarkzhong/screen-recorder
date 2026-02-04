// 测试屏幕录制功能
const { app, screen } = require('electron');

// 模拟 FFmpegService 的核心功能
class TestFFmpegService {
    getDisplayBounds() {
        try {
            const displays = screen.getAllDisplays();
            console.log("[TestFFmpegService] 检测到显示器数量:", displays.length);

            const displayInfo = displays.map((display, index) => ({
                id: index,
                bounds: display.bounds,
                workArea: display.workArea,
                size: display.size,
                scaleFactor: display.scaleFactor
            }));

            console.log("[TestFFmpegService] 显示器信息:", displayInfo);
            return displayInfo;
        } catch (error) {
            console.error("[TestFFmpegService] 获取显示器信息失败:", error);
            return [];
        }
    }

    buildFFmpegCommand(config) {
        let videoFilter = "scale=trunc(iw/2)*2:trunc(ih/2)*2";

        console.log("[TestFFmpegService] 配置信息:", config);

        if (config.sourceId) {
            console.log("[TestFFmpegService] 使用指定屏幕源:", config.sourceId);

            const screenMatch = config.sourceId.match(/screen:(\d+):(\d+)/);
            if (screenMatch) {
                const screenIndex = parseInt(screenMatch[1]);
                const displays = this.getDisplayBounds();

                if (displays[screenIndex]) {
                    const display = displays[screenIndex];
                    const { x, y, width, height } = display.bounds;

                    videoFilter = `crop=${width}:${height}:${x}:${y},scale=trunc(iw/2)*2:trunc(ih/2)*2`;
                    console.log(`[TestFFmpegService] 为屏幕${screenIndex}设置裁剪:`, `crop=${width}:${height}:${x}:${y}`);
                    console.log(`[TestFFmpegService] 屏幕${screenIndex}信息:`, display);
                } else {
                    console.warn(`[TestFFmpegService] 未找到屏幕索引 ${screenIndex}，录制全部屏幕`);
                }
            } else {
                console.warn("[TestFFmpegService] 屏幕ID格式不正确，录制全部屏幕");
            }
        } else {
            console.log("[TestFFmpegService] 录制全部屏幕");
        }

        return videoFilter;
    }
}

// 测试函数
async function testScreenRecording() {
    const service = new TestFFmpegService();

    console.log("=== 测试多屏幕信息获取 ===");
    const displays = service.getDisplayBounds();

    console.log("\n=== 测试不同屏幕录制配置 ===");

    // 测试录制全部屏幕
    console.log("\n1. 录制全部屏幕:");
    const allScreensConfig = {
        sourceId: "",
        frameRate: 30,
        bitRate: 5000,
        format: "mp4"
    };
    console.log("视频过滤器:", service.buildFFmpegCommand(allScreensConfig));

    // 测试录制第一个屏幕
    console.log("\n2. 录制第一个屏幕:");
    const screen0Config = {
        sourceId: "screen:0:0",
        frameRate: 30,
        bitRate: 5000,
        format: "mp4"
    };
    console.log("视频过滤器:", service.buildFFmpegCommand(screen0Config));

    // 测试录制第二个屏幕（如果存在）
    if (displays.length > 1) {
        console.log("\n3. 录制第二个屏幕:");
        const screen1Config = {
            sourceId: "screen:1:0",
            frameRate: 30,
            bitRate: 5000,
            format: "mp4"
        };
        console.log("视频过滤器:", service.buildFFmpegCommand(screen1Config));
    }

    console.log("\n=== 测试完成 ===");
}

// 在 Electron 环境中运行测试
if (typeof app !== 'undefined') {
    app.whenReady().then(() => {
        testScreenRecording().catch(console.error);
    });
} else {
    console.log("请在 Electron 环境中运行此测试");
}