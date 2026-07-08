export interface ExecutionContext {
  supabase: any;
  nodeId: string;
  node: any;
  upstreamNodes: any[];
  upstreamContext: string;
  finalUserInput: string;
  nodeModel: string;
  retryCount: number;
  studioId: string;
  jobId: string;
  videoDuration: number; // 5, 15, or 30 seconds
  language?: string; // e.g. "English", "Bahasa Indonesia", "Japanese"

  /** Single source of truth for media call budgeting. Throws if budget exceeded. */
  reserveMediaCall: () => number;

  /** Re-run a node with optional inputOverride (for reviewer feedback injection). */
  runNodeCallback: (nodeId: string, retryCount: number, inputOverride?: string) => Promise<void>;
}

export abstract class BaseNodeHandler {
  /**
   * Executes the logic for a specific node type.
   * Should return a string that represents the text result or status of the operation.
   */
  public abstract execute(context: ExecutionContext): Promise<string>;
}
