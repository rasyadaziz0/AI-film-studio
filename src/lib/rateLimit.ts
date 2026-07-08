import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const getLimit = (envVar: string | undefined, defaultVal: number) => {
  if (!envVar) return defaultVal;
  const parsed = parseInt(envVar, 10);
  return isNaN(parsed) ? defaultVal : parsed;
};

// --- Per-user rate limiters ---

/** Text generation: 15 calls per 10 min per user */
export const textGenRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(getLimit(process.env.MAX_TEXT_GEN_PER_10M, 15), "10 m"),
  prefix: "ratelimit:textgen",
});

/** Image generation: per 10 min per user */
export const imageGenRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(getLimit(process.env.MAX_IMAGE_GEN_PER_10M, 10), "10 m"),
  prefix: "ratelimit:imagegen",
});

/** Pipeline execution: per 10 min per user */
export const pipelineRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(getLimit(process.env.MAX_PIPELINE_RUNS_PER_10M, 5), "10 m"),
  prefix: "ratelimit:pipeline",
});

// --- Per-IP rate limiter (fallback layer) ---

/** Per-IP fallback: 30 calls per 10 min */
export const ipRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "10 m"),
  prefix: "ratelimit:ip",
});

// --- Per-studio rate limiter ---

/** Per-studio pipeline: 3 runs per 10 min */
export const studioPipelineRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "10 m"),
  prefix: "ratelimit:studio",
});

// --- Global emergency limiter ---

/** Global: 100 API calls per minute across all users */
export const globalRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(getLimit(process.env.GLOBAL_RATE_LIMIT_PER_MIN, 100), "1 m"),
  prefix: "ratelimit:global",
});

// --- Helper to enforce multiple limiters at once ---

export class RateLimitError extends Error {
  constructor(message = "Rate limit exceeded") {
    super(message);
    this.name = "RateLimitError";
  }
}

export async function enforceRateLimits(
  limiters: Array<{ limiter: Ratelimit; key: string; label?: string }>
): Promise<void> {
  for (const { limiter, key, label } of limiters) {
    const { success } = await limiter.limit(key);
    if (!success) {
      throw new RateLimitError(
        `Rate limit exceeded${label ? ` (${label})` : ""}. Mohon tunggu beberapa menit.`
      );
    }
  }
}
