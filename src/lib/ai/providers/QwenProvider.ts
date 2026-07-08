import { AIProvider, GenerateOptions } from "./AIProvider";
import { validateModel } from "./ModelAllowlist";

export class QwenProvider extends AIProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    super();
    this.apiKey = process.env.DASHSCOPE_API_KEY || "";
    this.baseUrl = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";
  }

  async generate(
    systemPrompt: string,
    userPrompt: string,
    model?: string,
    options?: GenerateOptions
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error("DASHSCOPE_API_KEY is not configured.");
    }

    // Validate model against server-side allowlist
    const finalModel = validateModel(model);
    const maxTokens = options?.maxTokens ?? 1024;
    const enableThinking = options?.enableThinking ?? false;

    const requestBody: any = {
      model: finalModel,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    };

    // Disable thinking for simple tasks to save tokens
    if (!enableThinking) {
      requestBody.enable_thinking = false;
    }

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Qwen API error (${response.status})`);
    }

    const data = await response.json();

    // Log usage for monitoring (will be saved to ai_usage table in Step 8)
    const usage = data.usage;
    if (usage) {
      console.log(
        `[Qwen] model=${finalModel} in=${usage.input_tokens ?? "?"} out=${usage.output_tokens ?? "?"} request_id=${data.request_id ?? "?"}`
      );
    }

    return data.choices[0].message.content;
  }
}
