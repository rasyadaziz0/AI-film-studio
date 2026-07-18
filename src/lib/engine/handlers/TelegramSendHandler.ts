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
      let apiMethod: string;
      let bodyPayload: Record<string, any>;

      if (mediaType === "video" || mediaUrl.endsWith(".mp4")) {
        apiMethod = "sendVideo";
        bodyPayload = {
          chat_id: targetChatId,
          video: mediaUrl,
          caption: "🎥 AI Film Studio — Your video is ready!",
        };
      } else if (mediaType === "tts" || mediaUrl.endsWith(".mp3") || mediaUrl.endsWith(".wav")) {
        apiMethod = "sendAudio";
        bodyPayload = {
          chat_id: targetChatId,
          audio: mediaUrl,
          caption: "🎙️ AI Film Studio — Voice over ready!",
        };
      } else if (mediaType === "actor" || mediaUrl.endsWith(".png") || mediaUrl.endsWith(".jpg")) {
        apiMethod = "sendPhoto";
        bodyPayload = {
          chat_id: targetChatId,
          photo: mediaUrl,
          caption: "🎨 AI Film Studio — Character image ready!",
        };
      } else {
        apiMethod = "sendDocument";
        bodyPayload = {
          chat_id: targetChatId,
          document: mediaUrl,
          caption: "📦 AI Film Studio — Media output ready!",
        };
      }

      const telegramApi = process.env.TELEGRAM_API_URL || "https://api.telegram.org";
      const res = await fetch(`${telegramApi}/bot${botToken}/${apiMethod}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error(`[TelegramSendHandler] Telegram API error (${res.status}):`, errBody);
        return `❌ Telegram Send failed (HTTP ${res.status}): ${errBody}`;
      }

      console.log(`[TelegramSendHandler] ✅ Successfully sent ${mediaType} to chat ${targetChatId}`);
      return `✅ Sent to Telegram chat ${targetChatId} via ${apiMethod}`;
    } catch (err: any) {
      console.error("[TelegramSendHandler] Error:", err);
      return `❌ Telegram Send error: ${err?.message || "Unknown error"}`;
    }
  }
}
