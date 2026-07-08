import { AgentType } from "@/components/studio/nodes/AgentNode";
import { Node, Edge } from "@xyflow/react";
import { v4 as uuidv4 } from "uuid";

import { WajibTemplate, TambahanTemplate, TemplateData, TemplateContext, WajibTemplateResult } from "./templates/types";
import { buildBasicTemplate } from "./templates/basic";
import { buildPreciseTemplate } from "./templates/precise";
import { buildAdvanceTemplate } from "./templates/advance";
import { buildStorytellingTemplate } from "./templates/storytelling";
import { buildCharacterCentricTemplate } from "./templates/characterCentric";

export type { WajibTemplate, TambahanTemplate, TemplateData };

export function generateTemplateNodesAndEdges(
  wajib: WajibTemplate,
  tambahan: TambahanTemplate
): TemplateData {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const SPY = 250;

  const ctx: TemplateContext = {
    addNode: (type: AgentType, x: number, y: number, label: string = ""): Node => {
      const node: Node = {
        id: uuidv4(),
        type: "agentNode",
        position: { x, y },
        data: { type, label, status: "idle" },
      };
      nodes.push(node);
      return node;
    },
    addEdge: (source: string, target: string, sourceHandle?: string, targetHandle?: string) => {
      edges.push({
        id: uuidv4(),
        source,
        target,
        sourceHandle,
        targetHandle,
        type: "default",
        animated: true,
        markerEnd: { type: "arrowclosed" },
      });
    },
    SPY,
  };

  let wajibResult: WajibTemplateResult;

  if (wajib === "precise") {
    wajibResult = buildPreciseTemplate(ctx);
  } else if (wajib === "advance") {
    wajibResult = buildAdvanceTemplate(ctx);
  } else {
    // Fallback and 'basic'
    wajibResult = buildBasicTemplate(ctx);
  }

  if (tambahan === "storytelling") {
    buildStorytellingTemplate(ctx, wajibResult);
  } else if (tambahan === "character_centric") {
    buildCharacterCentricTemplate(ctx, wajibResult);
  }

  nodes.forEach((n) => {
    n.type = n.data.type as string;
  });

  console.log(`[templates] Generated ${nodes.length} nodes and ${edges.length} edges for wajib=${wajib}, tambahan=${tambahan}`);
  return { nodes, edges };
}
