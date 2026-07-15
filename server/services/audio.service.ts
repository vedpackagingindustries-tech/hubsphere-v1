import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { Logger } from "../middleware/logger";

const RECORDINGS_DIR = path.join(process.cwd(), "recordings");
if (!fs.existsSync(RECORDINGS_DIR)) {
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
}

export function convertWebmToMp3(tempWebmPath: string, finalMp3Path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    Logger.info(`Starting asynchronous FFmpeg conversion from ${tempWebmPath} to ${finalMp3Path}`);
    // Perform WebM/Audio to MP3 conversion using ffmpeg asynchronously
    exec(`ffmpeg -y -i "${tempWebmPath}" -vn -ar 44100 -ac 2 -b:a 128k "${finalMp3Path}"`, (error, stdout, stderr) => {
      // Always cleanup temporary WebM file
      try {
        if (fs.existsSync(tempWebmPath)) {
          fs.unlinkSync(tempWebmPath);
        }
      } catch (unlinkErr) {
        Logger.error("Failed to delete temporary WebM file", unlinkErr);
      }

      if (error) {
        Logger.error("FFmpeg conversion command failed", error);
        reject(error);
      } else {
        Logger.info(`Successfully completed FFmpeg conversion: ${path.basename(finalMp3Path)}`);
        resolve();
      }
    });
  });
}

export async function saveAudioFromBase64(base64Data: string, telecallerName: string, leadName: string): Promise<{ customRecordingId: string; mimeType: string }> {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const timeString = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const telecallerClean = telecallerName.replace(/[^a-zA-Z0-9]/g, "_");
  const leadClean = leadName.replace(/[^a-zA-Z0-9]/g, "_");

  const customRecordingId = `${telecallerClean}_to_${leadClean}_at_${timeString}.mp3`;
  const finalMp3Path = path.join(RECORDINGS_DIR, customRecordingId);

  const cleanBase64 = base64Data.replace(/^data:audio\/\w+;base64,/, "");
  const buffer = Buffer.from(cleanBase64, "base64");

  const tempWebmName = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}.webm`;
  const tempWebmPath = path.join(RECORDINGS_DIR, tempWebmName);

  await fs.promises.writeFile(tempWebmPath, buffer);

  // Trigger conversion in the background asynchronously so the client doesn't wait
  convertWebmToMp3(tempWebmPath, finalMp3Path).catch((err) => {
    Logger.error("Background WebM to MP3 conversion failed, doing raw fallback", err);
    try {
      if (fs.existsSync(tempWebmPath) && !fs.existsSync(finalMp3Path)) {
        fs.renameSync(tempWebmPath, finalMp3Path);
      }
    } catch (renameErr) {
      Logger.error("Raw fallback rename failed", renameErr);
    }
  });

  return { customRecordingId, mimeType: "audio/mpeg" };
}

export async function saveAudioFromFile(fileBuffer: Buffer, telecallerName: string, leadName: string): Promise<{ customRecordingId: string; mimeType: string }> {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const timeString = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const telecallerClean = telecallerName.replace(/[^a-zA-Z0-9]/g, "_");
  const leadClean = leadName.replace(/[^a-zA-Z0-9]/g, "_");

  const customRecordingId = `${telecallerClean}_to_${leadClean}_at_${timeString}.mp3`;
  const finalMp3Path = path.join(RECORDINGS_DIR, customRecordingId);

  const tempWebmName = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}.webm`;
  const tempWebmPath = path.join(RECORDINGS_DIR, tempWebmName);

  await fs.promises.writeFile(tempWebmPath, fileBuffer);

  // Trigger conversion in the background asynchronously so the client doesn't wait
  convertWebmToMp3(tempWebmPath, finalMp3Path).catch((err) => {
    Logger.error("Background WebM to MP3 conversion failed from uploaded file, doing raw fallback", err);
    try {
      if (fs.existsSync(tempWebmPath) && !fs.existsSync(finalMp3Path)) {
        fs.renameSync(tempWebmPath, finalMp3Path);
      }
    } catch (renameErr) {
      Logger.error("Raw fallback rename failed", renameErr);
    }
  });

  return { customRecordingId, mimeType: "audio/mpeg" };
}
