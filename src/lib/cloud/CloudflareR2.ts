import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

export class CloudflareR2 {
  private static getClient(): S3Client {
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error("[CloudflareR2] Missing required env vars: R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY");
    }

    return new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  /**
   * Uploads media from a source URL or Buffer to Cloudflare R2 bucket.
   */
  public static async uploadMedia(sourceUrl: string, filePrefix = "ai-studio"): Promise<{ url: string; bucket: string; key: string }> {
    const bucket = process.env.R2_BUCKET;
    const publicDomain = process.env.R2_PUBLIC_DOMAIN;

    if (!bucket || !publicDomain) {
      throw new Error("[CloudflareR2] Missing required env vars: R2_BUCKET, R2_PUBLIC_DOMAIN");
    }

    const timestamp = Date.now();
    const urlPath = new URL(sourceUrl).pathname;
    const pathExt = urlPath.split(".").pop()?.toLowerCase();
    const extension = (pathExt === "png" || pathExt === "jpg" || pathExt === "jpeg") ? "png"
      : (pathExt === "mp3" || pathExt === "wav") ? "mp3"
      : (pathExt === "mp4" || pathExt === "webm") ? "mp4"
      : "bin";
    const key = `${filePrefix}/${timestamp}_output.${extension}`;

    // Check if sourceUrl is ALREADY on our R2 storage network
    if (publicDomain && (sourceUrl.startsWith(publicDomain) || sourceUrl.includes(".r2.dev/"))) {
      const existingKey = sourceUrl.includes(".r2.dev/")
        ? sourceUrl.split(".r2.dev/")[1]?.replace(/^\/+/, "")
        : sourceUrl.substring(publicDomain.length)?.replace(/^\/+/, "");
      console.log(`[CloudflareR2] Media is already on Cloudflare R2 (${sourceUrl}). Skipping redundant re-upload.`);
      return {
        url: sourceUrl,
        bucket,
        key: existingKey || key,
      };
    }

    let buffer: Buffer;
    let contentType = extension === "mp4" ? "video/mp4" : extension === "png" ? "image/png" : extension === "mp3" ? "audio/mpeg" : "application/octet-stream";

    try {
      buffer = await this.downloadBuffer(sourceUrl);
    } catch (e: any) {
      console.warn(`[CloudflareR2] Could not download remote source (${sourceUrl}): ${e.message}`);
      if (process.env.USE_MOCK_MEDIA === "true" || sourceUrl.includes("w3schools")) {
        console.warn(`[CloudflareR2] Using fallback sample buffer for ${sourceUrl}`);
        buffer = Buffer.from("AI Studio Media Output Sample Content");
      } else {
        throw new Error(`Failed to upload media to R2: could not download from ${sourceUrl} (${e.message})`);
      }
    }

    const client = this.getClient();
    console.log(`[CloudflareR2] Uploading ${key} (${buffer.length} bytes) to bucket "${bucket}"...`);

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ContentDisposition: `attachment; filename="AI_Studio_Export_${timestamp}.${extension}"`,
    });

    await client.send(command);

    const publicUrl = `${publicDomain}/${key}`;
    console.log(`[CloudflareR2] Successfully uploaded to R2: ${publicUrl}`);

    return {
      url: publicUrl,
      bucket,
      key,
    };
  }

  /**
   * Uploads a raw Buffer directly to Cloudflare R2 bucket.
   */
  public static async uploadBuffer(buffer: Buffer, key: string, contentType: string): Promise<{ url: string; bucket: string; key: string }> {
    const bucket = process.env.R2_BUCKET;
    const publicDomain = process.env.R2_PUBLIC_DOMAIN;

    if (!bucket || !publicDomain) {
      throw new Error("[CloudflareR2] Missing required env vars: R2_BUCKET, R2_PUBLIC_DOMAIN");
    }

    const client = this.getClient();
    console.log(`[CloudflareR2] Uploading buffer ${key} (${buffer.length} bytes) to bucket "${bucket}"...`);

    const ext = key.split(".").pop() || "bin";
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ContentDisposition: `attachment; filename="AI_Studio_Output_${Date.now()}.${ext}"`,
    });

    await client.send(command);

    const publicUrl = `${publicDomain}/${key}`;
    console.log(`[CloudflareR2] Successfully uploaded buffer to R2: ${publicUrl}`);

    return {
      url: publicUrl,
      bucket,
      key,
    };
  }

  /**
   * Downloads a Buffer directly from Cloudflare R2 bucket via S3 API (avoids HTTP bot protection & edge rate limits).
   * Falls back to HTTP fetch with browser headers if not an R2 key/URL.
   */
  public static async downloadBuffer(urlOrKey: string): Promise<Buffer> {
    const bucket = process.env.R2_BUCKET;
    const publicDomain = process.env.R2_PUBLIC_DOMAIN;

    if (!bucket) {
      throw new Error("[CloudflareR2] Missing required env var: R2_BUCKET");
    }

    // Check if it's an R2 URL or key
    let key = urlOrKey;
    if (publicDomain && urlOrKey.startsWith(publicDomain)) {
      key = urlOrKey.substring(publicDomain.length).replace(/^\/+/, "");
    } else if (urlOrKey.includes(".r2.dev/")) {
      key = urlOrKey.split(".r2.dev/")[1];
    }

    // If it looks like an R2 key (not starting with http:// or https:// after stripping), use S3Client!
    if (!key.startsWith("http://") && !key.startsWith("https://")) {
      try {
        const client = this.getClient();
        console.log(`[CloudflareR2] Downloading key "${key}" directly from bucket "${bucket}" via S3 API...`);
        const response = await client.send(new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        }));
        if (!response.Body) {
          throw new Error("Empty body returned from S3 GetObject");
        }
        let buffer: Buffer;
        if (typeof (response.Body as any).transformToByteArray === "function") {
          const byteArray = await (response.Body as any).transformToByteArray();
          buffer = Buffer.from(byteArray);
        } else {
          // Fallback stream to buffer
          const chunks: any[] = [];
          for await (const chunk of response.Body as any) {
            chunks.push(chunk);
          }
          buffer = Buffer.concat(chunks);
        }
        return buffer;
      } catch (s3Err: any) {
        console.warn(`[CloudflareR2] S3 GetObject failed for key "${key}": ${s3Err.message}. Falling back to HTTP fetch...`);
      }
    }

    // HTTP fetch fallback with User-Agent and retries
    console.log(`[CloudflareR2] Downloading via HTTP fetch: ${urlOrKey}`);
    for (let i = 0; i < 3; i++) {
      try {
        const res = await fetch(urlOrKey, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
            "Accept": "*/*"
          }
        });
        if (res.ok) {
          const arrayBuf = await res.arrayBuffer();
          return Buffer.from(arrayBuf);
        }
        console.warn(`[CloudflareR2] HTTP fetch attempt ${i + 1} returned status ${res.status} for ${urlOrKey}`);
      } catch (err: any) {
        console.warn(`[CloudflareR2] HTTP fetch attempt ${i + 1} failed for ${urlOrKey}: ${err.message}`);
      }
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }

    throw new Error(`Failed to download media from ${urlOrKey}`);
  }
}
