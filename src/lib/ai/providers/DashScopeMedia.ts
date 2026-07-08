export class DashScopeMedia {
  private static apiKey = process.env.DASHSCOPE_API_KEY || "";

  // Helper to get fresh API key from environment
  private static getApiKey(): string {
    return process.env.DASHSCOPE_API_KEY || this.apiKey;
  }

  // 1. Image Generation (qwen-image-plus) -> Async task but we can poll immediately until done (usually 5-10s)
  static async generateImage(prompt: string): Promise<string> {
    if (process.env.USE_MOCK_MEDIA === "true") {
      console.log(`[DashScopeMedia] MOCK MODE: Generating mock image for prompt: "${prompt}"`);
      await new Promise(r => setTimeout(r, 2000));
      return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1024&q=80";
    }

    const key = this.getApiKey();
    if (!key) throw new Error("DASHSCOPE_API_KEY is not configured.");

    const response = await fetch("https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        model: "qwen-image-plus",
        input: { prompt },
        parameters: { size: "1024*1024", n: 1 }
      })
    });

    const data = await response.json();
    if (data.code && data.code !== "200") throw new Error(data.message);

    const taskId = data.output.task_id;
    return this.pollImageTask(taskId);
  }

  private static async pollImageTask(taskId: string): Promise<string> {
    // Poll every 2 seconds for up to 30 seconds
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 2000));
      let data: any;
      try {
        const res = await fetch(`https://dashscope-intl.aliyuncs.com/api/v1/tasks/${taskId}`, {
          headers: { "Authorization": `Bearer ${this.getApiKey()}` }
        });
        if (!res.ok) {
          console.warn(`[DashScopeMedia] Image poll #${i + 1} HTTP ${res.status} for task ${taskId}. Retrying...`);
          continue;
        }
        data = await res.json();
      } catch (err: any) {
        console.warn(`[DashScopeMedia] Network/DNS error during image poll #${i + 1} for task ${taskId}: ${err.message}. Retrying on next tick...`);
        continue;
      }

      if (data.output?.task_status === "SUCCEEDED") {
        return data.output.results[0].url;
      }
      if (data.output?.task_status === "FAILED") {
        throw new Error(`[Task ${taskId} FAILED] Image generation failed`);
      }
    }
    throw new Error(`[Task ${taskId} timeout] Image generation timeout after 30 seconds`);
  }

  // 2. TTS (Sambert / CosyVoice / Qwen3-TTS) -> Synchronous streaming or URL return depending on model
  static async generateAudio(text: string, language?: string): Promise<string> {
    if (process.env.USE_MOCK_MEDIA === "true") {
      console.log(`[DashScopeMedia] MOCK MODE: Generating mock audio for text: "${text}"`);
      await new Promise(r => setTimeout(r, 2000));
      return "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
    }

    const key = this.getApiKey();
    if (!key) throw new Error("DASHSCOPE_API_KEY is not configured.");

    const targetLang = language || (text.match(/\b(dan|di|yang|ini|itu|sebuah|adalah|dengan|kamu|aku|kita|mereka|hari|pada|bisa|sudah|sangat|seperti|untuk|dalam|dari)\b/i) ? "Bahasa Indonesia" : undefined);
    const accentInstruction = targetLang
      ? `Speak in a natural, authentic, fluent native ${targetLang} accent and pronunciation without any foreign or English dialect/accent.`
      : "Speak clearly and naturally with an authentic native pronunciation matching the language of the text without any foreign accent.";

    console.log(`[DashScopeMedia] Generating audio for lang "${targetLang || 'auto'}" with instruction: "${accentInstruction}"`);

    // Match each model with its required DashScope International endpoint, payload structure, and async mode
    // Prioritize qwen3-tts-instruct-flash to enforce native accent via natural language instructions
    // Only use Qwen3-TTS models (no Sambert fallback — competition compliance)
    const ttsConfigs = [
      {
        model: "qwen3-tts-instruct-flash",
        url: "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
        body: { 
          model: "qwen3-tts-instruct-flash", 
          input: { 
            text, 
            voice: "Cherry",
            instructions: accentInstruction
          } 
        },
        async: false
      },
      {
        model: "qwen3-tts-flash",
        url: "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
        body: { model: "qwen3-tts-flash", input: { text, voice: "Cherry" } },
        async: false
      }
    ];

    let lastErr: any;

    for (const cfg of ttsConfigs) {
      try {
        console.log(`[DashScopeMedia] Attempting TTS with model: ${cfg.model} at endpoint ${cfg.url} (async: ${cfg.async})...`);
        const headers: any = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`
        };
        if (cfg.async) {
          headers["X-DashScope-Async"] = "enable";
        }

        const response = await fetch(cfg.url, {
          method: "POST",
          headers,
          body: JSON.stringify(cfg.body)
        });

        const data = await response.json();
        if (data.code && data.code !== "200") throw new Error(`[${cfg.model}] ${data.message}`);

        if (cfg.async) {
          const taskId = data.output?.task_id;
          return await this.pollAudioTask(taskId);
        } else {
          // Synchronous return for Qwen3-TTS models
          const out = data.output || {};
          const audioUrl = out.audio?.url || out.url || out.audio_url || out.choices?.[0]?.message?.content?.[0]?.audio?.url || out.choices?.[0]?.message?.audio?.url || out.result_url;
          if (!audioUrl) {
            console.error(`[${cfg.model}] Missing audio URL in synchronous response:`, JSON.stringify(data, null, 2));
            throw new Error(`[${cfg.model}] No audio URL returned in synchronous response.`);
          }
          console.log(`[DashScopeMedia] Synchronous TTS generated successfully: ${audioUrl}`);
          return audioUrl;
        }
      } catch (e: any) {
        console.warn(`[DashScopeMedia] TTS model ${cfg.model} failed (${e.message}). Trying next model...`);
        lastErr = e;
      }
    }

    throw lastErr || new Error("All DashScope TTS models failed.");
  }

  private static async pollAudioTask(taskId: string): Promise<string> {
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 2000));
      let data: any;
      try {
        const res = await fetch(`https://dashscope-intl.aliyuncs.com/api/v1/tasks/${taskId}`, {
          headers: { "Authorization": `Bearer ${this.getApiKey()}` }
        });
        if (!res.ok) {
          console.warn(`[DashScopeMedia] Audio poll #${i + 1} HTTP ${res.status} for task ${taskId}. Retrying...`);
          continue;
        }
        data = await res.json();
      } catch (err: any) {
        console.warn(`[DashScopeMedia] Network/DNS error during audio poll #${i + 1} for task ${taskId}: ${err.message}. Retrying on next tick...`);
        continue;
      }

      if (data.output?.task_status === "SUCCEEDED") {
        const out = data.output;
        return out.url || out.audio_url || out.choices?.[0]?.message?.content?.[0]?.audio?.url || out.choices?.[0]?.message?.audio?.url || out.result_url;
      }
      if (data.output?.task_status === "FAILED") {
        throw new Error(`[Task ${taskId} FAILED] Audio generation failed: ${JSON.stringify(data.output)}`);
      }
    }
    throw new Error(`[Task ${taskId} timeout] Audio generation timeout after 30 seconds`);
  }

  // 3. Wan 2.7 Video Generation -> Polls directly until finished (v7 Hybrid Architecture)
  static async generateVideo(prompt: string, imageUrl?: string): Promise<string> {
    if (process.env.USE_MOCK_MEDIA === "true") {
      console.log(`[DashScopeMedia] MOCK MODE: Generating mock video for prompt: "${prompt}"`);
      await new Promise(r => setTimeout(r, 3000));
      return "https://www.w3schools.com/html/mov_bbb.mp4";
    }

    const key = this.getApiKey();
    if (!key) throw new Error("DASHSCOPE_API_KEY is not configured.");

    // Try i2v first if image is available, fallback to t2v ONLY if the initial
    // submission request failed (client/format error). If a task_id was obtained
    // but polling timed out, throw immediately to prevent double-charge.
    if (imageUrl) {
      try {
        return await this.submitVideoTask(key, "wan2.7-i2v", prompt, imageUrl);
      } catch (e: any) {
        // ONLY fallback if it was explicitly an initial Submission Error (e.g. invalid image format or 400 Bad Request).
        // If a task was already submitted (polling error, timeout, or network issue after submission), NEVER fallback!
        if (!e.message?.includes('Submission Error')) {
          throw e; // Re-throw: task was already submitted or network failed, DO NOT double-charge!
        }
        console.warn(`[DashScopeMedia] wan2.7-i2v submission failed (${e.message}), falling back to wan2.7-t2v without image`);
      }
    }
    
    return await this.submitVideoTask(key, "wan2.7-t2v", prompt);
  }

  private static async submitVideoTask(key: string, model: string, prompt: string, imageUrl?: string): Promise<string> {
    console.log(`[DashScopeMedia] Using video model: ${model}${imageUrl ? ' with image ref' : ''}`);
    const input: any = { prompt };
    // wan2.7-i2v expects "media" field as an array of objects [{ type: "first_frame", url: "..." }]
    if (imageUrl) {
      input.media = [
        { type: "first_frame", url: imageUrl }
      ];
    }

    let response: Response;
    let data: any;
    try {
      response = await fetch("https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-DashScope-Async": "enable",
          "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({ model, input })
      });
      data = await response.json();
    } catch (err: any) {
      throw new Error(`[${model} Submission Error] Network/fetch failed during task submission: ${err.message}`);
    }

    if (data.code && data.code !== "200") {
      throw new Error(`[${model} Submission Error] ${data.message}`);
    }

    const taskId = data.output?.task_id;
    if (!taskId) {
      throw new Error(`[${model} Submission Error] No task_id returned in response: ${JSON.stringify(data)}`);
    }

    console.log(`[DashScopeMedia] Video task submitted: ${taskId}`);
    return this.pollVideoTask(taskId);
  }

  private static async pollVideoTask(taskId: string): Promise<string> {
    // Poll every 10 seconds for up to 10 minutes (60 iterations)
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 10000));
      let data: any;
      try {
        const res = await fetch(`https://dashscope-intl.aliyuncs.com/api/v1/tasks/${taskId}`, {
          headers: { "Authorization": `Bearer ${this.getApiKey()}` }
        });
        if (!res.ok) {
          console.warn(`[DashScopeMedia] Video poll #${i + 1} HTTP ${res.status} for task ${taskId}. Retrying...`);
          continue;
        }
        data = await res.json();
      } catch (err: any) {
        console.warn(`[DashScopeMedia] Network/DNS error during video poll #${i + 1} for task ${taskId}: ${err.message}. Retrying on next tick...`);
        continue;
      }

      console.log(`[DashScopeMedia] Video poll #${i + 1}: status=${data.output?.task_status}`);

      if (data.output?.task_status === "SUCCEEDED") {
        return data.output.video_url;
      }
      if (data.output?.task_status === "FAILED") {
        const errMsg = data.output?.message || data.message || "Video generation failed";
        console.error(`[DashScopeMedia] Video FAILED:`, JSON.stringify(data, null, 2));
        throw new Error(`[Task ${taskId} FAILED] ${errMsg}`);
      }
    }
    throw new Error(`[Task ${taskId} timeout] Video generation timeout after 10 minutes`);
  }
}
