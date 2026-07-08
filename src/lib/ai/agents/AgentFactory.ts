import { AgentType } from "../../engine/types";
import { BaseAgent } from "./BaseAgent";
import {
  InputAgent,
  ProducerAgent,
  WriterAgent,
  ActorAgent,
  ReviewerAgent,
  TTSAgent,
  VideoGeneratorAgent,
  TelegramAgent,
  CloudAgent,
} from "./Agents";

export class AgentFactory {
  /**
   * Creates an instance of a specific Agent based on the AgentType.
   */
  static create(agentType: AgentType): BaseAgent {
    switch (agentType) {
      case "input":
        return new InputAgent();
      case "producer":
        return new ProducerAgent();
      case "writer":
        return new WriterAgent();
      case "actor":
        return new ActorAgent();
      case "reviewer":
        return new ReviewerAgent();
      case "tts":
        return new TTSAgent();
      case "video":
        return new VideoGeneratorAgent();
      case "telegram":
        return new TelegramAgent();
      case "cloud":
        return new CloudAgent();
      default:
        throw new Error(`Unsupported agent type: ${agentType}`);
    }
  }
}
