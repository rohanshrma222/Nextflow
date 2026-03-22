'use client';
import { EdgeProps, getBezierPath } from 'reactflow';

export function AnimatedEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  const strokeColor = (style.stroke as string) ?? '#9b6dff';

  return (
    <g>
      {/* Glow layer */}
      <path
        id={`${id}-glow`}
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={4}
        strokeOpacity={0.15}
        strokeDasharray="5 3"
      />
      {/* Main animated path */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeDasharray="5 3"
        markerEnd={markerEnd}
        style={{
          ...style,
          animation: 'dashFlow 1.2s linear infinite',
          filter: `drop-shadow(0 0 3px ${strokeColor}80)`,
        }}
      />
      <style>{`@keyframes dashFlow { to { stroke-dashoffset: -20; } }`}</style>
    </g>
  );
}
