import type { Edge, Node } from 'reactflow';

const SAMPLE_NODE_WIDTHS = {
  text: 230,
  image: 240,
  video: 240,
  llm: 270,
  crop: 255,
  frame: 245,
} as const;

const PURPLE_EDGE_STYLE = {
  stroke: '#9b6dff',
  strokeWidth: 1.5,
  strokeDasharray: '5 3',
} as const;

function buildSampleNodes(): Node[] {
  return [
  {
    id: 'sample-text-system-a',
    type: 'text',
    position: { x: 80, y: 60 },
    style: { width: SAMPLE_NODE_WIDTHS.text },
    data: {
      label: 'text',
      status: 'idle',
      outputType: 'text',
      content:
        'You are a professional marketing copywriter. Generate a compelling one-paragraph product description.',
      output:
        'You are a professional marketing copywriter. Generate a compelling one-paragraph product description.',
    },
  },
  {
    id: 'sample-text-details',
    type: 'text',
    position: { x: 80, y: 245 },
    style: { width: SAMPLE_NODE_WIDTHS.text },
    data: {
      label: 'text',
      status: 'idle',
      outputType: 'text',
      content:
        'Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design.',
      output:
        'Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design.',
    },
  },
  {
    id: 'sample-image',
    type: 'image',
    position: { x: 360, y: 60 },
    style: { width: SAMPLE_NODE_WIDTHS.image },
    data: {
      label: 'image',
      status: 'idle',
      outputType: 'image',
      previewUrl: null,
      outputUrl: null,
      fileName: null,
      output: null,
    },
  },
  {
    id: 'sample-crop',
    type: 'crop',
    position: { x: 655, y: 60 },
    style: { width: SAMPLE_NODE_WIDTHS.crop },
    data: {
      label: 'crop',
      status: 'idle',
      outputType: 'image',
      xPercent: 10,
      yPercent: 10,
      widthPercent: 80,
      heightPercent: 80,
      output: null,
    },
  },
  {
    id: 'sample-llm-description',
    type: 'llm',
    position: { x: 955, y: 135 },
    style: { width: SAMPLE_NODE_WIDTHS.llm },
    data: {
      label: 'llm',
      status: 'idle',
      outputType: 'text',
      model: 'gemini-2.5-flash',
      systemPrompt:
        'You are a professional marketing copywriter. Generate a compelling one-paragraph product description.',
      userMessage:
        'Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design.',
      output: '',
    },
  },
  {
    id: 'sample-video',
    type: 'video',
    position: { x: 360, y: 470 },
    style: { width: SAMPLE_NODE_WIDTHS.video },
    data: {
      label: 'video',
      status: 'idle',
      outputType: 'video',
      previewUrl: null,
      outputUrl: null,
      fileName: null,
      output: null,
    },
  },
  {
    id: 'sample-frame',
    type: 'frame',
    position: { x: 655, y: 470 },
    style: { width: SAMPLE_NODE_WIDTHS.frame },
    data: {
      label: 'frame',
      status: 'idle',
      outputType: 'image',
      timestamp: '50%',
      output: null,
    },
  },
  {
    id: 'sample-text-system-b',
    type: 'text',
    position: { x: 1110, y: 470 },
    style: { width: SAMPLE_NODE_WIDTHS.text },
    data: {
      label: 'text',
      status: 'idle',
      outputType: 'text',
      content:
        'You are a social media manager. Create a tweet-length marketing post based on the product image and video frame.',
      output:
        'You are a social media manager. Create a tweet-length marketing post based on the product image and video frame.',
    },
  },
  {
    id: 'sample-llm-summary',
    type: 'llm',
    position: { x: 1410, y: 245 },
    style: { width: SAMPLE_NODE_WIDTHS.llm },
    data: {
      label: 'llm',
      status: 'idle',
      outputType: 'text',
      model: 'gemini-2.5-flash',
      systemPrompt:
        'You are a social media manager. Create a tweet-length marketing post based on the product image and video frame.',
      userMessage: '',
      output: '',
    },
  },
  ];
}

const SAMPLE_EDGES: Edge[] = [
  {
    id: 'sample-e1',
    source: 'sample-text-system-a',
    sourceHandle: 'output',
    target: 'sample-llm-description',
    targetHandle: 'system_prompt',
    type: 'default',
    animated: true,
    style: PURPLE_EDGE_STYLE,
  },
  {
    id: 'sample-e2',
    source: 'sample-text-details',
    sourceHandle: 'output',
    target: 'sample-llm-description',
    targetHandle: 'user_message',
    type: 'default',
    animated: true,
    style: PURPLE_EDGE_STYLE,
  },
  {
    id: 'sample-e3',
    source: 'sample-image',
    sourceHandle: 'output',
    target: 'sample-crop',
    targetHandle: 'image',
    type: 'default',
    animated: true,
    style: PURPLE_EDGE_STYLE,
  },
  {
    id: 'sample-e4',
    source: 'sample-crop',
    sourceHandle: 'output',
    target: 'sample-llm-description',
    targetHandle: 'images',
    type: 'default',
    animated: true,
    style: PURPLE_EDGE_STYLE,
  },
  {
    id: 'sample-e5',
    source: 'sample-video',
    sourceHandle: 'output',
    target: 'sample-frame',
    targetHandle: 'video_url',
    type: 'default',
    animated: true,
    style: PURPLE_EDGE_STYLE,
  },
  {
    id: 'sample-e6',
    source: 'sample-text-system-b',
    sourceHandle: 'output',
    target: 'sample-llm-summary',
    targetHandle: 'system_prompt',
    type: 'default',
    animated: true,
    style: PURPLE_EDGE_STYLE,
  },
  {
    id: 'sample-e7',
    source: 'sample-llm-description',
    sourceHandle: 'output',
    target: 'sample-llm-summary',
    targetHandle: 'user_message',
    type: 'default',
    animated: true,
    style: PURPLE_EDGE_STYLE,
  },
  {
    id: 'sample-e8',
    source: 'sample-crop',
    sourceHandle: 'output',
    target: 'sample-llm-summary',
    targetHandle: 'images',
    type: 'default',
    animated: true,
    style: PURPLE_EDGE_STYLE,
  },
  {
    id: 'sample-e9',
    source: 'sample-frame',
    sourceHandle: 'output',
    target: 'sample-llm-summary',
    targetHandle: 'images',
    type: 'default',
    animated: true,
    style: PURPLE_EDGE_STYLE,
  },
];

export const SAMPLE_WORKFLOW_NAME = 'Product Marketing Kit Generator';

export function getSampleWorkflow(): { name: string; nodes: Node[]; edges: Edge[] } {
  const nodes = buildSampleNodes();

  return {
    name: SAMPLE_WORKFLOW_NAME,
    nodes: nodes.map((node) => ({
      ...node,
      position: { ...node.position },
      data: { ...(node.data as Record<string, unknown>) },
      style: node.style ? { ...node.style } : undefined,
    })),
    edges: SAMPLE_EDGES.map((edge) => ({
      ...edge,
      style: edge.style ? { ...edge.style } : undefined,
    })),
  };
}
