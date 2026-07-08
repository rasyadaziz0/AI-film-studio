/**
 * Magic-byte detection for image file validation.
 * Never trust file.type from the client.
 */

const MAGIC_BYTES = [
  { mime: "image/jpeg", bytes: [0xFF, 0xD8, 0xFF], length: 3 },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4E, 0x47], length: 4 },
  // WebP: RIFF....WEBP
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46], length: 4, extraCheck: (h: Uint8Array) => 
    h[8] === 0x57 && h[9] === 0x45 && h[10] === 0x42 && h[11] === 0x50
  },
] as const;

export function detectMimeFromMagicBytes(header: Uint8Array): string | null {
  for (const entry of MAGIC_BYTES) {
    let match = true;
    for (let i = 0; i < entry.length; i++) {
      if (header[i] !== entry.bytes[i]) {
        match = false;
        break;
      }
    }
    if (match) {
      if ("extraCheck" in entry && entry.extraCheck && !entry.extraCheck(header)) {
        continue;
      }
      return entry.mime;
    }
  }
  return null;
}

export const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const ALLOWED_IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Maximum upload file size in bytes (5 MB) */
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
