import { checkKillSwitch } from "./requireAuth";

/**
 * Estimates the cost in micro-USD for a pipeline run based on video duration.
 * 1 USD = 1,000,000 micro-USD.
 * Wan ~$0.50 per 5s clip, plus token overhead for text nodes.
 */
export function estimateCostMicroUsd(videoDuration: number): number {
  const clipCount = Math.max(1, Math.floor(videoDuration / 5));
  const videoCost = clipCount * 500_000; // $0.50 per clip in micro-USD
  const tokenCost = 50_000; // Text nodes estimate in micro-USD ($0.05)
  return videoCost + tokenCost;
}

/**
 * Pre-flight check before any AI generation.
 * Verifies kill switch is enabled.
 *
 * Budget reservation is now handled atomically by the ECS API
 * via the `create_job_and_reserve` PostgreSQL RPC.
 * This function remains as a client-side fail-fast guard.
 */
export async function checkBudgetAndKillSwitch(): Promise<void> {
  // Kill switch — fail-closed
  checkKillSwitch();

  // Budget reservation is handled atomically in the ECS API layer
  // via the create_job_and_reserve() RPC. No separate client-side
  // budget check is needed — the RPC does:
  //   1. Check daily_spend + active_reservations + estimate <= limit
  //   2. Insert job with reserved_cost
  //   3. Insert outbox entry
  // All in a single atomic transaction.
}
