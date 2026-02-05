const getFFmpegPath = () => {
  try {
    // ffmpeg-static 直接导出路径字符串
    let ffmpegPath = require("ffmpeg-static");

    // 处理 Electron ASAR 打包问题（仅当路径包含 app.asar 时替换）
    if (ffmpegPath.includes("app.asar")) {
      ffmpegPath = ffmpegPath.replace("app.asar", "app.asar.unpacked");
    }

    return ffmpegPath;
  } catch (error) {
    console.error("FFmpeg path error:", error);
    // 后备：依赖系统 PATH 中的 ffmpeg
    return "ffmpeg";
  }
};

const getFFprobePath = () => {
  try {
    const ffprobe = require("@ffprobe-installer/ffprobe");
    return ffprobe.path.replace("app.asar", "app.asar.unpacked");
  } catch (error) {
    console.error("FFprobe path error:", error);
    return "ffprobe";
  }
};
import { desktopCapturer, screen } from "electron";
import { spawn } from "child_process";
import { join } from "path";
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from "fs";

interface RecordingConfig {
  display_id: string;
  sourceId: string;
  frameRate: number;
  bitRate: number;
  format: "mp4" | "mkv" | "webm";
  savePath: string;
}

interface ReplaySegment {
  filePath: string;
  timestamp: number;
  duration: number;
}

export default class FFmpegService {
  private isRecording = false;
  private isReplayBuffering = false;
  private currentProcess: any = null;
  private replaySegments: ReplaySegment[] = [];
  private replayDuration = 120; // 回溯时长（秒）
  private segmentDuration = 10; // 每个片段时长（秒）
  private lastOutputPath: string | null = null;

  constructor() {
    console.log("[FFmpegService] 初始化FFmpeg服务");
  }

  /**
   * 获取屏幕源列表
   */
  async getScreenSources(): Promise<
    { id: string; name: string; thumbnail: string; display_id: string }[]
  > {
    try {
      const sources = await desktopCapturer.getSources({
        types: ["screen"],
        thumbnailSize: { width: 150, height: 150 },
      });

      return sources.map((source) => ({
        id: source.id,
        display_id: source.display_id,
        name: source.name,
        thumbnail: source.thumbnail.toDataURL(),
      }));
    } catch (error) {
      console.error("[FFmpegService] 获取屏幕源失败:", error);
      return [];
    }
  }

  /**
   * 开始录制
   */
  async startRecording(config: RecordingConfig): Promise<boolean> {
    if (this.isRecording) {
      console.warn("[FFmpegService] 录制已在进行中");
      return false;
    }

    try {
      // 确保保存目录存在
      if (!existsSync(config.savePath)) {
        mkdirSync(config.savePath, { recursive: true });
      }

      // 生成文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `recording_${timestamp}.${config.format}`;
      const outputPath = join(config.savePath, fileName);
      this.lastOutputPath = outputPath;

      // 构建FFmpeg命令
      const command = this.buildFFmpegCommand(config, outputPath);

      console.log("[FFmpegService] 开始录制:", command.join(" "));
      console.log("[FFmpegService] 输出路径:", outputPath);

      this.currentProcess = spawn(getFFmpegPath(), command, {
        stdio: ["pipe", "pipe", "pipe"],
      });

      this.setupProcessHandlers(this.currentProcess, "录制");
      this.isRecording = true;

      return true;
    } catch (error) {
      console.error("[FFmpegService] 启动录制失败:", error);
      return false;
    }
  }

  /**
   * 停止录制
   */
  async stopRecording(): Promise<string | null> {
    if (!this.isRecording || !this.currentProcess) {
      console.warn("[FFmpegService] 没有正在进行的录制");
      return null;
    }

    try {
      // 发送停止信号
      if (process.platform === "win32") {
        // Windows下发送q键
        this.currentProcess.stdin.write("q");
      } else {
        // Unix系统发送SIGINT
        this.currentProcess.kill("SIGINT");
      }

      // 等待进程结束
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          if (this.currentProcess) {
            this.currentProcess.kill("SIGKILL");
          }
          resolve(null);
        }, 5000);

        this.currentProcess.on("exit", () => {
          clearTimeout(timeout);
          resolve(null);
        });
      });

      const outputPath = this.lastOutputPath;
      this.isRecording = false;
      this.currentProcess = null;
      this.lastOutputPath = null;

      console.log("[FFmpegService] 录制已停止，文件保存至:", outputPath);
      return outputPath;
    } catch (error) {
      console.error("[FFmpegService] 停止录制失败:", error);
      this.isRecording = false;
      this.currentProcess = null;
      this.lastOutputPath = null;
      return null;
    }
  }

  /**
   * 开始回溯缓冲
   */
  async startReplayBuffer(config: RecordingConfig): Promise<boolean> {
    if (this.isReplayBuffering) {
      console.warn("[FFmpegService] 回溯缓冲已在运行");
      return false;
    }

    try {
      // 清理旧的回溯片段
      this.cleanupReplaySegments();

      // 确保临时目录存在
      const tempDir = join(config.savePath, "replay_temp");
      console.log("[FFmpegService] 回溯临时目录:", tempDir);
      if (!existsSync(tempDir)) {
        mkdirSync(tempDir, { recursive: true });
        console.log("[FFmpegService] 创建临时目录成功");
      } else {
        console.log("[FFmpegService] 临时目录已存在");
      }

      // 启动循环录制
      await this.startSegmentedRecording(config, tempDir);
      this.isReplayBuffering = true;

      console.log("[FFmpegService] 回溯缓冲已启动");
      return true;
    } catch (error) {
      console.error("[FFmpegService] 启动回溯缓冲失败:", error);
      return false;
    }
  }

  /**
   * 停止回溯缓冲
   */
  async stopReplayBuffer(): Promise<void> {
    if (!this.isReplayBuffering) return;

    try {
      await this.stopRecording();
      this.isReplayBuffering = false;
      console.log("[FFmpegService] 回溯缓冲已停止");
    } catch (error) {
      console.error("[FFmpegService] 停止回溯缓冲失败:", error);
    }
  }

  /**
   * 保存回溯录制
   */
  async saveReplayRecording(config: RecordingConfig): Promise<string | null> {
    if (this.replaySegments.length === 0) {
      console.warn("[FFmpegService] 回溯缓冲区为空");
      return null;
    }

    try {
      // 过滤出最近120秒的片段
      const cutoffTime = Date.now() - this.replayDuration * 1000;
      const recentSegments = this.replaySegments
        .filter((segment) => segment.timestamp > cutoffTime)
        .sort((a, b) => a.timestamp - b.timestamp);

      if (recentSegments.length === 0) {
        console.warn("[FFmpegService] 没有可用的回溯数据");
        return null;
      }

      // 生成输出文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `replay_${timestamp}.mkv`;
      const outputPath = join(config.savePath, fileName);

      if (recentSegments.length === 1) {
        // 只有一个片段，直接复制
        require("fs").copyFileSync(recentSegments[0].filePath, outputPath);
        console.log("[FFmpegService] 回溯录制保存完成:", outputPath);
        return outputPath;
      } else {
        // 多个片段需要合并
        return await this.mergeSegments(recentSegments, outputPath);
      }
    } catch (error) {
      console.error("[FFmpegService] 保存回溯录制失败:", error);
      return null;
    }
  }

  /**
   * 截图功能
   */
  async takeScreenshot(
    sourceId: string,
    savePath: string
  ): Promise<string | null> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `screenshot_${timestamp}.png`;
      const outputPath = join(savePath, fileName);

      // 确保保存目录存在
      if (!existsSync(savePath)) {
        mkdirSync(savePath, { recursive: true });
      }

      // 获取物理像素坐标
      let x = 0;
      let y = 0;
      let width = 0;
      let height = 0;
      let useOffsets = false;

      if (sourceId) {
        const displays = this.getDisplayBounds();
        const display = displays.find((i) => i.id + "" === sourceId);
        if (display) {
          const scale = display.scaleFactor || 1;
          x = Math.round(display.bounds.x * scale);
          y = Math.round(display.bounds.y * scale);
          width = Math.round(display.bounds.width * scale);
          height = Math.round(display.bounds.height * scale);
          useOffsets = true;
        }
      }

      // 构建截图命令
      const command = [
        "-f",
        "gdigrab",
      ];

      if (useOffsets) {
        command.push("-offset_x", x.toString());
        command.push("-offset_y", y.toString());
        command.push("-video_size", `${width}x${height}`);
      }

      command.push(
        "-i",
        "desktop",
        "-vframes",
        "1",
        "-y",
        outputPath
      );

      console.log("[FFmpegService] 执行截图:", command.join(" "));
      const process = spawn(getFFmpegPath(), command);

      return new Promise((resolve) => {
        process.on("close", (code) => {
          if (code === 0 && existsSync(outputPath)) {
            console.log("[FFmpegService] 截图保存完成:", outputPath);
            resolve(outputPath);
          } else {
            console.error("[FFmpegService] 截图失败，退出码:", code);
            resolve(null);
          }
        });

        process.on("error", (error) => {
          console.error("[FFmpegService] 截图进程错误:", error);
          resolve(null);
        });
      });
    } catch (error) {
      console.error("[FFmpegService] 截图失败:", error);
      return null;
    }
  }

  /**
   * 获取录制状态
   */
  getRecordingStatus(): { isRecording: boolean; isReplayBuffering: boolean } {
    return {
      isRecording: this.isRecording,
      isReplayBuffering: this.isReplayBuffering,
    };
  }

  /**
   * 获取所有显示器的信息和边界
   */
  private getDisplayBounds() {
    try {
      const displays = screen.getAllDisplays();

      return displays;
    } catch (error) {
      return [];
    }
  }
  /**
   * 构建FFmpeg命令
   */
  private buildFFmpegCommand(
    config: RecordingConfig,
    outputPath: string
  ): string[] {
    // 根据sourceId确定输入设备和裁剪参数
    let inputDevice = "desktop";
    let videoFilter = "scale=trunc(iw/2)*2:trunc(ih/2)*2";
    let x = 0;
    let y = 0;
    let width = 0;
    let height = 0;
    let useOffsets = false;

    // 如果指定了特定屏幕，获取物理像素坐标
    if (config.sourceId) {
      const displays = this.getDisplayBounds();
      const display = displays.find((i) => i.id + "" === config.sourceId);
      console.log("[FFmpegService] 匹配显示器:", config.sourceId, display);
      
      if (display) {
        const scale = display.scaleFactor || 1;
        x = Math.round(display.bounds.x * scale);
        y = Math.round(display.bounds.y * scale);
        width = Math.round(display.bounds.width * scale);
        height = Math.round(display.bounds.height * scale);
        useOffsets = true;
        
        // 仍然建议使用 scale 滤镜确保宽高为偶数，这是 H.264 编码的要求
        videoFilter = "scale=trunc(iw/2)*2:trunc(ih/2)*2";
        console.log(`[FFmpegService] 物理区域: ${width}x${height} offset: ${x},${y}`);
      }
    }

    const command = [
      "-f",
      "gdigrab",
      "-framerate",
      config.frameRate.toString(),
    ];

    // 如果选择了特定屏幕，设置 gdigrab 的捕获参数
    if (useOffsets) {
      command.push("-offset_x", x.toString());
      command.push("-offset_y", y.toString());
      command.push("-video_size", `${width}x${height}`);
    }

    command.push("-i", inputDevice);
    
    // 添加滤镜和其他编码参数
    command.push(
      "-vf",
      videoFilter,
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-pix_fmt",
      "yuv420p",
      "-b:v",
      `${config.bitRate}k`,
      "-bufsize",
      `${config.bitRate * 2}k`,
      "-g",
      (config.frameRate * 2).toString()
    );

    // 根据格式添加特定参数
    switch (config.format) {
      case "mp4":
        command.push("-f", "mp4");
        break;
      case "mkv":
        command.push("-f", "matroska");
        break;
      case "webm":
        command.push("-c:v", "libvpx-vp9", "-f", "webm");
        break;
    }

    // 强制覆盖输出文件
    command.push("-y", outputPath);
    return command;
  }

  /**
   * 启动分段录制（用于回溯）
   */
  private async startSegmentedRecording(
    config: RecordingConfig,
    tempDir: string
  ): Promise<void> {
    const segmentConfig = {
      ...config,
      bitRate: Math.min(config.bitRate, 25000), // 降低回溯码率
      format: "mkv" as const,
    };

    const startNextSegment = async () => {
      if (!this.isReplayBuffering) return;

      const timestamp = Date.now();
      const fileName = `segment_${timestamp}.mkv`;
      const outputPath = join(tempDir, fileName);

      const command = this.buildFFmpegCommand(segmentConfig, outputPath);
      // 添加时间限制
      const yIndex = command.indexOf("-y");
      if (yIndex !== -1) {
        command.splice(yIndex, 0, "-t", this.segmentDuration.toString());
      } else {
        command.push("-t", this.segmentDuration.toString());
      }

      console.log(
        `[FFmpegService] 启动分段录制-${timestamp}:`,
        command.join(" ")
      );
      console.log(`[FFmpegService] 输出路径:`, outputPath);

      const process = spawn(getFFmpegPath(), command);

      this.setupProcessHandlers(process, `分段录制-${timestamp}`);

      process.on("exit", (code) => {
        console.log(`[FFmpegService] 分段录制-${timestamp} 退出码:`, code);
        console.log(
          `[FFmpegService] 检查文件是否存在:`,
          existsSync(outputPath)
        );

        if (code === 0 && existsSync(outputPath)) {
          const stats = require("fs").statSync(outputPath);
          console.log(`[FFmpegService] 文件大小:`, stats.size, "字节");

          if (stats.size > 0) {
            this.replaySegments.push({
              filePath: outputPath,
              timestamp: timestamp,
              duration: this.segmentDuration,
            });
            console.log(
              `[FFmpegService] 成功添加片段，当前片段数:`,
              this.replaySegments.length
            );
          } else {
            console.warn(`[FFmpegService] 文件为空，忽略该片段`);
            // 删除空文件
            try {
              unlinkSync(outputPath);
            } catch (e) {
              console.warn("[FFmpegService] 删除空文件失败:", e);
            }
          }
        } else {
          console.error(`[FFmpegService] 分段录制失败，代码:`, code);
          // 删除可能创建的损坏文件
          if (existsSync(outputPath)) {
            try {
              unlinkSync(outputPath);
            } catch (e) {
              console.warn("[FFmpegService] 删除损坏文件失败:", e);
            }
          }
        }

        // 清理旧片段并启动下一个
        this.cleanupReplaySegments();
        setTimeout(startNextSegment, 100);
      });
    };

    startNextSegment();
  }

  /**
   * 清理过期的回溯片段
   */
  private cleanupReplaySegments(): void {
    const cutoffTime = Date.now() - (this.replayDuration + 60) * 1000; // 保留更多缓冲时间

    this.replaySegments = this.replaySegments.filter((segment) => {
      if (segment.timestamp < cutoffTime) {
        // 只有在文件存在且不是最近的片段时才删除
        if (existsSync(segment.filePath)) {
          try {
            unlinkSync(segment.filePath);
            console.log("[FFmpegService] 已删除过期片段:", segment.filePath);
          } catch (error) {
            console.warn("[FFmpegService] 删除旧片段失败:", error);
          }
        }
        return false;
      }
      return true;
    });

    console.log(
      "[FFmpegService] 回溯缓冲区片段数量:",
      this.replaySegments.length
    );
  }

  /**
   * 合并多个片段
   */
  private async mergeSegments(
    segments: ReplaySegment[],
    outputPath: string
  ): Promise<string> {
    // 创建临时文件列表
    const tempDir = join(outputPath, "..", "replay_temp");
    const fileListPath = join(tempDir, "file_list.txt");

    const fileContent = segments
      .map((segment) => `file '${segment.filePath.replace(/'/g, "'\\''")}'`)
      .join("\n");

    writeFileSync(fileListPath, fileContent);

    return new Promise((resolve, reject) => {
      const command = [
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        fileListPath,
        "-c",
        "copy",
        "-y",
        outputPath,
      ];

      const process = spawn(getFFmpegPath(), command);

      process.on("close", (code) => {
        if (code === 0 && existsSync(outputPath)) {
          console.log("[FFmpegService] 片段合并完成:", outputPath);
          resolve(outputPath);
        } else {
          console.error("[FFmpegService] 片段合并失败，退出码:", code);
          reject(new Error(`合并失败，退出码: ${code}`));
        }
      });

      process.on("error", (error) => {
        console.error("[FFmpegService] 合并进程错误:", error);
        reject(error);
      });
    });
  }

  /**
   * 设置进程事件处理器
   */
  private setupProcessHandlers(process: any, name: string): void {
    process.stdout.on("data", (data: Buffer) => {
      const message = data.toString().trim();
      if (message) {
        console.log(`[FFmpeg-${name}-stdout]`, message);
      }
    });

    process.stderr.on("data", (data: Buffer) => {
      const message = data.toString().trim();
      if (message) {
        if (
          message.includes("error") ||
          message.includes("Error") ||
          message.includes("failed")
        ) {
          console.error(`[FFmpeg-${name}-stderr]`, message);
        } else {
          console.debug(`[FFmpeg-${name}-stderr]`, message);
        }
      }
    });

    process.on("error", (error: Error) => {
      console.error(`[FFmpeg-${name}] 进程错误:`, error.message);
      this.handleError(name, error);
    });

    process.on("exit", (code: number) => {
      console.log(`[FFmpeg-${name}] 进程退出，代码:`, code);
      if (code !== 0 && code !== null) {
        console.warn(`[FFmpeg-${name}] 非正常退出，代码:`, code);
      }
    });
  }

  /**
   * 统一错误处理
   */
  private handleError(operation: string, error: Error): void {
    console.error(`[FFmpegService] ${operation} 发生错误:`, error.message);

    // 根据错误类型进行不同处理
    if (error.message.includes("ENOENT")) {
      console.error("[FFmpegService] FFmpeg可执行文件未找到，请检查安装");
    } else if (error.message.includes("EACCES")) {
      console.error("[FFmpegService] 权限不足，请检查文件权限");
    }

    // 重置状态
    if (operation.includes("录制")) {
      this.isRecording = false;
      this.currentProcess = null;
    } else if (operation.includes("回溯")) {
      this.isReplayBuffering = false;
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const ffmpegPath = getFFmpegPath();
      const { spawn } = require("child_process");

      return new Promise((resolve) => {
        const process = spawn(ffmpegPath, ["-version"], { timeout: 5000 });
        let output = "";

        process.stdout.on("data", (data: Buffer) => {
          output += data.toString();
        });

        process.on("close", (code: number) => {
          resolve(code === 0 && output.includes("ffmpeg version"));
        });

        process.on("error", () => {
          resolve(false);
        });
      });
    } catch (error) {
      console.error("[FFmpegService] 健康检查失败:", error);
      return false;
    }
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    await this.stopRecording();
    await this.stopReplayBuffer();
    console.log("[FFmpegService] 服务已清理");
  }
}
