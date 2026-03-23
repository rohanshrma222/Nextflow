import type { Edge, Node } from 'reactflow';

function resolveNodeInputs(
  nodeId: string,
  nodes: Node[],
  edges: Edge[],
): Record<string, unknown> {
  const incomingEdges = edges.filter((edge) => edge.target === nodeId);
  const inputs: Record<string, unknown> = {};

  for (const edge of incomingEdges) {
    if (!edge.targetHandle) {
      continue;
    }

    const sourceNode = nodes.find((node) => node.id === edge.source);

    if (!sourceNode) {
      continue;
    }

    inputs[edge.targetHandle] =
      sourceNode.data?.output ?? sourceNode.data?.outputUrl;
  }

  return inputs;
}

export { resolveNodeInputs };
