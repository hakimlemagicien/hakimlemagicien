const MAX_IMAGE_EDGE = 1600;
const IMAGE_QUALITY = 0.82;

export async function compressChatImage(file: File): Promise<{ blob: Blob; mimeType: string; fileName: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("image_compress_failed");
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", IMAGE_QUALITY);
  });
  if (blob && blob.size > 0) {
    return { blob, mimeType: "image/webp", fileName: "image.webp" };
  }

  const jpeg = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", IMAGE_QUALITY);
  });
  if (!jpeg) throw new Error("image_compress_failed");
  return { blob: jpeg, mimeType: "image/jpeg", fileName: "image.jpg" };
}

export function pickVoiceRecorderMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

export function voiceExtension(mimeType: string) {
  if (mimeType.includes("mp4") || mimeType.includes("aac")) return "m4a";
  if (mimeType.includes("mpeg")) return "mp3";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
}
