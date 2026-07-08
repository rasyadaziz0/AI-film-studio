import { TemplateContext, WajibTemplateResult } from "./types";

export function buildAdvanceTemplate(ctx: TemplateContext): WajibTemplateResult {
  const { addNode, addEdge, SPY } = ctx;

  const producerNode = addNode("producer", 100, SPY, "Buat konsep cerita epic.");
  
  // Rev1 di bawah jalur utama biar tidak nabrak garis Actor -> Writer (jika ada)
  const rev1Node = addNode("reviewer", 400, SPY + 220, "Review konsep ini, pastikan sangat solid.");
  const writerNode = addNode("writer", 700, SPY, "Tulis naskah dari konsep yang sudah di-approve.");
  
  // Rev2 di atas jalur utama
  const rev2Node = addNode("reviewer", 1000, SPY - 220, "Review naskahnya. Revisi jika kurang detail.");
  const videoGenNode = addNode("video", 1300, SPY, "Render video akhir.");

  // === Content spine: Producer → Writer → Video (story content always flows here) ===
  addEdge(producerNode.id, writerNode.id, "source-right", "target-left");
  addEdge(writerNode.id, videoGenNode.id, "source-right", "target-left");

  // === Review loops (quality gate, NOT content source for downstream) ===
  // Tahap 1: Konsep review (Producer → Rev1 → Writer)
  addEdge(producerNode.id, rev1Node.id, "source-bottom", "target-left");
  addEdge(rev1Node.id, writerNode.id, "source-right", "target-bottom");

  // Tahap 2: Naskah review (Writer → Rev2 → Video)
  addEdge(writerNode.id, rev2Node.id, "source-top", "target-left");
  addEdge(rev2Node.id, videoGenNode.id, "source-right", "target-top");

  return { producerNode, writerNode, videoGenNode };
}
