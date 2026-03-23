import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { defineConfig } from '@trigger.dev/sdk/v3';
import { ffmpeg } from '@trigger.dev/build/extensions/core';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
}

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_ID!,
  runtime: 'node',
  logLevel: 'log',
  maxDuration: 300,
  build: {
    extensions: [ffmpeg()],
    external: ['fluent-ffmpeg'],
  },
  dirs: ['./trigger'],
});
