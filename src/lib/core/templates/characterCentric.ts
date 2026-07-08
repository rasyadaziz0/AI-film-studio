import { TemplateContext, WajibTemplateResult } from "./types";

export function buildCharacterCentricTemplate(ctx: TemplateContext, wajibNodes: WajibTemplateResult) {
  const { addNode, addEdge, SPY } = ctx;
  const { writerNode, videoGenNode } = wajibNodes;

  const actorNode = addNode("actor", 100, SPY - 280, "Desain karakter utama yang konsisten dan menarik untuk cerita ini.");

  // Actor -> Writer
  addEdge(actorNode.id, writerNode.id, "source-right", "target-top");

  addEdge(actorNode.id, videoGenNode.id, "source-top", "target-top");
}
