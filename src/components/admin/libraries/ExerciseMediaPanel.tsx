import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { ImagePlus, Upload } from "lucide-react";
import type { AdminConfirmRequest } from "@/components/admin/AdminConfirmDialog";
import {
  canonicalPathForAsset,
  previewExerciseMediaUrl,
  replaceAdminExerciseMedia,
  replaceConfirmCopy,
  thumbnailStatusLabel,
  validateExerciseMediaFile,
  videoStatusLabel,
  type ExerciseMediaAssetType,
} from "@/lib/admin/admin-exercise-media";
import type { AdminExerciseDetail } from "@/lib/admin/admin-exercises-api";

type Props = {
  draft: AdminExerciseDetail;
  canUpload: boolean;
  onUpdated: (next: AdminExerciseDetail) => void;
  onConfirm: (request: AdminConfirmRequest) => void;
};

type SlotState = {
  busy: boolean;
  error: string | null;
  preview: string | null;
  pending: File | null;
};

const emptySlot: SlotState = { busy: false, error: null, preview: null, pending: null };

export function ExerciseMediaPanel({ draft, canUpload, onUpdated, onConfirm }: Props) {
  const [video, setVideo] = useState<SlotState>(emptySlot);
  const [instructions, setInstructions] = useState<SlotState>(emptySlot);
  const [thumb, setThumb] = useState<SlotState>(emptySlot);
  const videoInput = useRef<HTMLInputElement>(null);
  const instructionsInput = useRef<HTMLInputElement>(null);
  const thumbInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    void previewExerciseMediaUrl(draft.video_status === "ready" ? draft.video_path : null).then((url) => {
      if (!cancelled) setVideo((prev) => ({ ...prev, preview: url }));
    });
    void previewExerciseMediaUrl(draft.instructions_status === "ready" ? draft.instructions_video_path : null).then((url) => {
      if (!cancelled) setInstructions((prev) => ({ ...prev, preview: url }));
    });
    void previewExerciseMediaUrl(draft.thumbnail_path).then((url) => {
      if (!cancelled) setThumb((prev) => ({ ...prev, preview: url }));
    });
    return () => {
      cancelled = true;
    };
  }, [draft.video_path, draft.video_status, draft.instructions_video_path, draft.instructions_status, draft.thumbnail_path, draft.updated_at]);

  const pick = (asset: ExerciseMediaAssetType, file: File | undefined, setter: (next: SlotState | ((prev: SlotState) => SlotState)) => void) => {
    if (!file) return;
    const err = validateExerciseMediaFile(file, asset);
    if (err) {
      setter((prev) => ({ ...prev, error: err.message, pending: null }));
      return;
    }
    setter({ busy: false, error: null, pending: file, preview: URL.createObjectURL(file) });
  };

  const commit = (asset: ExerciseMediaAssetType, file: File) => {
    const copy = replaceConfirmCopy(draft.external_id, asset);
    onConfirm({
      title: copy.title,
      body: copy.body,
      confirmLabel: copy.confirmLabel,
      impact: "الوسائط فقط. لا يتغير المعرف أو الاسم أو برامج العملاء.",
      subjectLabel: `${draft.external_id} — ${draft.name_ar || draft.name_en}`,
      onConfirm: async () => {
        const setter = asset === "thumbnail" ? setThumb : asset === "instructions_video" ? setInstructions : setVideo;
        setter((prev) => ({ ...prev, busy: true, error: null }));
        try {
          const next = await replaceAdminExerciseMedia({
            exerciseId: draft.id,
            externalId: draft.external_id,
            asset,
            file,
            expectedUpdatedAt: draft.updated_at,
          });
          setter({ busy: false, error: null, pending: null, preview: null });
          onUpdated(next);
        } catch (error) {
          setter((prev) => ({
            ...prev,
            busy: false,
            error: error instanceof Error ? error.message : "فشل الرفع. أعد المحاولة.",
          }));
        }
      },
    });
  };

  return (
    <section className="cc-media-panel" aria-labelledby="exercise-media-heading">
      <h3 id="exercise-media-heading">إدارة الوسائط</h3>
      <p className="cc-muted">استبدل الفيديو أو الصورة لنفس التمرين. المعرف والاسم لا يتغيران.</p>
      <MediaCard
        title="الصورة المصغرة"
        status={thumbnailStatusLabel(draft.thumbnail_path)}
        path={draft.thumbnail_path ? canonicalPathForAsset(draft.external_id, "thumbnail") : null}
        preview={
          thumb.preview ? (
            <img src={thumb.preview} alt={`صورة تمرين ${draft.name_ar || draft.name_en}`} className="cc-media-panel__img" />
          ) : null
        }
        pending={thumb.pending}
        busy={thumb.busy}
        error={thumb.error}
        canUpload={canUpload && Boolean(draft.id)}
        uploadLabel={draft.thumbnail_path ? "استبدال الصورة" : "رفع صورة"}
        accept="image/jpeg,image/png,image/webp"
        inputRef={thumbInput}
        onPick={(file) => pick("thumbnail", file, setThumb)}
        onConfirm={() => thumb.pending && commit("thumbnail", thumb.pending)}
        onCancel={() => setThumb((prev) => ({ ...prev, pending: null, error: null }))}
        onRetry={() => thumb.pending && commit("thumbnail", thumb.pending)}
        kind="image"
      />
      <MediaCard
        title="فيديو التمرين"
        status={video.busy ? "جارٍ الرفع" : videoStatusLabel(draft.video_status)}
        path={canonicalPathForAsset(draft.external_id, "exercise_video")}
        preview={
          video.preview && draft.video_status === "ready" && !video.pending ? (
            <video className="cc-media-panel__video" src={video.preview} controls preload="metadata" />
          ) : video.pending ? (
            <p className="cc-muted">{video.pending.name} — {(video.pending.size / (1024 * 1024)).toFixed(1)} MB</p>
          ) : null
        }
        pending={video.pending}
        busy={video.busy}
        error={video.error}
        canUpload={canUpload && Boolean(draft.id)}
        uploadLabel={draft.video_status === "ready" ? "استبدال الفيديو" : "رفع فيديو"}
        accept="video/mp4"
        inputRef={videoInput}
        onPick={(file) => pick("exercise_video", file, setVideo)}
        onConfirm={() => video.pending && commit("exercise_video", video.pending)}
        onCancel={() => setVideo((prev) => ({ ...prev, pending: null, error: null }))}
        onRetry={() => video.pending && commit("exercise_video", video.pending)}
        kind="video"
      />
      <MediaCard
        title="فيديو التعليمات"
        status={instructions.busy ? "جارٍ الرفع" : videoStatusLabel(draft.instructions_status)}
        path={canonicalPathForAsset(draft.external_id, "instructions_video")}
        optional
        preview={
          instructions.preview && draft.instructions_status === "ready" && !instructions.pending ? (
            <video className="cc-media-panel__video" src={instructions.preview} controls preload="metadata" />
          ) : instructions.pending ? (
            <p className="cc-muted">{instructions.pending.name}</p>
          ) : null
        }
        pending={instructions.pending}
        busy={instructions.busy}
        error={instructions.error}
        canUpload={canUpload && Boolean(draft.id)}
        uploadLabel={draft.instructions_status === "ready" ? "استبدال الفيديو" : "رفع فيديو"}
        accept="video/mp4"
        inputRef={instructionsInput}
        onPick={(file) => pick("instructions_video", file, setInstructions)}
        onConfirm={() => instructions.pending && commit("instructions_video", instructions.pending)}
        onCancel={() => setInstructions((prev) => ({ ...prev, pending: null, error: null }))}
        onRetry={() => instructions.pending && commit("instructions_video", instructions.pending)}
        kind="video"
      />
    </section>
  );
}

function MediaCard({
  title,
  status,
  path,
  preview,
  pending,
  busy,
  error,
  canUpload,
  uploadLabel,
  accept,
  inputRef,
  onPick,
  onConfirm,
  onCancel,
  onRetry,
  optional,
  kind,
}: {
  title: string;
  status: string;
  path: string | null;
  preview: ReactNode;
  pending: File | null;
  busy: boolean;
  error: string | null;
  canUpload: boolean;
  uploadLabel: string;
  accept: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onPick: (file: File | undefined) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onRetry: () => void;
  optional?: boolean;
  kind: "image" | "video";
}) {
  return (
    <article className="cc-media-card">
      <header className="cc-media-card__head">
        <h4>{title}</h4>
        <span className="cc-media-card__status">{busy ? "جارٍ الرفع" : status}</span>
      </header>
      {optional ? <p className="cc-muted">اختياري — غيابه لا يؤثر على فيديو التمرين.</p> : null}
      <div className="cc-media-card__preview">
        {preview ?? (
          <p className="cc-muted">{kind === "image" ? "لا توجد صورة" : "لا توجد معاينة"}</p>
        )}
      </div>
      {path ? (
        <p className="cc-media-card__path" dir="ltr">
          مسار التخزين: {path}
        </p>
      ) : null}
      {error ? <p className="cc-field__error">{error}</p> : null}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(event) => {
          onPick(event.target.files?.[0]);
          event.currentTarget.value = "";
        }}
      />
      {canUpload ? (
        <div className="cc-media-card__actions">
          <button type="button" className="cc-btn cc-btn--primary" disabled={busy} onClick={() => inputRef.current?.click()}>
            {kind === "image" ? <ImagePlus size={16} aria-hidden /> : <Upload size={16} aria-hidden />}
            {uploadLabel}
          </button>
          {pending ? (
            <>
              <button type="button" className="cc-btn cc-btn--primary" disabled={busy} onClick={onConfirm}>
                تأكيد الرفع
              </button>
              <button type="button" className="cc-btn cc-btn--ghost" disabled={busy} onClick={onCancel}>
                إلغاء
              </button>
            </>
          ) : null}
          {error ? (
            <button type="button" className="cc-btn cc-btn--ghost" disabled={busy} onClick={onRetry}>
              إعادة المحاولة
            </button>
          ) : null}
        </div>
      ) : (
        <p className="cc-muted">المعاينة متاحة. الرفع مخصص للمشرف.</p>
      )}
    </article>
  );
}
