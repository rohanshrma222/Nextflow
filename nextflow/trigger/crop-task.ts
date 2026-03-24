import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ffmpeg from 'fluent-ffmpeg';
import { task } from '@trigger.dev/sdk/v3';
import { uploadToTransloadit } from './lib/transloadit';

interface CropPayload {
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CropResult {
  outputUrl: string;
}

interface ProbeData {
  streams?: Array<{
    width?: number;
    height?: number;
  }>;
}

function getImageExtension(imageUrl: string): string {
  const supportedExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);

  function normalizeExtension(rawExt: string | undefined): string {
    const ext = rawExt?.trim().toLowerCase();

    if (!ext || !supportedExtensions.has(ext)) {
      return 'jpg';
    }

    return ext;
  }

  try {
    if (imageUrl.startsWith('/')) {
      return normalizeExtension(imageUrl.split('.').pop());
    }

    const url = new URL(imageUrl);
    return normalizeExtension(url.pathname.split('.').pop());
  } catch {
    return 'jpg';
  }
}

async function readInputBuffer(imageUrl: string): Promise<Buffer> {
  if (imageUrl.startsWith('/')) {
    const localPath = path.join(process.cwd(), 'public', imageUrl.replace(/^\/+/, ''));
    return fs.readFileSync(localPath);
  }

  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

function probeImageDimensions(inputPath: string): Promise<{
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (error, data: ProbeData) => {
      if (error) {
        reject(error);
        return;
      }

      const stream = data.streams?.find((item) => item.width && item.height);

      if (!stream?.width || !stream?.height) {
        reject(new Error('Could not determine image dimensions'));
        return;
      }

      resolve({ width: stream.width, height: stream.height });
    });
  });
}

function runCrop(
  inputPath: string,
  outputPath: string,
  cropW: number,
  cropH: number,
  cropX: number,
  cropY: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoFilter(`crop=${cropW}:${cropH}:${cropX}:${cropY}`)
      .outputOptions([
        '-frames:v 1',
        '-f image2',
        '-update 1',
        '-y',
      ])
      .outputOptions(['-c:v png'])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (error) => reject(error))
      .run();
  });
}

function clampToEven(value: number) {
  const floored = Math.floor(value);
  return floored % 2 === 0 ? floored : floored - 1;
}

export const cropImageTask = task({
  id: 'crop-image',
  run: async (payload: CropPayload): Promise<CropResult> => {
    const runId = `crop_${Date.now()}`;
    const inputExt = getImageExtension(payload.imageUrl);
    const tempDir = os.tmpdir();
    const inputPath = path.join(tempDir, `${runId}_input.${inputExt}`);
    const outputPath = path.join(tempDir, `${runId}_output.png`);

    console.log('Crop task started', payload);

    try {
      console.log('Downloading image', payload.imageUrl);
      const inputBuffer = await readInputBuffer(payload.imageUrl);
      fs.writeFileSync(inputPath, inputBuffer);

      console.log('Probing image dimensions');
      const { width: imgWidth, height: imgHeight } =
        await probeImageDimensions(inputPath);

      let cropW = clampToEven(imgWidth * (payload.width / 100));
      let cropH = clampToEven(imgHeight * (payload.height / 100));
      let cropX = clampToEven(imgWidth * (payload.x / 100));
      let cropY = clampToEven(imgHeight * (payload.y / 100));

      if (cropX + cropW > imgWidth) {
        cropW = clampToEven(imgWidth - cropX);
      }

      if (cropY + cropH > imgHeight) {
        cropH = clampToEven(imgHeight - cropY);
      }

      if (cropX < 0) cropX = 0;
      if (cropY < 0) cropY = 0;

      if (cropW < 2 || cropH < 2) {
        throw new Error('Invalid crop dimensions');
      }

      console.log('Running FFmpeg crop', { cropW, cropH, cropX, cropY });

      try {
        await runCrop(inputPath, outputPath, cropW, cropH, cropX, cropY);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        throw new Error(`FFmpeg crop failed: ${message}`);
      }

      console.log('Uploading cropped image to Transloadit');
      const outputUrl = await uploadToTransloadit(outputPath, 'image/png');

      console.log('Crop task completed', outputUrl);
      return { outputUrl };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.startsWith('Failed to download image')) {
        throw error;
      }

      if (message.startsWith('FFmpeg crop failed')) {
        throw error;
      }

      if (message.includes('Transloadit')) {
        throw new Error(`Upload failed: ${message}`);
      }

      throw new Error(message || 'Crop task failed');
    } finally {
      try {
        fs.unlinkSync(inputPath);
      } catch {}

      try {
        fs.unlinkSync(outputPath);
      } catch {}
    }
  },
});
