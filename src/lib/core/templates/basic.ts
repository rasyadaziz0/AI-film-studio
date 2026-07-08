import { TemplateContext, WajibTemplateResult } from "./types";

export function buildBasicTemplate(ctx: TemplateContext): WajibTemplateResult {
  const { addNode, addEdge, SPY } = ctx;

  const producerNode = addNode("producer", 100, SPY, "Buatlah konsep cerita pendek yang menarik dengan visual style yang jelas.");
  const writerNode = addNode("writer", 400, SPY, "Pecah konsep tersebut menjadi 3 scene. Deskripsikan visual dan narasinya.");
  const videoGenNode = addNode("video", 700, SPY, "Render video berdasarkan scene yang ditulis.");

  addEdge(producerNode.id, writerNode.id, "source-right", "target-left");
  addEdge(writerNode.id, videoGenNode.id, "source-right", "target-left");

  return { producerNode, writerNode, videoGenNode };
}
