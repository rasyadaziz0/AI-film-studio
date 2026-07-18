import { BaseNodeHandler } from "./BaseNodeHandler";
import { ActorHandler } from "./ActorHandler";
import { VideoHandler } from "./VideoHandler";
import { TTSHandler } from "./TTSHandler";
import { ReviewerHandler } from "./ReviewerHandler";
import { CloudHandler } from "./CloudHandler";
import { TelegramSendHandler } from "./TelegramSendHandler";
import { DefaultTextHandler } from "./DefaultTextHandler";
import { InputHandler } from "./InputHandler";

export class NodeHandlerFactory {
  public static getHandler(nodeType: string): BaseNodeHandler {
    switch (nodeType) {
      case "actor":
        return new ActorHandler();
      case "video":
        return new VideoHandler();
      case "tts":
        return new TTSHandler();
      case "reviewer":
        return new ReviewerHandler();
      case "cloud":
        return new CloudHandler();
      case "telegram":
        return new TelegramSendHandler();
      case "input":
      case "telegram_trigger":
        return new InputHandler();
      default:
        return new DefaultTextHandler();
    }
  }
}
