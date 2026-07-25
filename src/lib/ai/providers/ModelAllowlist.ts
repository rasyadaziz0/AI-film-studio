/**
 * Server-side model allowlist.
 * Only these models may be used. Request for any other model → hard 400 error.
 */
export const ALLOWED_MODELS = new Set([
  "qwen-flash",      // Fast & cheap — classifier, reviewer, scene splitter
  "qwen-plus",       // Balanced — script, storyboard
  "qwen3-max",       // Premium — final/complex generation
]);

/**
 * Validates and returns the model string.
 * Throws if model is not in the allowlist.
 */
export function validateModel(model?: string): string {
  if (!model) return "qwen-plus"; // default
  if (model === "qwen3.5-flash") return "qwen-flash"; // Legacy DB mapping
  if (!ALLOWED_MODELS.has(model)) {
    throw new Error(
      `Model "${model}" is not allowed. Allowed models: ${[...ALLOWED_MODELS].join(", ")}`
    );
  }
  return model;
}
