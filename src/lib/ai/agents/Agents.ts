import { BaseAgent } from "./BaseAgent";
import { AGENT_ROLE_PROMPTS } from "../../engine/prompts";

export class InputAgent extends BaseAgent {
  protected readonly rolePrompt = AGENT_ROLE_PROMPTS.input;
}

export class ProducerAgent extends BaseAgent {
  protected readonly rolePrompt = AGENT_ROLE_PROMPTS.producer;
}

export class WriterAgent extends BaseAgent {
  protected readonly rolePrompt = AGENT_ROLE_PROMPTS.writer;
}

export class ActorAgent extends BaseAgent {
  protected readonly rolePrompt = AGENT_ROLE_PROMPTS.actor;
}

export class ReviewerAgent extends BaseAgent {
  protected readonly rolePrompt = AGENT_ROLE_PROMPTS.reviewer;
}

export class TTSAgent extends BaseAgent {
  protected readonly rolePrompt = AGENT_ROLE_PROMPTS.tts;
}

export class VideoGeneratorAgent extends BaseAgent {
  protected readonly rolePrompt = AGENT_ROLE_PROMPTS.video;
}

export class TelegramAgent extends BaseAgent {
  protected readonly rolePrompt = AGENT_ROLE_PROMPTS.telegram;
}

export class CloudAgent extends BaseAgent {
  protected readonly rolePrompt = AGENT_ROLE_PROMPTS.cloud;
}
