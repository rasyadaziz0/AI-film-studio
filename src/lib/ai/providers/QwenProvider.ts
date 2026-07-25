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

    // Log usage for monitoring and auditing
    const usage = data.usage;
    if (usage) {
      console.log(
        `[Qwen] model=${finalModel} in=${usage.input_tokens ?? "?"} out=${usage.output_tokens ?? "?"} request_id=${data.request_id ?? "?"}`
      );

      if (options?.studioId && options?.jobId) {
        try {
          const inputTokens = usage.input_tokens || 0;
          const outputTokens = usage.output_tokens || 0;
          const costUsd = ((inputTokens * 0.000001) + (outputTokens * 0.000002));
          const { getServiceSupabase } = await import("../../auth/requireAuth");
          const supabase = getServiceSupabase();
          await supabase.from("ai_usage").insert({
            studio_id: (options as any)?.studioId || null,
            job_id: (options as any)?.jobId || null,
            node_id: null,
            model: finalModel,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            estimated_cost: costUsd
          });
        } catch (e) {
          console.error("[QwenProvider] Failed to log usage:", e);
        }
      }
    }

    return data.choices[0].message.content;
  }
}
