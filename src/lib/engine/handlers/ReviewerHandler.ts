import { BaseNodeHandler, ExecutionContext } from "./BaseNodeHandler";
import { executeNodeRequest } from "../../engine";
import { REVIEWER_PROMPTS } from "../prompts";
import { AgentType } from "../types";

export class ReviewerHandler extends BaseNodeHandler {
  public async execute(context: ExecutionContext): Promise<string> {
    const { node, nodeId, finalUserInput, upstreamContext, nodeModel, supabase, retryCount, runNodeCallback, upstreamNodes } = context;

    const maxRetries = node.config?.max_retries || 2;
    const result = await executeNodeRequest(node.type as AgentType, finalUserInput, upstreamContext, "qwen", nodeModel, { targetLanguage: context.language });
    
    try {
      let cleanJson = result.trim();
      const jsonMatch = cleanJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        cleanJson = jsonMatch[1].trim();
      } else {
        const firstBrace = cleanJson.indexOf("{");
        const lastBrace = cleanJson.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
        }
      }
      const parsed = JSON.parse(cleanJson);
      if (parsed.verdict === "revise" && retryCount < maxRetries) {
        console.log(`[ServerEngine] Reviewer ${nodeId} rejected. Retrying (${retryCount + 1}/${maxRetries})`);
        
        // Find upstream writer to re-run
        const writerNode = upstreamNodes.find((n: any) => n.type === "writer" || n.type === "producer");
        if (writerNode) {
          // Build feedback as inputOverride — DO NOT mutate node label
          const feedbackInput = REVIEWER_PROMPTS.injectFeedback(
            writerNode.user_input || writerNode.label || "",
            parsed.feedback
          );

          await supabase.from("nodes").update({ status: "idle" }).eq("id", writerNode.id);
          await supabase.from("nodes").update({ status: "idle" }).eq("id", nodeId);
          
          // Re-run writer with feedback injected as temporary input, not persisted to label
          await runNodeCallback(writerNode.id, retryCount + 1, feedbackInput);
          
          // Re-run the reviewer itself
          await runNodeCallback(nodeId, retryCount + 1);
        }
      } else if (parsed.verdict === "revise" && retryCount >= maxRetries) {
        console.log(`[ServerEngine] Reviewer ${nodeId} rejected but max retries reached. Forcing approve.`);
      } else {
        console.log(`[ServerEngine] Reviewer ${nodeId} approved!`);
      }
    } catch (e) {
      console.log(`[ServerEngine] Reviewer ${nodeId} output non-JSON or partial text, defaulting to approve.`);
    }
    
    return result;
  }
}
