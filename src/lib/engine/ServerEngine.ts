import { createClient } from "@supabase/supabase-js";
import { getServiceSupabase } from "../auth/requireAuth";

// Safety limits to prevent runaway credit burn
const getMaxNodeExecutions = () => {
  const parsed = parseInt(process.env.MAX_NODE_EXECUTIONS_PER_PIPELINE || "", 10);
  return isNaN(parsed) ? 30 : parsed;
};

const getMaxMediaCalls = () => {
  const parsed = parseInt(process.env.MAX_MEDIA_CALLS_PER_PIPELINE || "", 10);
  return isNaN(parsed) ? 5 : parsed;
};

export class ServerEngine {
  private supabase: any;
  private nodeExecutionCount = 0;
  private mediaCallCount = 0;

  constructor(
    private studioId: string,
    private jobId: string,
    private userToken?: string
  ) {
    this.supabase = getServiceSupabase(userToken);
  }

  /**
   * Single source of truth for media call budgeting.
   * Throws if budget exceeded. Returns the new call count.
   */
  public reserveMediaCall(): number {
    const max = getMaxMediaCalls();
    if (this.mediaCallCount >= max) {
      throw new Error(`MEDIA_BUDGET_EXCEEDED: ${this.mediaCallCount}/${max} media calls used.`);
    }
    return ++this.mediaCallCount;
  }

  public async runPipeline() {
    console.log(`[ServerEngine] Starting pipeline for studio ${this.studioId}, job ${this.jobId}`);

    // Update job status
    await this.updateJobStatus("running");

    try {
      // 1. Fetch nodes and edges (explicit columns)
      const { data: nodesData, error: nodesErr } = await this.supabase
        .from("nodes")
        .select("id, studio_id, type, label, position_x, position_y, role_prompt, user_input, model, config, output, output_url, status")
        .eq("studio_id", this.studioId);

      const { data: edgesData, error: edgesErr } = await this.supabase
        .from("edges")
        .select("id, studio_id, source_node_id, target_node_id, source_handle, target_handle")
        .eq("studio_id", this.studioId);

      if (nodesErr || edgesErr) throw new Error("Failed to load pipeline graph from DB");

      const nodes = nodesData || [];
      const edges = edgesData || [];

      // 2. Topological Sort (Kahn's)
      const adj = new Map<string, string[]>();
      const inDegree = new Map<string, number>();

      nodes.forEach((n: any) => {
        adj.set(n.id, []);
        inDegree.set(n.id, 0);
      });

      edges.forEach((e: any) => {
        adj.get(e.source_node_id)?.push(e.target_node_id);
        inDegree.set(e.target_node_id, (inDegree.get(e.target_node_id) || 0) + 1);
      });

      const queue: string[] = [];
      inDegree.forEach((degree, id) => {
        if (degree === 0) queue.push(id);
      });

      const sorted: string[] = [];
      while (queue.length > 0) {
        const current = queue.shift()!;
        sorted.push(current);

        adj.get(current)?.forEach((neighbor) => {
          inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
          if (inDegree.get(neighbor) === 0) {
            queue.push(neighbor);
          }
        });
      }

      if (sorted.length !== nodes.length) {
        throw new Error("Cycle detected in the graph");
      }

      // 3. Execute nodes in order
      for (const nodeId of sorted) {
        await this.runNode(nodeId);

        // Refresh node to check status
        const { data: refreshedNode } = await this.supabase
          .from("nodes")
          .select("status")
          .eq("id", nodeId)
          .eq("studio_id", this.studioId)
          .single();

        if (refreshedNode?.status === "error") {
          throw new Error(`Pipeline stopped due to node error: ${nodeId}`);
        }

        // Check if job entered async polling state
        const { data: jobStatus } = await this.supabase.from("jobs").select("status").eq("id", this.jobId).single();
        if (jobStatus?.status === "polling") {
          console.log("[ServerEngine] Pipeline paused for async polling.");
          return;
        }
      }

      // 4. Completed all nodes
      await this.updateJobStatus("done");
      console.log(`[ServerEngine] Full pipeline completed for studio ${this.studioId}`);
    } catch (error: any) {
      console.error("[ServerEngine] Pipeline execution error:", error);
      await this.updateJobStatus("error", error.message);
    }
  }

  public async runSingleNode(nodeId: string): Promise<void> {
    this.nodeExecutionCount = 0;
    await this.updateJobStatus("running");
    try {
      await this.runNode(nodeId);
      
      // Check if job entered async polling state (e.g. video node)
      const { data: jobStatus } = await this.supabase.from("jobs").select("status").eq("id", this.jobId).single();
      if (jobStatus?.status !== "polling") {
        await this.updateJobStatus("done");
      }
      console.log(`[ServerEngine] Single node execution completed for node ${nodeId}`);
    } catch (error: any) {
      console.error(`[ServerEngine] Single node execution error for ${nodeId}:`, error);
      await this.updateJobStatus("error", error.message);
    }
  }

  private async runNode(nodeId: string, retryCount = 0, inputOverride?: string): Promise<void> {
    // Rate limit: prevent infinite loops
    this.nodeExecutionCount++;
    const maxNodes = getMaxNodeExecutions();
    if (this.nodeExecutionCount > maxNodes) {
      const msg = `[ServerEngine] RATE LIMIT: Max ${maxNodes} node executions reached.`;
      console.error(msg);
      throw new Error(msg);
    }
    console.log(`[ServerEngine] Node execution #${this.nodeExecutionCount}/${maxNodes}`);

    const { data: node } = await this.supabase
      .from("nodes")
      .select("id, studio_id, type, label, position_x, position_y, role_prompt, user_input, model, config, output, output_url, status")
      .eq("id", nodeId)
      .eq("studio_id", this.studioId)
      .single();
    if (!node) return;

    // Skip input nodes
    if (node.type === "input") {
      await this.supabase.from("nodes").update({ status: "done" }).eq("id", nodeId);
      return;
    }

    console.log(`[ServerEngine] Executing node: ${node.type} (${nodeId})`);
    await this.supabase.from("nodes").update({ status: "running" }).eq("id", nodeId);

    try {
      const { data: incomingEdges } = await this.supabase
        .from("edges")
        .select("source_node_id")
        .eq("target_node_id", nodeId)
        .eq("studio_id", this.studioId);

      const upstreamIds = incomingEdges?.map((e: any) => e.source_node_id) || [];
      const upstreamNodes: any[] = [];

      if (upstreamIds.length > 0) {
        const { data: upNodes } = await this.supabase
          .from("nodes")
          .select("id, type, label, user_input, output, output_url, config, status")
          .in("id", upstreamIds);
        upstreamNodes.push(...(upNodes || []));
      }

      // Fetch studio + job info
      const { data: studio } = await this.supabase
        .from("studios")
        .select("niche, video_duration, default_model")
        .eq("id", this.studioId)
        .single();

      const { data: job } = await this.supabase
        .from("jobs")
        .select("source, input")
        .eq("id", this.jobId)
        .single();

      // Find connected input node, or fallback to any input node in the studio
      let inputNode = upstreamNodes.find(n => n.type === "input");
      if (!inputNode) {
        const { data: studioInputNode } = await this.supabase
          .from("nodes")
          .select("user_input, output")
          .eq("studio_id", this.studioId)
          .eq("type", "input")
          .limit(1)
          .maybeSingle();
        if (studioInputNode) {
          inputNode = studioInputNode;
        }
      }

      // If still no input node or empty prompt, check if producer has run and has output
      let producerOutput = "";
      const producerNode = upstreamNodes.find(n => n.type === "producer");
      if (producerNode) {
        producerOutput = producerNode.output || "";
      } else if (node.type === "actor" || node.type === "writer" || node.type === "video") {
        const { data: studioProducerNode } = await this.supabase
          .from("nodes")
          .select("output")
          .eq("studio_id", this.studioId)
          .eq("type", "producer")
          .limit(1)
          .maybeSingle();
        if (studioProducerNode?.output) {
          producerOutput = studioProducerNode.output;
        }
      }

      // Core prompt priority: job.input (Telegram) > manual input > producer output > niche
      const corePrompt =
        job?.input?.trim() ||
        inputNode?.user_input ||
        inputNode?.output ||
        producerOutput ||
        studio?.niche ||
        "";

      // Filter out reviewer verdict JSONs from upstream context for content-generation nodes
      // (writer, tts, video, actor). Reviewer outputs are structured verdicts, not story content.
      const contentGenerationTypes = ['writer', 'tts', 'video', 'actor'];
      const filteredUpstream = contentGenerationTypes.includes(node.type)
        ? upstreamNodes.filter((n: any) => n.type !== 'reviewer')
        : upstreamNodes;

      const upstreamContext = filteredUpstream
        .map((n: any) => `[From ${n.type}]:\n${n.output || n.user_input || "No output"}`)
        .join("\n\n");

      // Ignore legacy hardcoded T-Rex default from older studio creations
      const isLegacyTRex = (str?: string) => str ? str.toLowerCase().includes("t-rex") || str.toLowerCase().includes("trex") : false;
      const rawUserInput = isLegacyTRex(node.user_input) ? "" : node.user_input;
      const rawLabel = isLegacyTRex(node.label) ? "" : node.label;

      // If inputOverride is provided (e.g., reviewer feedback), use it instead
      // Prioritize corePrompt over node.user_input/label for Producer, Actor, and Writer unless user set explicit config prompt
      const finalUserInput = inputOverride || node.config?.actor_prompt || node.config?.prompt || ((node.type === "producer" || node.type === "actor" || node.type === "writer" || upstreamNodes.length === 0) && corePrompt ? corePrompt : (rawUserInput || rawLabel || ""));

      const rawDefaultModel = studio?.default_model || "qwen-plus";
      const studioModel = rawDefaultModel.split("###")[0] || "qwen-plus";
      const studioLang = rawDefaultModel.includes("###") ? rawDefaultModel.split("###")[1] : "English";

      const nodeModel = node.model || node.config?.model || studioModel;

      const { NodeHandlerFactory } = await import("./handlers/NodeHandlerFactory");

      const context: import("./handlers/BaseNodeHandler").ExecutionContext = {
        supabase: this.supabase,
        nodeId: nodeId,
        node: node,
        upstreamNodes: upstreamNodes,
        upstreamContext: upstreamContext,
        finalUserInput: finalUserInput,
        nodeModel: nodeModel,
        retryCount: retryCount,
        studioId: this.studioId,
        jobId: this.jobId,
        reserveMediaCall: this.reserveMediaCall.bind(this),
        runNodeCallback: this.runNode.bind(this),
        videoDuration: studio?.video_duration || 5,
        language: node.config?.language || studioLang,
      };

      const handler = NodeHandlerFactory.getHandler(node.type);
      const result = await handler.execute(context);

      // Save result
      await this.supabase.from("nodes").update({
        output: result,
        status: "done"
      }).eq("id", nodeId);

    } catch (error: any) {
      console.error(`[ServerEngine] Error in node ${nodeId}:`, error);
      await this.supabase.from("nodes").update({ status: "error" }).eq("id", nodeId);
    }
  }

  private async updateJobStatus(status: string, error?: string) {
    const updatePayload: any = { status, error, updated_at: new Date().toISOString() };
    if (status === "done" || status === "error") {
      updatePayload.reserved_cost = 0;
    }
    await this.supabase.from("jobs").update(updatePayload).eq("id", this.jobId);
  }
}
