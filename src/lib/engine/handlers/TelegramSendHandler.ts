import { BaseNodeHandler, ExecutionContext } from "./BaseNodeHandler";
import { decrypt } from "../../crypto";

/**
 * TelegramSendHandler — Sends upstream media (video/audio/image) to Telegram.
 * Fetches encrypted bot token from studio_secrets + chat_id from studios table via service role.
 * Supports both output_only (web-triggered) and full_telegram (bot-triggered) modes.
 */
export class TelegramSendHandler extends BaseNodeHandler {
  public async execute(context: ExecutionContext): Promise<string> {
    const { supabase, nodeId, upstreamNodes, studioId, jobId } = context;

    // 1. Find the best upstream media node (prioritize: video > tts > actor > any with output_url)
    const mediaNode =
      upstreamNodes.find((n: any) => n.type === "video" && n.output_url) ||
      upstreamNodes.find((n: any) => n.type === "tts" && n.output_url) ||
      upstreamNodes.find((n: any) => n.type === "actor" && n.output_url) ||
      upstreamNodes.find((n: any) => n.output_url);

    if (!mediaNode?.output_url) {
      const msg = "⚠️ Telegram Send: No upstream media found to send.";
      console.warn(`[TelegramSendHandler] ${msg}`);
      return msg;
    }

    // 2. Fetch chat_id + mode from studios via service role (never exposed to client)
    const { data: studio } = await supabase
      .from("studios")
      .select("telegram_chat_id, telegram_mode")
      .eq("id", studioId)
      .single();

    if (!studio?.telegram_chat_id) {
      const msg = "⚠️ Telegram Send: Chat ID not configured. Go to Telegram Settings.";
      console.warn(`[TelegramSendHandler] ${msg}`);
      return msg;
    }

    if (studio.telegram_mode === "none") {
      return "ℹ️ Telegram mode is disabled. Skipping send.";
    }

    // 3. Fetch encrypted bot token from studio_secrets
    const { data: secrets, error: secretsErr } = await supabase
      .from("studio_secrets")
      .select("encrypted_bot_token, iv, auth_tag, key_version")
      .eq("studio_id", studioId)
      .single();

    if (secretsErr || !secrets?.encrypted_bot_token) {
      const msg = "⚠️ Telegram Send: Bot token not configured in secrets. Go to Telegram Settings.";
      console.warn(`[TelegramSendHandler] ${msg}`);
      return msg;
    }

    let botToken: string;
    try {
      botToken = decrypt(
        secrets.encrypted_bot_token,
        secrets.iv,
        secrets.auth_tag,
        secrets.key_version
      );
    } catch (err: any) {
      const msg = `❌ Telegram Send: Failed to decrypt bot token: ${err?.message || err}`;
      console.error(`[TelegramSendHandler] ${msg}`);
      return msg;
    }

    // 4. Determine chat_id — for full_telegram, prefer the job's chat_id (reply to sender)
    let targetChatId = studio.telegram_chat_id;
    const { data: job } = await supabase
      .from("jobs")
      .select("source, chat_id")
      .eq("id", jobId)
      .single();

    if (job?.source === "telegram" && job?.chat_id) {
      targetChatId = job.chat_id;
    }

    // 5. Determine media type and send accordingly
    const mediaUrl = mediaNode.output_url;
    const mediaType = mediaNode.type;

    console.log(`[TelegramSendHandler] Sending ${mediaType} media to Telegram chat ${targetChatId}...`);

    try {
      let apiMethod = "sendDocument";
      let caption = "📦 AI Film Studio — Media output ready!";

      if (mediaType === "video" || mediaUrl.endsWith(".mp4")) {
        apiMethod = "sendVideo";
        caption = "🎥 AI Film Studio — Your video is ready!";
      } else if (mediaType === "tts" || mediaUrl.endsWith(".mp3") || mediaUrl.endsWith(".wav")) {
        apiMethod = "sendAudio";
        caption = "🎙️ AI Film Studio — Voice over ready!";
      } else if (mediaType === "actor" || mediaUrl.endsWith(".png") || mediaUrl.endsWith(".jpg")) {
        apiMethod = "sendPhoto";
        caption = "🎨 AI Film Studio — Character image ready!";
      }

      // Initialize bot
      const { TelegramBot } = await import("../../../../ecs/src/lib/telegram/TelegramBot");
      const bot = new TelegramBot(secrets as any);

      // Attempt 1: Send via URL (Telegram fetches from R2 directly, up to 20MB)
      try {
        console.log(`[TelegramSendHandler] Attempt 1: Sending ${mediaType} via URL to chat ${targetChatId}...`);
        await bot.sendMediaByUrl(targetChatId, apiMethod, mediaUrl, caption);
        return `✅ Sent to Telegram chat ${targetChatId} via URL`;
      } catch (urlErr: any) {
        console.warn(`[TelegramSendHandler] URL send failed, attempting multipart fallback... (${urlErr.message})`);
      }

      // Attempt 2: Download to buffer and send via multipart (Bypasses Vercel proxy, direct to API up to 50MB)
      try {
        console.log(`[TelegramSendHandler] Attempt 2: Downloading media from ${mediaUrl} for multipart upload...`);
        const mediaRes = await fetch(mediaUrl);
        if (!mediaRes.ok) throw new Error(`Failed to download media from R2: ${mediaRes.statusText}`);
        
        const mediaBlob = await mediaRes.blob();
        
        let filename = "media.mp4";
        if (apiMethod === "sendVideo") filename = "video.mp4";
        else if (apiMethod === "sendAudio") filename = "audio.mp3";
        else if (apiMethod === "sendPhoto") filename = "image.png";

        console.log(`[TelegramSendHandler] Sending multipart data to Telegram...`);
        await bot.sendMediaMultipart(targetChatId, apiMethod, mediaBlob, filename, caption);
        return `✅ Sent to Telegram chat ${targetChatId} via Multipart Upload`;
      } catch (multiErr: any) {
        console.warn(`[TelegramSendHandler] Multipart send failed, attempting text link fallback... (${multiErr.message})`);
      }

      // Attempt 3: Send text message with the URL
      console.log(`[TelegramSendHandler] Attempt 3: Sending text message with link...`);
      await bot.sendMessage(
        targetChatId,
        `⚠️ File terlalu besar untuk dikirim langsung ke Telegram.\n\nUnduh manual di sini:\n${mediaUrl}`
      );
      
      return `✅ Sent text link to Telegram chat ${targetChatId}`;
    } catch (err: any) {
      console.error("[TelegramSendHandler] Fatal Error:", err);
      // Hard fail: throw so the node actually enters 'error' state
      throw new Error(`Telegram Send fatal error: ${err?.message || "Unknown error"}`);
    }
  }
}
