export interface GraphNode {
  id: string;
  studio_id: string;
  type: string;
  label?: string;
  position_x: number;
  position_y: number;
  role_prompt?: string;
  user_input?: string;
  model?: string;
  config?: any;
  output?: string;
  output_url?: string;
  status?: string;
}

export interface GraphEdge {
  id: string;
  studio_id: string;
  source_node_id: string;
  target_node_id: string;
  source_handle?: string;
  target_handle?: string;
}

export class PipelineGraphScheduler {
  public static sort(nodes: GraphNode[], edges: GraphEdge[]): string[] {
    const adj = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    nodes.forEach((n) => {
      adj.set(n.id, []);
      inDegree.set(n.id, 0);
    });

    edges.forEach((e) => {
      adj.get(e.source_node_id)?.push(e.target_node_id);
      inDegree.set(e.target_node_id, (inDegree.get(e.target_node_id) || 0) + 1);
    });

    const queue: string[] = [];
    inDegree.forEach((degree, id) => {
      if (degree === 0) queue.push(id);
    });

    const sorted: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      sorted.push(current);

      adj.get(current)?.forEach((neighbor) => {
        inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      });
    }

    if (sorted.length !== nodes.length) {
      throw new Error("Cycle detected in the graph");
    }

    return sorted;
  }
}
