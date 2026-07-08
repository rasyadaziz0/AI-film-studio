import { BaseNodeHandler, ExecutionContext } from "./BaseNodeHandler";
import { executeNodeRequest } from "../../engine";
import { AgentType } from "../types";

export class ActorHandler extends BaseNodeHandler {
  public async execute(context: ExecutionContext): Promise<string> {
    const { node, nodeId, finalUserInput, upstreamContext, nodeModel, supabase } = context;

    const textResult = await executeNodeRequest(node.type as AgentType, finalUserInput, upstreamContext, "qwen", nodeModel, { targetLanguage: context.language });
    
    // Check if user already uploaded their own character image
    const userUploadedImage = node.config?.uploaded_image_url;
    let finalImageUrl = userUploadedImage || "";
    
    if (userUploadedImage) {
      console.log(`[ServerEngine] Actor ${nodeId}: Using user-uploaded character image.`);
    } else {
      // Reserve a media call (throws if budget exceeded)
      const callNum = context.reserveMediaCall();
      
      // Generate image via qwen-image-plus
      const actorPrompt = node.config?.actor_prompt || textResult;
      console.log(`[ServerEngine] Generating image for Actor ${nodeId} with qwen-image-plus... (media call #${callNum})`);
      
      const { DashScopeMedia } = await import("../../ai/providers/DashScopeMedia");
      const imageUrl = await DashScopeMedia.generateImage(actorPrompt);
      finalImageUrl = imageUrl;
      
      try {
        const { CloudflareR2 } = await import("../../cloud/CloudflareR2");
        const res = await CloudflareR2.uploadMedia(imageUrl, "actor-image");
        finalImageUrl = res.url;
      } catch (e) { 
        console.warn(`[ServerEngine] Actor ${nodeId}: R2 upload fallback`);
      }
    }
    
    await supabase.from("nodes").update({ output_url: finalImageUrl }).eq("id", nodeId);
    
    return textResult;
  }
}
