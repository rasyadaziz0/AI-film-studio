import { AgentType } from "./engine/types";
import { AgentFactory } from "./ai/agents/AgentFactory";
import { NODE_MODEL_CONFIG } from "./engine/prompts";
import { validateModel } from "./ai/providers/ModelAllowlist";

export async function executeNodeRequest(
  type: AgentType,
  userInput: string,
  upstreamContext: string,
  provider: string = "qwen",
  model?: string,
  options?: { maxTokens?: number; enableThinking?: boolean; targetLanguage?: string; videoDuration?: number }
): Promise<string> {
  // 1. Get per-node config defaults
  const config = NODE_MODEL_CONFIG[type];

  // 2. Resolve model: explicit override > node config default > "qwen-plus"
  const finalModel = validateModel(model || config?.defaultModel);
  const finalMaxTokens = options?.maxTokens ?? config?.maxTokens ?? 1024;
  const finalEnableThinking = options?.enableThinking ?? config?.enableThinking ?? false;

  // 3. Create the specific agent via Factory
  const agent = AgentFactory.create(type);

  // 4. Retrieve encapsulated prompts
  const baseSystemPrompt = agent.getSystemPrompt() || "";
  const langMandate = options?.targetLanguage
    ? `\n\nCRITICAL LANGUAGE MANDATE: You MUST generate ALL output, titles, dialogue, scripts, voiceover narration, and text strictly in ${options.targetLanguage}, regardless of the language used in the user input prompt or upstream context.`
    : "";
  const durationMandate = options?.videoDuration
    ? `\n\nCRITICAL DURATION MANDATE: The final video duration is strictly set to ${options.videoDuration} seconds. Your generated story, script scenes, and especially the voiceover narration MUST be timed appropriately to fit exactly within ~${options.videoDuration} seconds when read aloud at normal speaking speed (approximately ${Math.round(options.videoDuration * 2.5)} to ${Math.round(options.videoDuration * 3)} words total). Keep it concise and perfectly paced for a ${options.videoDuration}-second clip!`
    : "";
  const systemPrompt = baseSystemPrompt + langMandate + durationMandate;
  const userPrompt = agent.constructUserPrompt(userInput, upstreamContext);

  // 5. Execute — provider is always "qwen" (server enforced)
  const { ProviderFactory } = await import("./ai/providers/ProviderFactory");
  const aiProvider = ProviderFactory.create("qwen");

  return await aiProvider.generate(systemPrompt, userPrompt, finalModel, {
    maxTokens: finalMaxTokens,
    enableThinking: finalEnableThinking,
  });
}
