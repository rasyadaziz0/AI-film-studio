import { useCallback } from "react";
import { useStudioStore } from "@/store/useStudioStore";
import { AgentType } from "../nodes/AgentNode";

export function useCanvasDragDrop(
  reactFlowInstance: any,
  reactFlowWrapper: React.RefObject<HTMLDivElement | null>
) {
  const { addNode, saveHistory } = useStudioStore();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance || !reactFlowWrapper.current) return;

      const type = event.dataTransfer.getData("application/reactflow") as AgentType;

      if (!type) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      addNode(type, position);
    },
    [reactFlowInstance, addNode, reactFlowWrapper]
  );

  const onNodeDragStart = useCallback(() => {
    saveHistory();
  }, [saveHistory]);

  return { onDragOver, onDrop, onNodeDragStart };
}
