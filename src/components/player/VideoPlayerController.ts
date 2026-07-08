/**
 * VideoPlayerController
 * OOP helper service for media player calculations, formatting, and DOM API abstractions.
 */
export class VideoPlayerController {
  /**
   * Formats raw seconds into MM:SS format.
   */
  public static formatTime(timeInSeconds: number): string {
    if (isNaN(timeInSeconds) || timeInSeconds <= 0) return "00:00";
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  /**
   * Calculates time in seconds based on scrub percentage (0-100).
   */
  public static calculateScrubTime(progressPercent: number, duration: number): number {
    if (duration <= 0) return 0;
    return (progressPercent / 100) * duration;
  }

  /**
   * Calculates progress percentage (0-100) from current time and duration.
   */
  public static calculateProgress(currentTime: number, duration: number): number {
    if (duration <= 0) return 0;
    return (currentTime / duration) * 100;
  }

  /**
   * Requests full screen on the provided video element.
   */
  public static requestFullscreen(videoElement: HTMLVideoElement | null): void {
    if (!videoElement) return;
    if (videoElement.requestFullscreen) {
      videoElement.requestFullscreen().catch(console.error);
    }
  }

  /**
   * Copies URL to clipboard and returns success status.
   */
  public static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
}
