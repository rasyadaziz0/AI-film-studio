import { BaseNodeHandler, ExecutionContext } from "./BaseNodeHandler";
import { executeNodeRequest } from "../../engine";
import { VIDEO_PROMPTS } from "../prompts";

export class VideoHandler extends BaseNodeHandler {
  public async execute(context: ExecutionContext): Promise<string> {
    const { node, nodeId, upstreamNodes, upstreamContext, supabase, jobId, studioId, videoDuration } = context;

    // Reserve first media call
    const callNum = context.reserveMediaCall();

    const clipCount = Math.max(1, Math.floor(videoDuration / 5));
    console.log(`[ServerEngine] Starting Video generation for ${nodeId}... (duration: ${videoDuration}s, clips: ${clipCount}, media call #${callNum})`);
    
    const { DashScopeMedia } = await import("../../ai/providers/DashScopeMedia");
    const actorNode = upstreamNodes.find(n => n.type === "actor" && n.output_url);
    
    let finalUrl: string;
    const ttsNode = upstreamNodes.find(n => n.type === "tts" && n.output_url);

    if (clipCount <= 1) {
      // === Single clip (5s default) ===
      const videoUrl = await DashScopeMedia.generateVideo(upstreamContext, actorNode?.output_url);
      
      if (ttsNode?.output_url) {
        console.log(`[ServerEngine] 🎙️ Upstream TTS audio found! Muxing audio locally into video...`);
        try {
          const { VideoStitcher } = await import("../../video/VideoStitcher");
          const localClip = await VideoStitcher.downloadClip(videoUrl, 0);
          const muxedPath = await VideoStitcher.muxAudio(localClip, ttsNode.output_url);
          
          const fs = await import("fs");
          const fileBuffer = fs.readFileSync(muxedPath);
          const { CloudflareR2 } = await import("../../cloud/CloudflareR2");
          const uploadRes = await CloudflareR2.uploadBuffer(fileBuffer, `video/${Date.now()}_muxed.mp4`, "video/mp4");
          finalUrl = uploadRes.url;
          console.log(`[ServerEngine] 🎉 Muxed audio+video uploaded to R2: ${finalUrl}`);
          VideoStitcher.cleanup([localClip, muxedPath]);
        } catch (muxErr: any) {
          console.error(`[ServerEngine] ⚠️ Failed to mux TTS audio into video:`, muxErr?.message);
          finalUrl = await this.uploadToR2(videoUrl);
        }
      } else {
        finalUrl = await this.uploadToR2(videoUrl);
      }
    } else {
      // === Multi-clip stitching (15s = 3 clips, 30s = 6 clips) ===
      console.log(`[ServerEngine] Multi-clip mode: Splitting narrative into ${clipCount} visual scenes...`);

      // Step 1: Use Qwen to split the upstream narrative into N visual prompts
      const scenePrompts = await this.splitIntoScenes(upstreamContext, clipCount, context);
      
      // Step 2: Generate each clip sequentially
      const clipUrls: string[] = [];
      for (let i = 0; i < scenePrompts.length; i++) {
        console.log(`[ServerEngine] 🎬 Generating clip ${i + 1}/${scenePrompts.length}: "${scenePrompts[i].substring(0, 60)}..."`);
        
        const imageRef = i === 0 ? actorNode?.output_url : undefined;
        
        if (i > 0) {
          try {
            context.reserveMediaCall();
          } catch {
            console.warn(`[ServerEngine] Media budget hit at clip ${i + 1}. Using ${clipUrls.length} clips generated so far.`);
            break;
          }
        }

        const clipUrl = await DashScopeMedia.generateVideo(scenePrompts[i], imageRef);
        clipUrls.push(clipUrl);
        console.log(`[ServerEngine] ✅ Clip ${i + 1}/${scenePrompts.length} done!`);
      }

      if (clipUrls.length <= 1) {
        // Only got 1 clip (rate limit or errors), handle like single clip
        const singleUrl = clipUrls[0];
        if (ttsNode?.output_url && singleUrl) {
          try {
            const { VideoStitcher } = await import("../../video/VideoStitcher");
            const localClip = await VideoStitcher.downloadClip(singleUrl, 0);
            const muxedPath = await VideoStitcher.muxAudio(localClip, ttsNode.output_url);
            const fs = await import("fs");
            const fileBuffer = fs.readFileSync(muxedPath);
            const { CloudflareR2 } = await import("../../cloud/CloudflareR2");
            const uploadRes = await CloudflareR2.uploadBuffer(fileBuffer, `video/${Date.now()}_muxed.mp4`, "video/mp4");
            finalUrl = uploadRes.url;
            VideoStitcher.cleanup([localClip, muxedPath]);
          } catch (e) {
            finalUrl = await this.uploadToR2(singleUrl);
          }
        } else {
          finalUrl = await this.uploadToR2(singleUrl || "");
        }
      } else {
        // Step 3: Download all clips to temp files
        const { VideoStitcher } = await import("../../video/VideoStitcher");
        const localPaths: string[] = [];
        
        for (let i = 0; i < clipUrls.length; i++) {
          const localPath = await VideoStitcher.downloadClip(clipUrls[i], i);
          localPaths.push(localPath);
        }

        // Step 4: Stitch them together locally
        console.log(`[ServerEngine] 🎞️ Stitching ${localPaths.length} clips together with FFmpeg...`);
        let currentVideoPath = await VideoStitcher.concat(localPaths);
        const filesToCleanup = [...localPaths, currentVideoPath];

        // Step 5: Check for Upstream TTS Audio and Mux Locally BEFORE uploading
        if (ttsNode?.output_url) {
          console.log(`[ServerEngine] 🎙️ Upstream TTS audio found! Muxing audio locally into stitched video...`);
          try {
            const muxedPath = await VideoStitcher.muxAudio(currentVideoPath, ttsNode.output_url);
            filesToCleanup.push(muxedPath);
            currentVideoPath = muxedPath;
            console.log(`[ServerEngine] 🎙️ Audio muxing successful!`);
          } catch (muxErr: any) {
            console.error(`[ServerEngine] ⚠️ Failed to mux TTS audio into stitched video:`, muxErr?.message);
          }
        }

        // Step 6: Upload the final file (stitched or muxed) to R2 ONCE
        const fs = await import("fs");
        const fileBuffer = fs.readFileSync(currentVideoPath);
        
        const { CloudflareR2 } = await import("../../cloud/CloudflareR2");
        const uploadRes = await CloudflareR2.uploadBuffer(fileBuffer, `video/${Date.now()}_final.mp4`, "video/mp4");
        finalUrl = uploadRes.url;
        console.log(`[ServerEngine] 🎉 Final video uploaded to R2: ${finalUrl}`);

        // Cleanup all temp files
        VideoStitcher.cleanup(filesToCleanup);
      }
    }

    // Update Node
    const resultText = `Video Rendered (${videoDuration}s) & Uploaded to Cloudflare R2 Successfully!`;
    await supabase.from("nodes").update({ output_url: finalUrl, status: "done", output: resultText }).eq("id", nodeId);
    
    // Update Job result_url
    await supabase.from("jobs").update({ result_url: finalUrl }).eq("id", jobId);
    
    return `Video Rendered (${videoDuration}s, ${clipCount} clip${clipCount > 1 ? 's' : ''}) & Uploaded to Cloudflare R2 Successfully!`;
  }

  private async uploadToR2(videoUrl: string): Promise<string> {
    try {
      const { CloudflareR2 } = await import("../../cloud/CloudflareR2");
      const uploadRes = await CloudflareR2.uploadMedia(videoUrl, "video");
      console.log(`[ServerEngine] Video successfully uploaded to R2: ${uploadRes.url}`);
      return uploadRes.url;
    } catch (r2Err: any) {
      console.warn(`[ServerEngine] R2 video upload fallback to DashScope URL:`, r2Err?.message || r2Err);
      return videoUrl;
    }
  }

  private async splitIntoScenes(narrative: string, clipCount: number, context: ExecutionContext): Promise<string[]> {
    const splitPrompt = VIDEO_PROMPTS.getSceneSplitterPrompt(narrative, clipCount);

    try {
      const result = await executeNodeRequest(
        "producer" as any,
        splitPrompt,
        "",
        "qwen",
        context.nodeModel,
        { targetLanguage: context.language }
      );
      
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const scenes = JSON.parse(jsonMatch[0]);
        if (Array.isArray(scenes) && scenes.length > 0) {
          console.log(`[ServerEngine] Split narrative into ${scenes.length} scenes`);
          return scenes.slice(0, clipCount);
        }
      }
    } catch (e: any) {
      console.warn(`[ServerEngine] Scene splitting failed: ${e.message}. Falling back to repeated prompt.`);
    }

    return Array.from({ length: clipCount }, (_, i) => 
      VIDEO_PROMPTS.getFallbackScenePrompt(narrative, i)
    );
  }
}
