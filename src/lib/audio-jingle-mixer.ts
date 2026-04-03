import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import * as mm from "music-metadata";

export const MAX_JINGLE_DURATION_SEC = 12;
const TRANSITION_FADE_SEC = 0.25;
const DUCKING_WINDOW_SEC = 0.35;
const ANNOUNCEMENT_DUCKING_DB = -5;

interface MixParams {
  announcementBuffer: Buffer;
  jingleBuffer: Buffer;
  position: "intro" | "outro";
  volumeDb: number;
}

function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const proc = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";

    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    proc.on("error", (error) => {
      reject(error);
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr || `ffmpeg exited with code ${code}`));
    });
  });
}

async function assertFfmpegAvailable() {
  try {
    await runFfmpeg(["-version"]);
  } catch (error: unknown) {
    if (error instanceof Error && /ENOENT|not found/i.test(error.message)) {
      throw new Error(
        "ffmpeg не найден на сервере. Установите ffmpeg (macOS: brew install ffmpeg, Docker Alpine: apk add --no-cache ffmpeg)."
      );
    }
    throw error;
  }
}

function dbToLinear(db: number): string {
  return (10 ** (db / 20)).toFixed(4);
}

export async function mixAnnouncementWithJingle({
  announcementBuffer,
  jingleBuffer,
  position,
  volumeDb,
}: MixParams): Promise<Buffer> {
  await assertFfmpegAvailable();

  const jingleMeta = await mm.parseBuffer(jingleBuffer, "audio/mpeg");
  const announcementMeta = await mm.parseBuffer(announcementBuffer, "audio/mpeg");

  const jingleDurationSec = Math.max(0, jingleMeta.format.duration || 0);
  const announcementDurationSec = Math.max(0, announcementMeta.format.duration || 0);

  if (jingleDurationSec <= 0) {
    throw new Error("Не удалось определить длительность джингла");
  }

  if (jingleDurationSec > MAX_JINGLE_DURATION_SEC) {
    throw new Error(`Джингл слишком длинный: максимум ${MAX_JINGLE_DURATION_SEC} секунд`);
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "bizmusic-jingle-"));
  const jingleInput = path.join(tmpDir, "jingle-input.mp3");
  const announcementInput = path.join(tmpDir, "announcement-input.mp3");
  const outputFile = path.join(tmpDir, "mixed-output.mp3");

  try {
    await fs.writeFile(jingleInput, jingleBuffer);
    await fs.writeFile(announcementInput, announcementBuffer);

    const first = position === "intro" ? jingleInput : announcementInput;
    const second = position === "intro" ? announcementInput : jingleInput;
    const safeFade = Math.min(TRANSITION_FADE_SEC, Math.max(0.05, jingleDurationSec / 2));
    const jingleFadeOutStart = Math.max(0, jingleDurationSec - safeFade);
    const duckGainLinear = dbToLinear(ANNOUNCEMENT_DUCKING_DB);
    const duckWindow = Math.min(DUCKING_WINDOW_SEC, Math.max(0.1, announcementDurationSec));
    const duckOutroStart = Math.max(0, announcementDurationSec - duckWindow);

    const filter = position === "intro"
      ? `[0:a]volume=${volumeDb}dB,afade=t=in:st=0:d=${safeFade},afade=t=out:st=${jingleFadeOutStart}:d=${safeFade}[j];[1:a]volume='if(lt(t,${duckWindow}),${duckGainLinear},1)'[a];[j][a]concat=n=2:v=0:a=1[out]`
      : `[0:a]volume='if(gte(t,${duckOutroStart}),${duckGainLinear},1)'[a];[1:a]volume=${volumeDb}dB,afade=t=in:st=0:d=${safeFade},afade=t=out:st=${jingleFadeOutStart}:d=${safeFade}[j];[a][j]concat=n=2:v=0:a=1[out]`;

    await runFfmpeg([
      "-y",
      "-i",
      first,
      "-i",
      second,
      "-filter_complex",
      filter,
      "-map",
      "[out]",
      "-ar",
      "44100",
      "-ac",
      "2",
      "-c:a",
      "libmp3lame",
      "-b:a",
      "192k",
      outputFile,
    ]);

    return await fs.readFile(outputFile);
  } catch (error: unknown) {
    if (error instanceof Error && /ENOENT|not found/i.test(error.message)) {
      throw new Error("ffmpeg не найден на сервере. Установите ffmpeg для смешивания джинглов.");
    }
    throw error instanceof Error ? error : new Error("Не удалось смешать джингл с анонсом");
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}
