import { getServiceSupabase } from "../auth/requireAuth";
import { PipelineGraphScheduler, GraphNode, GraphEdge } from "./scheduler/PipelineGraphScheduler";
import { NodeContextResolver } from "./resolver/NodeContextResolver";
import { JobLifecycleManager } from "./lifecycle/JobLifecycleManager";

export class ServerEngine {
  private supabase: any;
  private lifecycle: JobLifecycleManager;

  constructor(
    private studioId: string,
    private jobId: string,
    private userToken?: string
  ) {
    this.supabase = getServiceSupabase(userToken);
    this.lifecycle = new JobLifecycleManager(this.supabase, this.jobId);
  }

  public reserveMediaCall(): number {
    return this.lifecycle.reserveMediaCall();
  }

  public async runPipeline() {
    console.log(`[ServerEngine] Starting pipeline for studio ${this.studioId}, job ${this.jobId}`);
    await this.lifecycle.updateStatus("running");

    try {
      const { data: nodesData, error: nodesErr } = await this.supabase
        .from("nodes")
        .select("id, studio_id, type, label, position_x, position_y, role_prompt, user_input, model, config, output, output_url, status")
        .eq("studio_id", this.studioId);

      const { data: edgesData, error: edgesErr } = await this.supabase
        .from("edges")
        .select("id, studio_id, source_node_id, target_node_id, source_handle, target_handle")
        .eq("studio_id", this.studioId);

      if (nodesErr || edgesErr) throw new Error("Failed to load pipeline graph from DB");

      const nodes: GraphNode[] = nodesData || [];
      const edges: GraphEdge[] = edgesData || [];

      const sorted = PipelineGraphScheduler.sort(nodes, edges);

      for (const nodeId of sorted) {
        await this.runNode(nodeId);

        const { data: refreshedNode } = await this.supabase
          .from("nodes")
          .select("status")
          .eq("id", nodeId)
          .eq("studio_id", this.studioId)
          .single();

        if (refreshedNode?.status === "error") {
          throw new Error(`Pipeline stopped due to node error: ${nodeId}`);
        }

        const jobStatus = await this.lifecycle.getJobStatus();
        if (jobStatus === "polling") {
          console.log("[ServerEngine] Pipeline paused for async polling.");
          return;
        }
      }

      await this.lifecycle.updateStatus("done");
      console.log(`[ServerEngine] Full pipeline completed for studio ${this.studioId}`);
    } catch (error: any) {
      console.error("[ServerEngine] Pipeline execution error:", error);
      await this.lifecycle.updateStatus("error", error.message);
    }
  }

  public async runSingleNode(nodeId: string): Promise<void> {
    this.lifecycle.resetNodeExecutionCount();
    await this.lifecycle.updateStatus("running");
    try {
      await this.runNode(nodeId);

      const jobStatus = await this.lifecycle.getJobStatus();
      if (jobStatus !== "polling") {
        await this.lifecycle.updateStatus("done");
      }
      console.log(`[ServerEngine] Single node execution completed for node ${nodeId}`);
    } catch (error: any) {
      console.error(`[ServerEngine] Single node execution error for ${nodeId}:`, error);
      await this.lifecycle.updateStatus("error", error.message);
    }
  }

  private async runNode(nodeId: string, retryCount = 0, inputOverride?: string): Promise<void> {
    this.lifecycle.incrementNodeExecution();

    const { data: node } = await this.supabase
      .from("nodes")
      .select("id, studio_id, type, label, position_x, position_y, role_prompt, user_input, model, config, output, output_url, status")
      .eq("id", nodeId)
      .eq("studio_id", this.studioId)
      .single();
    if (!node) return;

    if (node.type === "input") {
      await this.supabase.from("nodes").update({ status: "done" }).eq("id", nodeId);
      return;
    }

    console.log(`[ServerEngine] Executing node: ${node.type} (${nodeId})`);
    await this.supabase.from("nodes").update({ status: "running" }).eq("id", nodeId);

    try {
      const upstreamNodes = await NodeContextResolver.resolveUpstreamNodes(this.supabase, this.studioId, nodeId);

      const { data: studio } = await this.supabase.from("studios").select("niche, video_duration, default_model").eq("id", this.studioId).single();
      const { data: job } = await this.supabase.from("jobs").select("source, input").eq("id", this.jobId).single();

      const resolved = await NodeContextResolver.resolveCorePrompt(this.supabase, this.studioId, node, upstreamNodes, studio, job);
      const finalUserInput = inputOverride || resolved.finalUserInput;

      const { NodeHandlerFactory } = await import("./handlers/NodeHandlerFactory");

      const context: import("./handlers/BaseNodeHandler").ExecutionContext = {
        supabase: this.supabase,
        nodeId: nodeId,
        node: node,
        upstreamNodes: upstreamNodes,
        upstreamContext: resolved.upstreamContext,
        finalUserInput: finalUserInput,
        nodeModel: resolved.nodeModel,
        retryCount: retryCount,
        studioId: this.studioId,
        jobId: this.jobId,
        reserveMediaCall: this.reserveMediaCall.bind(this),
        runNodeCallback: this.runNode.bind(this),
        videoDuration: studio?.video_duration || 5,
        language: resolved.language,
      };

      const handler = NodeHandlerFactory.getHandler(node.type);
      const result = await handler.execute(context);

      await this.supabase.from("nodes").update({ output: result, status: "done" }).eq("id", nodeId);
    } catch (error: any) {
      console.error(`[ServerEngine] Error in node ${nodeId}:`, error);
      await this.supabase.from("nodes").update({ status: "error" }).eq("id", nodeId);
    }
  }
}
