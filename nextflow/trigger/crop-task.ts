import fs from 'node:fs';
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

      const stream = data.streams?.[0];

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
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (error) => reject(error))
      .run();
  });
}

export const cropImageTask = task({
  id: 'crop-image',
  run: async (payload: CropPayload): Promise<CropResult> => {
    const runId = `crop_${Date.now()}`;
    const inputPath = `/tmp/${runId}_input.jpg`;
    const outputPath = `/tmp/${runId}_output.jpg`;

    console.log('Crop task started', payload);

    try {
      console.log('Downloading image', payload.imageUrl);
      const response = await fetch(payload.imageUrl);

      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }

      const inputBuffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(inputPath, inputBuffer);

      console.log('Probing image dimensions');
      const { width: imgWidth, height: imgHeight } =
        await probeImageDimensions(inputPath);

      let cropW = Math.floor(imgWidth * (payload.width / 100));
      let cropH = Math.floor(imgHeight * (payload.height / 100));
      const cropX = Math.floor(imgWidth * (payload.x / 100));
      const cropY = Math.floor(imgHeight * (payload.y / 100));

      if (cropX + cropW > imgWidth) {
        cropW = imgWidth - cropX;
      }

      if (cropY + cropH > imgHeight) {
        cropH = imgHeight - cropY;
      }

      if (cropW <= 0 || cropH <= 0) {
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
      const outputUrl = await uploadToTransloadit(outputPath, 'image/jpeg');

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
