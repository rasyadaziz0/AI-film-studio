import { AgentType } from "../AgentNode";
import { BaseNodePresenter } from "./BaseNodePresenter";
import {
  InputPresenter,
  ProducerPresenter,
  WriterPresenter,
  ActorPresenter,
  ReviewerPresenter,
  TTSPresenter,
  VideoPresenter,
  TelegramPresenter,
  CloudPresenter,
} from "./ConcretePresenters";

export class NodePresenterFactory {
  public static create(id: string, data: any, store: any): BaseNodePresenter {
    switch (data?.type as AgentType) {
      case "input":
        return new InputPresenter(id, data, store);
      case "producer":
        return new ProducerPresenter(id, data, store);
      case "writer":
        return new WriterPresenter(id, data, store);
      case "actor":
        return new ActorPresenter(id, data, store);
      case "reviewer":
        return new ReviewerPresenter(id, data, store);
      case "tts":
        return new TTSPresenter(id, data, store);
      case "video":
        return new VideoPresenter(id, data, store);
      case "telegram":
        return new TelegramPresenter(id, data, store);
      case "cloud":
        return new CloudPresenter(id, data, store);
      default:
        return new ProducerPresenter(id, data, store);
    }
  }
}
