import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/requireAuth";
import { detectMimeFromMagicBytes, MIME_TO_EXT, ALLOWED_IMAGE_MIMES, MAX_UPLOAD_SIZE } from "@/lib/auth/validateUpload";

export async function POST(request: Request) {
  try {
    // 1. Auth
    const { user } = await requireAuth(request);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 2. Check size BEFORE reading buffer
    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: `File too large (max ${MAX_UPLOAD_SIZE / 1024 / 1024} MB)` },
        { status: 413 }
      );
    }

    // 3. Read buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Magic-byte validation (don't trust file.type)
    const header = new Uint8Array(arrayBuffer.slice(0, 12));
    const mimeFromMagic = detectMimeFromMagicBytes(header);

    if (!mimeFromMagic || !ALLOWED_IMAGE_MIMES.has(mimeFromMagic)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and WebP images are allowed" },
        { status: 415 }
      );
    }

    // 5. Random UUID filename (never use user-supplied names)
    const ext = MIME_TO_EXT[mimeFromMagic] || "bin";
    const filename = `actor-upload/${crypto.randomUUID()}.${ext}`;

    // 6. Upload to Cloudflare R2
    const { CloudflareR2 } = await import("@/lib/cloud/CloudflareR2");
    const result = await CloudflareR2.uploadBuffer(buffer, filename, mimeFromMagic);

    return NextResponse.json({ url: result.url });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[upload-actor] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
