import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";

export default function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
}: EdgeProps) {
  const { setEdges } = useReactFlow();
  
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeClick = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    setEdges((edges) => edges.filter((e) => e.id !== id));
  };

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{ 
          ...style, 
          strokeWidth: selected ? 3 : 2, 
          stroke: selected ? "#18a0fb" : "#666666",
          transition: "stroke 0.2s, stroke-width 0.2s"
        }} 
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className={`nodrag nopan transition-opacity duration-200 ${
            selected ? "opacity-100" : "opacity-0 hover:opacity-100"
          }`}
        >
          <button
            className="w-5 h-5 bg-[#1e1e1e] border border-[#444444] rounded-full text-[#8c8c8c] flex items-center justify-center hover:text-[#f24e1e] hover:border-[#f24e1e] hover:bg-[#2c2c2c] cursor-pointer shadow-md text-xs leading-none"
            onClick={onEdgeClick}
            title="Delete connection"
          >
            ✕
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
