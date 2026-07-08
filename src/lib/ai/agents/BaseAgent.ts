import { USER_PROMPT_TEMPLATES } from "../../engine/prompts";

export abstract class BaseAgent {
  protected abstract readonly rolePrompt: string;

  public constructUserPrompt(userInput: string, upstreamContext: string): string {
    return USER_PROMPT_TEMPLATES.buildUserPrompt(userInput, upstreamContext);
  }
  public getSystemPrompt(): string {
    return this.rolePrompt;
  }
}
