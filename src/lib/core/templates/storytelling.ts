import { TemplateContext, WajibTemplateResult } from "./types";

export function buildStorytellingTemplate(ctx: TemplateContext, wajibNodes: WajibTemplateResult) {
  const { addNode, addEdge, SPY } = ctx;
  const { writerNode, videoGenNode } = wajibNodes;

  // Posisikan TTS di jalur bawah, membentuk "Diamond" dengan Reviewer di atas
  const ttsX = videoGenNode.position.x - 300;
  const ttsY = SPY + 180;
  const ttsNode = addNode("tts", ttsX, ttsY, "Bacakan narasi dari naskah ini dengan nada antusias.");
  
  if (ttsX === writerNode.position.x) {
    // Basic template: TTS tepat di bawah Writer
    addEdge(writerNode.id, ttsNode.id, "source-bottom", "target-top");
  } else {
    // Precise/Advance: TTS di tengah-tengah Writer dan Video (membentuk diagonal rapi)
    addEdge(writerNode.id, ttsNode.id, "source-bottom", "target-left");
  }
  
  // TTS menyatu ke Video dari jalur bawah
  addEdge(ttsNode.id, videoGenNode.id, "source-right", "target-bottom");
}
