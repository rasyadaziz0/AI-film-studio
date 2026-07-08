import { TemplateContext, WajibTemplateResult } from "./types";

export function buildPreciseTemplate(ctx: TemplateContext): WajibTemplateResult {
  const { addNode, addEdge, SPY } = ctx;

  const producerNode = addNode("producer", 100, SPY, "Buat konsep cerita pendek dengan detail visual yang tajam.");
  const writerNode = addNode("writer", 400, SPY, "Tulis naskah dengan 3 scene yang terstruktur.");
  
  // Posisikan Reviewer di atas untuk membentuk "Diamond Shape" dengan TTS nanti
  const reviewerNode = addNode("reviewer", 700, SPY - 160, "Review naskah ini. Pastikan visualnya masuk akal untuk dirender.");
  
  const videoGenNode = addNode("video", 1000, SPY, "Render video dari naskah yang sudah di-approve.");

  // === Content spine: Producer → Writer → Video (story content always flows here) ===
  addEdge(producerNode.id, writerNode.id, "source-right", "target-left");
  addEdge(writerNode.id, videoGenNode.id, "source-right", "target-left");

  // === Review loop (quality gate, NOT content source for video) ===
  addEdge(writerNode.id, reviewerNode.id, "source-top", "target-left");
  addEdge(reviewerNode.id, videoGenNode.id, "source-right", "target-top");

  return { producerNode, writerNode, videoGenNode };
}
