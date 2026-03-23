import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

interface TransloaditAssemblyResult {
  ssl_url?: string;
  url?: string;
  name?: string;
  size?: number;
  mime?: string;
}

interface TransloaditAssembly {
  ok?: string;
  error?: string;
  message?: string;
  assembly_ssl_url?: string;
  uploads?: TransloaditAssemblyResult[];
  results?: Record<string, TransloaditAssemblyResult[]>;
}

const TRANSLOADIT_ASSEMBLIES_URL = 'https://api2.transloadit.com/assemblies';

function getUploadedUrl(assembly: TransloaditAssembly): string {
  return (
    assembly.results?.[':original']?.[0]?.ssl_url ||
    assembly.uploads?.[0]?.ssl_url ||
    ''
  );
}

async function pollAssembly(url: string, attempts = 0): Promise<string> {
  if (attempts > 80) {
    throw new Error('Transloadit upload timed out');
  }

  const response = await fetch(url, { cache: 'no-store' });
  const data = (await response.json()) as TransloaditAssembly;

  if (data.error) {
    throw new Error(`Assembly failed: ${data.message || data.error}`);
  }

  const uploadedUrl = getUploadedUrl(data);

  if (data.ok === 'ASSEMBLY_COMPLETED' && uploadedUrl) {
    return uploadedUrl;
  }

  if (uploadedUrl && data.ok === 'ASSEMBLY_EXECUTING') {
    return uploadedUrl;
  }

  await new Promise((resolve) => setTimeout(resolve, 1500));
  return pollAssembly(url, attempts + 1);
}

async function uploadToTransloadit(
  filePath: string,
  mimeType: string,
): Promise<string> {
  if (
    !process.env.TRANSLOADIT_KEY ||
    !process.env.TRANSLOADIT_SECRET ||
    !process.env.TRANSLOADIT_PROCESSED_TEMPLATE_ID
  ) {
    throw new Error(
      'Missing Transloadit env vars. Set TRANSLOADIT_KEY, TRANSLOADIT_SECRET, and TRANSLOADIT_PROCESSED_TEMPLATE_ID.',
    );
  }

  const params = JSON.stringify({
    auth: {
      key: process.env.TRANSLOADIT_KEY,
      expires: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    },
    template_id: process.env.TRANSLOADIT_PROCESSED_TEMPLATE_ID,
  });

  const signature =
    'sha384:' +
    crypto
      .createHmac('sha384', process.env.TRANSLOADIT_SECRET)
      .update(Buffer.from(params, 'utf-8'))
      .digest('hex');

  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);

  const formData = new FormData();
  formData.append('params', params);
  formData.append('signature', signature);
  formData.append(
    'file',
    new Blob([fileBuffer], { type: mimeType }),
    fileName,
  );

  const response = await fetch(TRANSLOADIT_ASSEMBLIES_URL, {
    method: 'POST',
    body: formData,
  });

  const assembly = (await response.json()) as TransloaditAssembly;

  if (!response.ok || assembly.error) {
    throw new Error(
      `Transloadit error: ${assembly.message || assembly.error || 'Upload failed'}`,
    );
  }

  const initialUrl = getUploadedUrl(assembly);

  if (initialUrl) {
    return initialUrl;
  }

  if (!assembly.assembly_ssl_url) {
    throw new Error('Transloadit upload failed: missing assembly_ssl_url');
  }

  return pollAssembly(assembly.assembly_ssl_url);
}

export { uploadToTransloadit };
