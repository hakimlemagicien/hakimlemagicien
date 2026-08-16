import { useEffect, useRef, useState, type FormEvent } from "react";
import { Mic, Paperclip, Play, Send, Square, Trash2, X } from "lucide-react";
import { compressChatImage, pickVoiceRecorderMime, voiceExtension } from "@/lib/platform/coaching-media";
import { COACHING_VOICE_MAX_MS } from "@/lib/platform/coaching-messaging";

export type ChatComposerPayload =
  | { kind: "text"; text: string }
  | { kind: "image"; file: Blob; mimeType: string; fileName: string; previewUrl: string }
  | { kind: "voice"; file: Blob; mimeType: string; fileName: string; durationMs: number };

export function CoachChatComposer({
  disabled,
  sending,
  onSend,
}: {
  disabled?: boolean;
  sending?: boolean;
  onSend: (payload: ChatComposerPayload) => Promise<void> | void;
}) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<{ blob: Blob; mimeType: string; fileName: string; previewUrl: string } | null>(
    null,
  );
  const [voice, setVoice] = useState<{ blob: Blob; mimeType: string; fileName: string; durationMs: number; url: string } | null>(
    null,
  );
  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);

  useEffect(() => {
    return () => {
      stopRecorder(true);
      if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl);
      if (voice?.url) URL.revokeObjectURL(voice.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount cleanup only
  }, []);

  function stopTimer() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }

  function stopRecorder(discard = false) {
    stopTimer();
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (discard) chunksRef.current = [];
    setRecording(false);
  }

  async function startRecording() {
    setMicError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setMicError("التسجيل الصوتي غير متاح على هذا المتصفح.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickVoiceRecorderMime();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        const durationMs = Math.min(Date.now() - startedAtRef.current, COACHING_VOICE_MAX_MS);
        stream.getTracks().forEach((track) => track.stop());
        if (blob.size === 0) return;
        setVoice({
          blob,
          mimeType: type.split(";")[0],
          fileName: `voice.${voiceExtension(type)}`,
          durationMs,
          url: URL.createObjectURL(blob),
        });
      };
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      setElapsedMs(0);
      setRecording(true);
      recorder.start();
      timerRef.current = window.setInterval(() => {
        const next = Date.now() - startedAtRef.current;
        setElapsedMs(Math.min(next, COACHING_VOICE_MAX_MS));
        if (next >= COACHING_VOICE_MAX_MS) stopRecorder();
      }, 200);
    } catch {
      setMicError("لم يتم السماح بالميكروفون. يمكنك كتابة رسالة أو إرفاق صورة.");
    }
  }

  async function onPickImage(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    setCompressing(true);
    try {
      const compressed = await compressChatImage(file);
      if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl);
      setImage({
        ...compressed,
        previewUrl: URL.createObjectURL(compressed.blob),
      });
      setVoice(null);
    } catch {
      setMicError("تعذر تجهيز الصورة. حاول بصورة أصغر.");
    } finally {
      setCompressing(false);
    }
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (disabled || sending) return;
    if (voice) {
      const payload = voice;
      setVoice(null);
      URL.revokeObjectURL(payload.url);
      await onSend({
        kind: "voice",
        file: payload.blob,
        mimeType: payload.mimeType,
        fileName: payload.fileName,
        durationMs: payload.durationMs,
      });
      return;
    }
    if (image) {
      const payload = image;
      setImage(null);
      await onSend({
        kind: "image",
        file: payload.blob,
        mimeType: payload.mimeType,
        fileName: payload.fileName,
        previewUrl: payload.previewUrl,
      });
      return;
    }
    const next = text.trim();
    if (!next) return;
    setText("");
    await onSend({ kind: "text", text: next });
  }

  const seconds = Math.floor(elapsedMs / 1000);

  return (
    <form className="coach-chat__composer" dir="ltr" onSubmit={(event) => void submit(event)}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          void onPickImage(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {recording ? (
        <div className="coach-chat__record" dir="rtl">
          <span className="coach-chat__record-dot" aria-hidden />
          <span>{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")} / 01:00</span>
          <button type="button" className="coach-chat__icon-btn" aria-label="إلغاء التسجيل" onClick={() => stopRecorder(true)}>
            <X className="h-4 w-4" />
          </button>
          <button type="button" className="coach-chat__send" aria-label="إيقاف التسجيل" onClick={() => stopRecorder()}>
            <Square className="h-4 w-4" />
          </button>
        </div>
      ) : voice ? (
        <div className="coach-chat__preview" dir="rtl">
          <audio src={voice.url} controls preload="metadata" />
          <button type="button" className="coach-chat__icon-btn" aria-label="حذف التسجيل" onClick={() => {
            URL.revokeObjectURL(voice.url);
            setVoice(null);
          }}>
            <Trash2 className="h-4 w-4" />
          </button>
          <button type="submit" className="coach-chat__send" aria-label="إرسال التسجيل" disabled={sending}>
            <Send className="h-4 w-4" />
          </button>
        </div>
      ) : image ? (
        <div className="coach-chat__preview" dir="rtl">
          <img src={image.previewUrl} alt="معاينة الصورة" className="coach-chat__preview-img" />
          <button type="button" className="coach-chat__icon-btn" aria-label="حذف الصورة" onClick={() => {
            URL.revokeObjectURL(image.previewUrl);
            setImage(null);
          }}>
            <X className="h-4 w-4" />
          </button>
          <button type="submit" className="coach-chat__send" aria-label="إرسال الصورة" disabled={sending}>
            <Send className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            className="coach-chat__plus"
            aria-label="إرفاق صورة"
            disabled={disabled || compressing}
            onClick={() => fileRef.current?.click()}
          >
            <Paperclip className="h-5 w-5" strokeWidth={2.2} />
          </button>
          <label className="coach-chat__field" dir="rtl">
            <span className="sr-only">اكتب رسالتك</span>
            <button
              type="button"
              className="coach-chat__mic"
              aria-label="تسجيل رسالة صوتية"
              disabled={disabled}
              onClick={() => void startRecording()}
            >
              <Mic className="h-4 w-4" strokeWidth={2} />
            </button>
            <input
              ref={inputRef}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="اكتب رسالتك..."
              autoComplete="off"
              enterKeyHint="send"
              disabled={disabled}
            />
          </label>
          <button type="submit" className="coach-chat__send" aria-label="إرسال" disabled={disabled || sending || !text.trim()}>
            <Send className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </>
      )}
      {micError ? <p className="coach-chat__composer-error" dir="rtl">{micError}</p> : null}
    </form>
  );
}

export function VoiceMessage({ src, durationMs }: { src: string; durationMs: number | null }) {
  const seconds = Math.max(1, Math.round((durationMs ?? 0) / 1000));
  return (
    <div className="coach-chat__voice">
      <Play className="h-4 w-4" aria-hidden />
      <audio src={src} controls preload="none" />
      <span>{seconds}ث</span>
    </div>
  );
}
