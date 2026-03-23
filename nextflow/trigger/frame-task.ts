import fs from 'node:fs';
import ffmpeg from 'fluent-ffmpeg';
import { task } from '@trigger.dev/sdk/v3';
import { uploadToTransloadit } from './lib/transloadit';

interface FramePayload {
  videoUrl: string;
  timestamp: string;
}

interface FrameResult {
  outputUrl: string;
}

interface ProbeData {
  format?: {
    duration?: number;
  };
}

function probeVideoDuration(inputPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (error, data: ProbeData) => {
      if (error) {
        reject(error);
        return;
      }

      const duration = data.format?.duration;

      if (!duration || Number.isNaN(duration)) {
        reject(new Error('Could not determine video duration'));
        return;
      }

      resolve(duration);
    });
  });
}

function extractFrame(
  inputPath: string,
  outputPath: string,
  seconds: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .seekInput(seconds)
      .outputOptions(['-frames:v 1', '-q:v 2', '-f image2'])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (error) => reject(error))
      .run();
  });
}

function getVideoExtension(videoUrl: string): string {
  try {
    const url = new URL(videoUrl);
    const rawExt = url.pathname.split('.').pop()?.trim().toLowerCase();

    if (!rawExt || rawExt.includes('/')) {
      return 'mp4';
    }

    return rawExt;
  } catch {
    return 'mp4';
  }
}

async function resolveTimestamp(
  inputPath: string,
  timestamp: string,
): Promise<number> {
  const trimmed = timestamp.trim();

  if (trimmed.endsWith('%')) {
    const percent = parseFloat(trimmed.slice(0, -1));

    if (Number.isNaN(percent)) {
      throw new Error('Invalid timestamp value');
    }

    const duration = await probeVideoDuration(inputPath);
    return (percent / 100) * duration;
  }

  const seconds = parseFloat(trimmed);

  if (Number.isNaN(seconds)) {
    throw new Error('Invalid timestamp value');
  }

  return seconds;
}

export const extractFrameTask = task({
  id: 'extract-frame',
  run: async (payload: FramePayload): Promise<FrameResult> => {
    const runId = `frame_${Date.now()}`;
    const ext = getVideoExtension(payload.videoUrl);
    const inputPath = `/tmp/${runId}_input.${ext}`;
    const outputPath = `/tmp/${runId}_output.jpg`;

    console.log('Frame extraction task started', payload);

    try {
      console.log('Downloading video', payload.videoUrl);
      const response = await fetch(payload.videoUrl);

      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.status}`);
      }

      const inputBuffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(inputPath, inputBuffer);

      console.log('Resolving timestamp', payload.timestamp);

      let seconds: number;

      try {
        seconds = await resolveTimestamp(inputPath, payload.timestamp);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to resolve timestamp: ${message}`);
      }

      console.log('Running FFmpeg frame extraction', { seconds });

      try {
        await extractFrame(inputPath, outputPath, seconds);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        throw new Error(`FFmpeg frame extraction failed: ${message}`);
      }

      console.log('Uploading extracted frame to Transloadit');
      const outputUrl = await uploadToTransloadit(outputPath, 'image/jpeg');

      console.log('Frame extraction task completed', outputUrl);
      return { outputUrl };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.startsWith('Failed to download video')) {
        throw error;
      }

      if (message.startsWith('Failed to resolve timestamp')) {
        throw error;
      }

      if (message.startsWith('FFmpeg frame extraction failed')) {
        throw error;
      }

      if (message.includes('Transloadit')) {
        throw new Error(`Upload failed: ${message}`);
      }

      throw new Error(message || 'Frame extraction failed');
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
