import path from "path";
import fs from "fs";
import os from "os";
import { spawn } from "child_process";

/**
 * VideoStitcher — Concatenates multiple .mp4 clips into one using FFmpeg.
 * Uses ffmpeg-static for zero-install binary support on Windows/Linux/Mac.
 * Executes FFmpeg via spawn() with argument arrays (no shell, no deprecated fluent-ffmpeg).
 */
export class VideoStitcher {
  /**
   * Resolves the ffmpeg binary path from ffmpeg-static or fallback locations.
   */
  private static async getFfmpegPath(): Promise<string> {
    try {
      const ffmpegStatic = (await import("ffmpeg-static")).default;
      if (ffmpegStatic && fs.existsSync(ffmpegStatic)) {
        return ffmpegStatic;
      }
    } catch (e) {
      // ignore import error
    }

    const ext = process.platform === "win32" ? ".exe" : "";
    const cwdPath = path.join(process.cwd(), "node_modules", "ffmpeg-static", `ffmpeg${ext}`);
    if (fs.existsSync(cwdPath)) {
      return cwdPath;
    }

    if (fs.existsSync("/usr/bin/ffmpeg")) return "/usr/bin/ffmpeg";
    if (fs.existsSync("/usr/local/bin/ffmpeg")) return "/usr/local/bin/ffmpeg";

    return "ffmpeg";
  }

  /**
   * Runs an FFmpeg command with the given arguments via spawn().
   * Returns a promise that resolves on exit code 0 and rejects on error.
   */
  private static async runFfmpeg(args: string[]): Promise<void> {
    const ffmpegPath = await this.getFfmpegPath();
    console.log(`[VideoStitcher] FFmpeg command: ${ffmpegPath} ${args.join(" ")}`);

    return new Promise<void>((resolve, reject) => {
      const proc = spawn(ffmpegPath, args, {
        stdio: ["ignore", "pipe", "pipe"],
        shell: false,
      });

      let stderr = "";

      proc.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      proc.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-500)}`));
        }
      });

      proc.on("error", (err) => {
        reject(new Error(`FFmpeg spawn error: ${err.message}`));
      });
    });
  }

  /**
   * Concatenates an array of video file paths into a single output file.
   * @param clipPaths - Array of absolute paths to .mp4 clip files (in order)
   * @returns Absolute path to the stitched output file
   */
  static async concat(clipPaths: string[]): Promise<string> {
    if (clipPaths.length === 0) throw new Error("No clips to stitch");
    if (clipPaths.length === 1) return clipPaths[0]; // No stitching needed

    // Create a temp directory for the concat list file and output
    const tmpDir = path.join(os.tmpdir(), `ai-studio-stitch-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    // Write concat list file (FFmpeg concat demuxer format)
    const listFilePath = path.join(tmpDir, "concat_list.txt");
    const listContent = clipPaths
      .map((p) => `file '${p.replace(/\\/g, "/")}'`)
      .join("\n");
    fs.writeFileSync(listFilePath, listContent, "utf-8");

    const outputPath = path.join(tmpDir, "stitched_output.mp4");

    console.log(`[VideoStitcher] Stitching ${clipPaths.length} clips into ${outputPath}`);
    console.log(`[VideoStitcher] Concat list:\n${listContent}`);

    await this.runFfmpeg([
      "-f", "concat",
      "-safe", "0",
      "-i", listFilePath,
      "-c", "copy",
      "-y",
      outputPath,
    ]);

    console.log(`[VideoStitcher] Stitching complete: ${outputPath}`);
    return outputPath;
  }

  /**
   * Helper: Fetch URL with automatic retry and exponential backoff for flaky DNS/network.
   */
  private static async fetchWithRetry(url: string, retries = 3, delayMs = 2000): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
            "Accept": "*/*"
          }
        });
        if (res.ok || i === retries - 1) return res;
      } catch (err) {
        console.warn(`[VideoStitcher] Fetch failed (${url.substring(0, 60)}...): ${err}. Retrying (${i + 1}/${retries})...`);
        if (i === retries - 1) throw err;
      }
      await new Promise(r => setTimeout(r, delayMs * (i + 1)));
    }
    return fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
        "Accept": "*/*"
      }
    });
  }

  /**
   * Downloads a video URL to a local temp file using direct R2 S3 API when applicable.
   * @param url - URL to download
   * @param index - Clip index for naming
   * @returns Absolute path to the downloaded file
   */
  static async downloadClip(url: string, index: number): Promise<string> {
    const tmpDir = path.join(os.tmpdir(), "ai-studio-clips");
    fs.mkdirSync(tmpDir, { recursive: true });

    const filePath = path.join(tmpDir, `clip_${Date.now()}_${index}.mp4`);

    console.log(`[VideoStitcher] Downloading clip ${index + 1} from: ${url.substring(0, 80)}...`);

    const { CloudflareR2 } = await import("../cloud/CloudflareR2");
    const buffer = await CloudflareR2.downloadBuffer(url);
    fs.writeFileSync(filePath, buffer);

    console.log(`[VideoStitcher] Clip ${index + 1} saved: ${filePath} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
    return filePath;
  }

  static async muxAudio(videoPath: string, audioUrlOrPath: string): Promise<string> {
    const tmpDir = path.join(os.tmpdir(), `ai-studio-mux-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    let localAudioPath = audioUrlOrPath;
    if (audioUrlOrPath.startsWith("http://") || audioUrlOrPath.startsWith("https://") || audioUrlOrPath.includes(".r2.dev/")) {
      localAudioPath = path.join(tmpDir, `input_audio_${Date.now()}.mp3`);
      console.log(`[VideoStitcher] Downloading TTS audio from ${audioUrlOrPath.substring(0, 80)}...`);
      const { CloudflareR2 } = await import("../cloud/CloudflareR2");
      const buffer = await CloudflareR2.downloadBuffer(audioUrlOrPath);
      fs.writeFileSync(localAudioPath, buffer);
    }

    const outputPath = path.join(tmpDir, "muxed_output.mp4");
    console.log(`[VideoStitcher] Muxing audio ${localAudioPath} into video ${videoPath}...`);

    await this.runFfmpeg([
      "-i", videoPath,
      "-i", localAudioPath,
      "-c:v", "copy",
      "-c:a", "aac",
      "-map", "0:v:0",
      "-map", "1:a:0",
      "-shortest",
      "-y",
      outputPath,
    ]);

    console.log(`[VideoStitcher] Audio muxing complete: ${outputPath}`);

    // Cleanup downloaded audio if applicable
    if (localAudioPath !== audioUrlOrPath && fs.existsSync(localAudioPath)) {
      try { fs.unlinkSync(localAudioPath); } catch { /* ignore */ }
    }

    return outputPath;
  }

  /**
   * Cleanup temp files after upload is done.
   */
  static cleanup(filePaths: string[]) {
    for (const p of filePaths) {
      try {
        if (fs.existsSync(p)) fs.unlinkSync(p);
      } catch { /* ignore cleanup errors */ }
    }
  }
}
