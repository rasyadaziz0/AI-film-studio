import { AIProvider } from "./AIProvider";
import { QwenProvider } from "./QwenProvider";

/**
 * Only Qwen (DashScope) is allowed. All other providers are rejected with a hard error.
 */
export class ProviderFactory {
  static create(providerType: string = "qwen"): AIProvider {
    if (providerType !== "qwen") {
      throw new Error(
        `Provider "${providerType}" is not allowed. Only "qwen" (DashScope) is permitted.`
      );
    }
    return new QwenProvider();
  }
}
