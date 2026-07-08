import { BaseNodeHandler, ExecutionContext } from "./BaseNodeHandler";
import { executeNodeRequest } from "../../engine";
import { AgentType } from "../types";

export class DefaultTextHandler extends BaseNodeHandler {
  public async execute(context: ExecutionContext): Promise<string> {
    const { node, finalUserInput, upstreamContext, nodeModel } = context;

    // Standard text generation (Producer, Writer, Telegram, etc)
    const result = await executeNodeRequest(
      node.type as AgentType, 
      finalUserInput, 
      upstreamContext, 
      "qwen", 
      nodeModel,
      { targetLanguage: context.language, videoDuration: context.videoDuration }
    );

    return result;
  }
}
