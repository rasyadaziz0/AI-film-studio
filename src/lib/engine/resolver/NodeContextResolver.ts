import { GraphNode } from "../scheduler/PipelineGraphScheduler";

export interface StudioConfig {
  niche?: string;
  video_duration?: number;
  default_model?: string;
}

export interface JobConfig {
  source?: string;
  input?: string;
}

/**
 * OOP Resolver for constructing final node execution context, prompt hierarchy, and upstream inputs.
 */
export class NodeContextResolver {
  public static async resolveUpstreamNodes(
    supabase: any,
    studioId: string,
    nodeId: string
  ): Promise<GraphNode[]> {
    const { data: incomingEdges } = await supabase
      .from("edges")
      .select("source_node_id")
      .eq("target_node_id", nodeId)
      .eq("studio_id", studioId);

    const upstreamIds = incomingEdges?.map((e: any) => e.source_node_id) || [];
    if (upstreamIds.length === 0) return [];

    const { data: upNodes } = await supabase
      .from("nodes")
      .select("id, type, label, user_input, output, output_url, config, status")
      .in("id", upstreamIds);

    return upNodes || [];
  }

  public static async resolveCorePrompt(
    supabase: any,
    studioId: string,
    node: GraphNode,
    upstreamNodes: GraphNode[],
    studio: StudioConfig | null,
    job: JobConfig | null
  ): Promise<{ corePrompt: string; upstreamContext: string; finalUserInput: string; nodeModel: string; language: string }> {
    let inputNode = upstreamNodes.find((n) => n.type === "input");
    if (!inputNode) {
      const { data: studioInputNode } = await supabase
        .from("nodes")
        .select("user_input, output")
        .eq("studio_id", studioId)
        .eq("type", "input")
        .limit(1)
        .maybeSingle();
      if (studioInputNode) inputNode = studioInputNode;
    }

    let producerOutput = "";
    const producerNode = upstreamNodes.find((n) => n.type === "producer");
    if (producerNode) {
      producerOutput = producerNode.output || "";
    } else if (["actor", "writer", "video"].includes(node.type)) {
      const { data: studioProducerNode } = await supabase
        .from("nodes")
        .select("output")
        .eq("studio_id", studioId)
        .eq("type", "producer")
        .limit(1)
        .maybeSingle();
      if (studioProducerNode?.output) producerOutput = studioProducerNode.output;
    }

    const corePrompt =
      job?.input?.trim() ||
      inputNode?.user_input ||
      inputNode?.output ||
      producerOutput ||
      studio?.niche ||
      "";

    const contentGenerationTypes = ["writer", "tts", "video", "actor"];
    const filteredUpstream = contentGenerationTypes.includes(node.type)
      ? upstreamNodes.filter((n) => n.type !== "reviewer")
      : upstreamNodes;

    const upstreamContext = filteredUpstream
      .map((n) => `[From ${n.type}]:\n${n.output || n.user_input || "No output"}`)
      .join("\n\n");

    const isLegacyTRex = (str?: string) =>
      str ? str.toLowerCase().includes("t-rex") || str.toLowerCase().includes("trex") : false;
    const rawUserInput = isLegacyTRex(node.user_input) ? "" : node.user_input;
    const rawLabel = isLegacyTRex(node.label) ? "" : node.label;

    return {
      corePrompt,
      upstreamContext,
      finalUserInput:
        node.config?.actor_prompt ||
        node.config?.prompt ||
        ((node.type === "producer" || node.type === "actor" || node.type === "writer" || upstreamNodes.length === 0) && corePrompt
          ? corePrompt
          : rawUserInput || rawLabel || ""),
      nodeModel: node.model || node.config?.model || (studio?.default_model?.split("###")[0] || "qwen-plus"),
      language: node.config?.language || (studio?.default_model?.includes("###") ? studio.default_model.split("###")[1] : "English"),
    };
  }
}
