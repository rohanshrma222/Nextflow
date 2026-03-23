import { Node } from 'reactflow';
import { NodeType } from '../types';

let toastTimeout: ReturnType<typeof setTimeout> | null = null;

export function showToast(message: string) {
  if (typeof window === 'undefined') return;
  const existing = document.getElementById('nf-toast');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.id = 'nf-toast';
  el.textContent = message;
  el.style.cssText = `
    position: fixed;
    bottom: 72px;
    left: 50%;
    transform: translateX(-50%);
    background: #1e1e1e;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 12px;
    color: #a0a0a0;
    z-index: 9999;
    font-family: 'Geist', sans-serif;
    white-space: nowrap;
    animation: toastIn 0.2s ease forwards;
    pointer-events: none;
  `;

  const style = document.createElement('style');
  style.textContent = `@keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(8px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`;
  document.head.appendChild(style);
  document.body.appendChild(el);

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.remove(), 2500);
}

let nodeIdCounter = 1;

export function createNodeId(): string {
  return `n-${Date.now()}-${nodeIdCounter++}`;
}

export function buildNode(type: NodeType, position: { x: number; y: number }): Node {
  const id = createNodeId();
  const widths: Record<NodeType, number> = {
    text: 230, image: 240, video: 240, llm: 270, crop: 255, frame: 245,
  };
  const outputTypes: Record<NodeType, string> = {
    text: 'text', image: 'image', video: 'video', llm: 'text', crop: 'image', frame: 'image',
  };
  return {
    id,
    type,
    position,
    data: {
      label: type,
      status: 'idle' as const,
      outputType: outputTypes[type],
      output: type === 'text' ? '' : null,
    },
    style: { width: widths[type] },
  };
}

export function buildSampleWorkflow(): { nodes: Node[]; edges: import('reactflow').Edge[] } {
  // ── BRANCH A ──
  const t1 = buildNode('text',  { x: 60,  y: 80  });
  const t2 = buildNode('text',  { x: 60,  y: 300 });
  const img = buildNode('image', { x: 340, y: 80  });
  const crop = buildNode('crop', { x: 630, y: 80  });
  const llm1 = buildNode('llm',  { x: 940, y: 160 });

  // ── BRANCH B ──
  const vid   = buildNode('video', { x: 60,  y: 560 });
  const frame = buildNode('frame', { x: 340, y: 560 });

  // ── CONVERGENCE ──
  const t3   = buildNode('text', { x: 650, y: 440 });
  const llm2 = buildNode('llm',  { x: 1260, y: 380 });

  // Pre-fill data
  t1.data.content = 'You are a professional marketing copywriter. Generate a compelling one-paragraph product description.';
  t2.data.content = 'Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design.';
  t3.data.content = 'You are a social media manager. Create a tweet-length marketing post based on the product image and video frame.';
  crop.data.cropW = '80';
  crop.data.cropH = '80';
  frame.data.timestamp = '50%';

  const edge = (id: string, source: string, sh: string, target: string, th: string, type = 'text') => ({
    id,
    source,
    sourceHandle: sh,
    target,
    targetHandle: th,
    animated: true,
    style: {
      stroke: type === 'image' ? '#4ade80' : type === 'video' ? '#fbbf24' : '#9b6dff',
      strokeWidth: 1.5,
      strokeDasharray: '5 3',
    },
  });

  const edges = [
    edge('e1', t1.id,   'output', llm1.id, 'system_prompt', 'text'),
    edge('e2', t2.id,   'output', llm1.id, 'user_message',  'text'),
    edge('e3', img.id,  'output', crop.id, 'image_url',     'image'),
    edge('e4', crop.id, 'output', llm1.id, 'images',        'image'),
    edge('e5', vid.id,  'output', frame.id,'video_url',     'video'),
    edge('e6', t3.id,   'output', llm2.id, 'system_prompt', 'text'),
    edge('e7', llm1.id, 'output', llm2.id, 'user_message',  'text'),
    edge('e8', crop.id, 'output', llm2.id, 'images',        'image'),
    edge('e9', frame.id,'output', llm2.id, 'images',        'image'),
  ];

  return { nodes: [t1, t2, img, crop, llm1, vid, frame, t3, llm2], edges };
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatTimestamp(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

// Simulate an async node execution (replace with real API calls)
export async function simulateNodeRun(
  nodeType: string,
  onProgress?: (msg: string) => void
): Promise<{ output: string; durationMs: number }> {
  const delays: Record<string, number> = {
    text: 300, image: 1200, video: 1400, llm: 2800, crop: 1800, frame: 2200,
  };
  const delay = delays[nodeType] ?? 1500;

  if (onProgress) onProgress('Running…');
  await new Promise((r) => setTimeout(r, delay));

  const outputs: Record<string, string[]> = {
    llm: [
      'Introducing our premium Wireless Bluetooth Headphones — where exceptional audio meets modern design. With 30 hours of battery life and advanced noise cancellation, these headphones deliver an immersive listening experience whether you\'re commuting or creating.',
      'Transform your audio experience with headphones designed for the modern creator. Featuring studio-quality sound, seamless device switching, and a foldable design that fits your lifestyle.',
    ],
    crop:  ['https://cdn.transloadit.com/crop/result-v2.jpg'],
    frame: ['https://cdn.transloadit.com/frame/result-50pct.jpg'],
    image: ['https://cdn.transloadit.com/img/uploaded-product.jpg'],
    video: ['https://cdn.transloadit.com/vid/uploaded-demo.mp4'],
    text:  ['Text content ready for downstream nodes'],
  };

  const pool = outputs[nodeType] ?? ['Processed successfully'];
  const output = pool[Math.floor(Math.random() * pool.length)];
  return { output, durationMs: delay };
}
