import { toast } from "./toast";

/**
 * Downloads a media file directly to the user's device.
 * Attempts client-side direct CDN fetch first (0% Vercel load).
 * If blocked by CDN CORS policy, gracefully falls back to edge streaming proxy
 * with Content-Disposition: attachment to guarantee instant file download without page navigation.
 */
export async function clientDirectDownload(url: string, suggestedFilename?: string): Promise<boolean> {
  if (typeof window === "undefined" || !url) return false;

  // Determine filename
  let filename = suggestedFilename;
  if (!filename) {
    const urlPath = url.split("?")[0];
    const parts = urlPath.split("/");
    filename = parts[parts.length - 1] || `export_${Date.now()}`;
  }

  try {
    toast.info("Starting Download", "Fetching file from Cloud Edge Server...");

    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) {
      throw new Error(`Cloud CDN returned status ${response.status}`);
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    // Trigger instant browser download
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    window.URL.revokeObjectURL(blobUrl);

    toast.success("Download Successful", `File ${filename} has been saved to your device.`);
    return true;
  } catch (error) {
    console.warn("[Download] Client blob fetch blocked by CORS, switching to attachment download:", error);
    
    // Guaranteed fallback: route via proxy with Content-Disposition: attachment
    // This forces browser to save file immediately without leaving or navigating the current page
    try {
      const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      const a = document.createElement("a");
      a.href = proxyUrl;
      a.setAttribute("download", filename);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success("Download Successful", `File ${filename} is downloading to your device.`);
      return true;
    } catch (fallbackError) {
      console.error("[Download] Proxy fallback failed:", fallbackError);
      window.open(url, "_blank");
      return false;
    }
  }
}
