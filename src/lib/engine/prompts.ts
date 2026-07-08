
// ------ Agent Role Prompts (System Prompts) ------

export const AGENT_ROLE_PROMPTS = {
  input:
    "You are the Input Node. Return the input text exactly as provided.",

  producer:
    'You are a Video Producer. Return JSON: { "concept": "...", "genre": "..." }',

  writer:
    'You are a Writer. Write a 3-scene script. Output JSON: { "scenes": [ { "scene": 1, "visuals": "...", "narration": "..." } ] }',

  actor:
    "You are an Actor. Describe the main character's appearance and personality in 2 sentences.",

  reviewer:
    'You are a Reviewer. Return JSON: { "verdict": "approve"|"revise", "feedback": "..." }',

  tts:
    "You are a TTS Module. Output ONLY the raw spoken narration text to be read aloud by the voice actor. Do NOT include introductory remarks, labels, titles, or prefixes like 'Narasi:' or 'Speech synthesis:'. Start directly with the first word of the script.",

  video:
    "You are a Video Generator. Output visual prompts for Wan.",

  telegram:
    "You are a Publisher. Format post for Telegram.",

  cloud:
    "You are a Cloud Storage Publisher. Format metadata for Cloudflare R2 upload.",
} as const;

// ------ User Prompt Template (BaseAgent) ------

export const USER_PROMPT_TEMPLATES = {
  /**
   * Builds the final user prompt by combining upstream context and user instructions.
   */
  buildUserPrompt: (userInput: string, upstreamContext: string): string => {
    let finalPrompt = "";
    if (upstreamContext) {
      finalPrompt += `--- UPSTREAM CONTEXT ---\n${upstreamContext}\n\n`;
    }
    if (userInput) {
      finalPrompt += `--- INSTRUCTIONS ---\n${userInput}\n\n`;
    }

    if (!finalPrompt) {
      finalPrompt = "Please generate your output based on your role.";
    }

    return finalPrompt;
  },
};

// ------ Reviewer Feedback Injection ------

export const REVIEWER_PROMPTS = {
  /**
   * Injects reviewer feedback into the writer's label for a revision loop.
   */
  injectFeedback: (originalLabel: string, feedback: string): string =>
    `${originalLabel}\n\nFEEDBACK REVISI SEBELUMNYA:\n${feedback}`,
};

// ------ Video Stitching Prompts ------

export const VIDEO_PROMPTS = {
  /**
   * Prompt for splitting a long narrative into N short visual scene descriptions
   * suitable for 5-second video generation clips.
   */
  getSceneSplitterPrompt: (narrative: string, clipCount: number) =>
    `You are a visual scene splitter for AI video generation.

Given this narrative/story context:
---
${narrative}
---

Split this into exactly ${clipCount} short, vivid visual scene descriptions (each for a 5-second video clip).
Each scene should be a VISUAL description (not dialogue) that an AI video model can render.
Focus on cinematic visuals, camera angles, and movement.

Output ONLY a JSON array of strings, nothing else. Example:
["Scene 1 visual description...", "Scene 2 visual description...", "Scene 3 visual description..."]`,

  /**
   * Fallback prompt when the AI fails to split the scenes properly.
   */
  getFallbackScenePrompt: (narrative: string, index: number) =>
    `${narrative}\n\n[Continue from second ${index * 5} to second ${(index + 1) * 5}. Show the next part of the scene with natural camera movement.]`,
};

// ------ Per-Node Model Configuration ------

export interface NodeModelConfig {
  defaultModel: string;
  maxTokens: number;
  enableThinking: boolean;
}

export const NODE_MODEL_CONFIG: Record<string, NodeModelConfig> = {
  input:     { defaultModel: "qwen3.5-flash", maxTokens: 100,  enableThinking: false },
  producer:  { defaultModel: "qwen-plus",     maxTokens: 800,  enableThinking: false },
  writer:    { defaultModel: "qwen-plus",     maxTokens: 1000, enableThinking: false },
  reviewer:  { defaultModel: "qwen3.5-flash", maxTokens: 256,  enableThinking: false },
  actor:     { defaultModel: "qwen3.5-flash", maxTokens: 200,  enableThinking: false },
  tts:       { defaultModel: "qwen3.5-flash", maxTokens: 400,  enableThinking: false },
  video:     { defaultModel: "qwen3.5-flash", maxTokens: 400,  enableThinking: false },
  telegram:  { defaultModel: "qwen3.5-flash", maxTokens: 300,  enableThinking: false },
  cloud:     { defaultModel: "qwen3.5-flash", maxTokens: 200,  enableThinking: false },
};
