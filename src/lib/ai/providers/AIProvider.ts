export interface GenerateOptions {
  maxTokens?: number;
  enableThinking?: boolean;
}

export abstract class AIProvider {
  /**
   * Generates a response from the AI model based on the provided prompts.
   *
   * @param systemPrompt The role or system instructions for the AI.
   * @param userPrompt The specific task or context for the AI to process.
   * @param model Optional model override.
   * @param options Optional generation parameters (maxTokens, enableThinking).
   * @returns A promise that resolves to the generated text response.
   */
  abstract generate(
    systemPrompt: string,
    userPrompt: string,
    model?: string,
    options?: GenerateOptions
  ): Promise<string>;
}
