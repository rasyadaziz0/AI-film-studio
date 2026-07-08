import { BaseNodeHandler, ExecutionContext } from "./BaseNodeHandler";

export class CloudHandler extends BaseNodeHandler {
  public async execute(context: ExecutionContext): Promise<string> {
    const { nodeId, upstreamNodes, supabase } = context;

    const mediaNode = upstreamNodes.find((n: any) => n.type === "video" && n.output_url) ||
                      upstreamNodes.find((n: any) => n.output_url);
    const sourceUrl = mediaNode?.output_url || "https://www.w3schools.com/html/mov_bbb.mp4";
    console.log(`[ServerEngine] Uploading media to Cloudflare R2 bucket for node ${nodeId}...`);
    
    const { CloudflareR2 } = await import("../../cloud/CloudflareR2");
    const uploadRes = await CloudflareR2.uploadMedia(sourceUrl);
    
    const result = `✅ Cloudflare R2 Upload Successful!\n\nBucket: ${uploadRes.bucket}\nKey: ${uploadRes.key}\nPublic R2 URL: ${uploadRes.url}\nStatus: Persisted directly to Cloudflare R2 storage network.`;
    await supabase.from("nodes").update({ output_url: uploadRes.url, status: "done", output: result }).eq("id", nodeId);

    return result;
  }
}
