export class JobLifecycleManager {
  private mediaCallCount = 0;
  private nodeExecutionCount = 0;

  constructor(
    private supabase: any,
    private jobId: string
  ) {}

  public reserveMediaCall(): number {
    const parsed = parseInt(process.env.MAX_MEDIA_CALLS_PER_PIPELINE || "", 10);
    const max = isNaN(parsed) ? 5 : parsed;
    if (this.mediaCallCount >= max) {
      throw new Error(`MEDIA_BUDGET_EXCEEDED: ${this.mediaCallCount}/${max} media calls used.`);
    }
    return ++this.mediaCallCount;
  }

  public incrementNodeExecution(): number {
    const parsed = parseInt(process.env.MAX_NODE_EXECUTIONS_PER_PIPELINE || "", 10);
    const max = isNaN(parsed) ? 30 : parsed;
    if (++this.nodeExecutionCount > max) {
      throw new Error(`[ServerEngine] RATE LIMIT: Max ${max} node executions reached.`);
    }
    return this.nodeExecutionCount;
  }

  public resetNodeExecutionCount(): void {
    this.nodeExecutionCount = 0;
  }

  public async updateStatus(status: string, error?: string): Promise<void> {
    const updatePayload: any = { status, error, updated_at: new Date().toISOString() };
    if (status === "done" || status === "error") {
      updatePayload.reserved_cost = 0;
    }
    await this.supabase.from("jobs").update(updatePayload).eq("id", this.jobId);
  }

  public async getJobStatus(): Promise<string | null> {
    const { data: jobStatus } = await this.supabase.from("jobs").select("status").eq("id", this.jobId).single();
    return jobStatus?.status || null;
  }
}
