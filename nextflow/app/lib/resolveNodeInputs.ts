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

    const nextValue = sourceNode.data?.output || sourceNode.data?.outputUrl || sourceNode.data?.content;

    if (typeof inputs[edge.targetHandle] === 'undefined') {
      inputs[edge.targetHandle] = nextValue;
      continue;
    }

    if (Array.isArray(inputs[edge.targetHandle])) {
      (inputs[edge.targetHandle] as unknown[]).push(nextValue);
      continue;
    }

    inputs[edge.targetHandle] = [inputs[edge.targetHandle], nextValue];
  }

  return inputs;
}

export { resolveNodeInputs };
